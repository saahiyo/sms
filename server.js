const express = require('express');
const path = require('path');
const cors = require('cors');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const rootDir = __dirname;
const pageDir = path.join(rootDir, 'pages');
const publicDir = path.join(rootDir, 'public');

const pageRoutes = {
  'index.html': path.join(rootDir, 'index.html'),
  'login.html': path.join(pageDir, 'login.html'),
  'admin-dashboard.html': path.join(pageDir, 'admin-dashboard.html'),
  'resident-dashboard.html': path.join(pageDir, 'resident-dashboard.html'),
  'parking.html': path.join(pageDir, 'parking.html'),
  'payments.html': path.join(pageDir, 'payments.html'),
  'complaints.html': path.join(pageDir, 'complaints.html'),
  'notices.html': path.join(pageDir, 'notices.html')
};

function sendPage(res, pageName) {
  const pagePath = pageRoutes[pageName];
  if (!pagePath) {
    res.status(404).send('Page not found');
    return;
  }

  res.sendFile(pagePath);
}

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));
app.use(express.static(rootDir));

app.use('/api/auth', require('./backend/auth'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.get(['/', '/index', '/index.html'], (req, res) => {
  sendPage(res, 'index.html');
});

app.get(['/login', '/login.html', '/pages/login', '/pages/login.html'], (req, res) => {
  sendPage(res, 'login.html');
});

app.get(
  ['/admin', '/admin-dashboard', '/admin-dashboard.html', '/pages/admin-dashboard', '/pages/admin-dashboard.html'],
  (req, res) => {
    sendPage(res, 'admin-dashboard.html');
  }
);

app.get(
  ['/resident', '/resident-dashboard', '/resident-dashboard.html', '/pages/resident-dashboard', '/pages/resident-dashboard.html'],
  (req, res) => {
    sendPage(res, 'resident-dashboard.html');
  }
);

app.get(['/parking', '/parking.html', '/pages/parking', '/pages/parking.html'], (req, res) => {
  sendPage(res, 'parking.html');
});

app.get(['/payments', '/payments.html', '/pages/payments', '/pages/payments.html'], (req, res) => {
  sendPage(res, 'payments.html');
});

app.get(['/complaints', '/complaints.html', '/pages/complaints', '/pages/complaints.html'], (req, res) => {
  sendPage(res, 'complaints.html');
});

app.get(['/notices', '/notices.html', '/pages/notices', '/pages/notices.html'], (req, res) => {
  sendPage(res, 'notices.html');
});

app.get('/pages/:page', (req, res, next) => {
  const pageName = req.params.page.endsWith('.html')
    ? req.params.page
    : `${req.params.page}.html`;

  if (!pageRoutes[pageName] || pageName === 'index.html') {
    next();
    return;
  }

  sendPage(res, pageName);
});

app.use((req, res) => {
  if (path.extname(req.path)) {
    res.status(404).send('Not found');
    return;
  }

  sendPage(res, 'index.html');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
