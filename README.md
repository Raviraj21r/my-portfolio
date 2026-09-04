# Ravi Kumar Portfolio

## Project structure

```text
portfilio/
|- public/
|  |- index.html
|  |- css/style.css
|  `- js/app.js
|- portfolio-data/       # private local message storage
|- server.js             # Express server and API
|- .env.example
|- package.json
`- README.md
```

## Run locally

1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env` and fill in the SMTP values.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000/`.

The contact form sends JSON to `POST /api/contact`. Every valid submission is saved in `portfolio-data/messages.ndjson`; when SMTP is configured, Nodemailer also sends an email notification to `CONTACT_RECEIVER_EMAIL`.

## Environment variables

- `PORT`: Express server port.
- `FRONTEND_ORIGIN`: allowed frontend origin.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`: email provider settings.
- `SMTP_USER`: sender email account.
- `SMTP_PASS`: provider app password, never your normal password.
- `CONTACT_RECEIVER_EMAIL`: inbox for visitor messages.
- `ADMIN_TOKEN`: private token for `GET /api/messages`.

To read saved messages locally:

```powershell
$headers = @{ Authorization = "Bearer YOUR_ADMIN_TOKEN" }
Invoke-RestMethod http://localhost:3000/api/messages -Headers $headers
```
