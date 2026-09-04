import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import { mkdir, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, 'public');
const dataDirectory = path.join(__dirname, 'portfolio-data');
const messagesFile = path.join(dataDirectory, 'messages.ndjson');
const smtpRequired = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_RECEIVER_EMAIL'];
const smtpConfigured = smtpRequired.every((key) => Boolean(process.env[key]));
const transporter = smtpConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
}) : null;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || `http://localhost:${port}` }));
app.use(express.json({ limit: '20kb' }));
app.use(express.static(publicDirectory));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDirectory, 'index.html'));
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' }
});

function clean(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

async function sendNotification(message) {
  if (!transporter) {
    console.error('Email not sent: missing SMTP configuration. Required keys:', smtpRequired.join(', '));
    return false;
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.CONTACT_RECEIVER_EMAIL,
    replyTo: message.email,
    subject: `Portfolio contact: ${message.subject || 'New message'}`,
    text: `Name: ${message.name}\nEmail: ${message.email}\nSubject: ${message.subject || 'N/A'}\n\n${message.message}`
  });
  return true;
}

app.post('/api/contact', contactLimiter, async (req, res) => {
  const name = clean(req.body.name, 80);
  const email = clean(req.body.email, 160).toLowerCase();
  const subject = clean(req.body.subject, 160);
  const message = clean(req.body.message, 4000);

  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid name, email, and message.' });
  }

  const entry = { name, email, subject, message, createdAt: new Date().toISOString() };
  try {
    await mkdir(dataDirectory, { recursive: true });
    await appendFile(messagesFile, `${JSON.stringify(entry)}\n`, 'utf8');
    let emailSent = false;
    try {
      emailSent = await sendNotification(entry);
    } catch (emailError) {
      console.error('Contact email notification failed:', {
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        message: emailError.message
      });
    }
    if (!emailSent) {
      return res.status(502).json({
        ok: false,
        saved: true,
        emailSent: false,
        error: 'Message was saved, but email delivery is not configured or failed. Check server logs.'
      });
    }
    console.log(`Contact email sent to ${process.env.CONTACT_RECEIVER_EMAIL}`);
    return res.status(201).json({ ok: true, saved: true, emailSent: true });
  } catch (error) {
    console.error('Contact submission failed:', error);
    return res.status(500).json({ error: 'Message could not be delivered. Please try again.' });
  }
});

app.get('/api/messages', async (req, res) => {
  if (!process.env.ADMIN_TOKEN || req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const contents = await readFile(messagesFile, 'utf8').catch(() => '');
    const messages = contents.trim() ? contents.trim().split('\n').map((line) => JSON.parse(line)).reverse() : [];
    return res.json(messages);
  } catch {
    return res.status(500).json({ error: 'Could not read messages.' });
  }
});

app.listen(port, async () => {
  console.log(`Portfolio running at http://localhost:${port}`);
  if (!transporter) {
    console.warn('SMTP is not configured. Contact messages will be saved but email notifications cannot be sent.');
    return;
  }
  try {
    await transporter.verify();
    console.log(`SMTP connection verified for ${process.env.SMTP_USER}`);
  } catch (error) {
    console.error('SMTP connection verification failed:', {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message
    });
  }
});
