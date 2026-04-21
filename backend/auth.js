const express = require('express');
const fetch = global.fetch || require('node-fetch');

const router = express.Router();
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const FIREBASE_BASE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

if (!FIREBASE_API_KEY) {
  console.warn('FIREBASE_API_KEY is not set. Auth endpoints will fail until you add this env var.');
}

function firebaseUrl(action) {
  return `${FIREBASE_BASE_URL}:${action}?key=${FIREBASE_API_KEY}`;
}

async function callFirebase(action, payload) {
  if (!FIREBASE_API_KEY) {
    const error = new Error('Missing FIREBASE_API_KEY environment variable.');
    error.status = 500;
    throw error;
  }

  const response = await fetch(firebaseUrl(action), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Firebase Auth request failed');
    error.status = response.status;
    throw error;
  }

  return data;
}

router.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await callFirebase('signInWithPassword', { email, password, returnSecureToken: true });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const data = await callFirebase('signUp', { email, password, returnSecureToken: true });
    res.json({ ...data, role });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = await callFirebase('sendOobCode', { requestType: 'PASSWORD_RESET', email });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/verify-token', async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const data = await callFirebase('lookup', { idToken });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = router;
