const { callFirebase, sendError, sendJson, corsHeaders } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

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

    return sendJson(res, 200, {
      status: 'success',
      email: data.email,
      localId: data.localId
    });
  } catch (err) {
    return sendError(res, err.status || 500, err.message);
  }
};
