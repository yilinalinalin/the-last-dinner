const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const EMAILS_FILE = path.join(__dirname, 'pitch-deck-requests.json');

app.use(express.json());

// Allow requests from your frontend (localhost:8000, etc.)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

function loadEmails() {
  try {
    const data = fs.readFileSync(EMAILS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveEmails(emails) {
  fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2));
}

app.post('/api/subscribe', (req, res) => {
  const email = req.body?.email?.trim();
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const emails = loadEmails();
  if (emails.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
    return res.json({ success: true }); // Already requested, treat as success
  }

  emails.push({
    email,
    requestedAt: new Date().toISOString(),
  });
  saveEmails(emails);

  console.log(`Pitch deck requested: ${email}`);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
