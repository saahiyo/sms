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

  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    const error = new Error(`Firebase Auth request failed with status ${response.status}: ${text.substring(0, 100)}...`);
    error.status = response.status;
    throw error;
  }

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
    const { email, password, role, displayName } = req.body;
    // 1. Create the user
    const data = await callFirebase('signUp', { email, password, returnSecureToken: true });
    
    // 2. Update the profile with role/displayName
    if (role || displayName) {
      await callFirebase('setAccountInfo', {
        idToken: data.idToken,
        displayName: role || displayName,
        returnSecureToken: false
      });
    }

    res.json({ ...data, role: role || displayName });
  } catch (err) {
    next(err);
  }
});

router.post('/create-user', async (req, res, next) => {
  // This is a duplicate of signup for clarity in admin context
  try {
    const { email, password, role, displayName } = req.body;
    const data = await callFirebase('signUp', { email, password, returnSecureToken: true });
    
    if (role || displayName) {
      await callFirebase('setAccountInfo', {
        idToken: data.idToken,
        displayName: role || displayName,
        returnSecureToken: false
      });
    }
    res.json({ status: 'success', email: data.email, localId: data.localId });
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
