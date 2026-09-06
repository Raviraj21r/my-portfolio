import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { mkdir, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, 'public');
const dataDirectory = path.join(__dirname, 'portfolio-data');
const messagesFile = path.join(dataDirectory, 'messages.ndjson');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'https://my-portfolio-woad-rho-89.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
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
  if (!resend) {
    console.error('Email not sent: RESEND_API_KEY is missing.');
    return false;
  }

  try {
    await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: process.env.CONTACT_RECEIVER_EMAIL || 'ravikrsingho68068@gmail.com',
      replyTo: message.email,
      subject: `Portfolio contact: ${message.subject || 'New message'}`,
      text: `Name: ${message.name}\nEmail: ${message.email}\nSubject: ${message.subject || 'N/A'}\n\n${message.message}`
    });
    return true;
  } catch (error) {
    console.error('Resend email failed:', error);
    return false;
  }
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
    
    const emailSent = await sendNotification(entry);
    
    if (!emailSent) {
      return res.status(502).json({
        ok: false,
        saved: true,
        emailSent: false,
        error: 'Message was saved, but email delivery failed.'
      });
    }
    
    console.log(`Contact email sent via Resend!`);
    return res.status(201).json({ ok: true, saved: true, emailSent: true });
  } catch (error) {
    console.error('Contact submission failed:', error);
    return res.status(500).json({ error: 'Message could not be delivered. Please try again.' });
  }
});

app.listen(port, () => {
  console.log(`Portfolio running at http://localhost:${port}`);
});