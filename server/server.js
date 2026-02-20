const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'emails.json');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure emails file exists
function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ emails: [] }, null, 2));
  }
}

// Simple email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Read emails from file
function getEmails() {
  ensureDataFile();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return data.emails || [];
}

// Save emails to file
function saveEmails(emails) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ emails }, null, 2));
}

// POST /api/subscribe - collect email
app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  try {
    const emails = getEmails();
    if (emails.some((e) => e.email === trimmed)) {
      return res.status(200).json({ success: true, message: 'Already subscribed' });
    }

    emails.push({
      email: trimmed,
      subscribedAt: new Date().toISOString(),
    });
    saveEmails(emails);

    res.status(201).json({ success: true, message: 'Thank you! We\'ll send you updates.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to save email' });
  }
});

// GET /api/subscribers - list emails (for admin; add auth in production)
app.get('/api/subscribers', (req, res) => {
  try {
    const emails = getEmails();
    res.json({ emails });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load emails' });
  }
});

app.listen(PORT, () => {
  console.log(`Email API running at http://localhost:${PORT}`);
  ensureDataFile();
});
