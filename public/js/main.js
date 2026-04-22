// Common JavaScript for Society Management System

const defaultSMSData = {
  stats: {
    totalFlats: 125,
    totalResidents: 456,
    pendingPayments: 23,
    complaints: 12
  },
  payments: [
    { id: 1, resident: 'Amit Sharma', month: 'Jan 2024', amount: 5000, status: 'paid' },
    { id: 2, resident: 'Priya Patel', month: 'Jan 2024', amount: 5000, status: 'pending' },
    { id: 3, resident: 'Raj Kumar', month: 'Dec 2023', amount: 5000, status: 'paid' }
  ],
  complaints: [
    {
      id: 1,
      title: 'Water leakage in flat 3B',
      resident: 'Amit Sharma',
      flat: '3B',
      priority: 'High',
      status: 'In Progress',
      date: '2024-01-15'
    },
    {
      id: 2,
      title: 'Lift not working',
      resident: 'Society Resident',
      flat: '-',
      priority: 'Medium',
      status: 'Resolved',
      date: '2024-01-10'
    }
  ],
  notices: [
    { id: 1, title: 'Society Maintenance Meeting', date: '2024-01-20', content: 'Meeting at 7 PM in community hall.', target: 'All Residents' },
    { id: 2, title: 'Parking Rules Update', date: '2024-01-18', content: 'New visitor parking policy.', target: 'All Residents' }
  ],
  parkingSlots: [
    { id: 1, slot: 'P-01', status: 'available' },
    { id: 2, slot: 'P-02', status: 'occupied' },
    { id: 3, slot: 'P-03', status: 'available' },
    { id: 4, slot: 'P-04', status: 'occupied' },
    { id: 5, slot: 'P-05', status: 'reserved' },
    { id: 6, slot: 'P-06', status: 'available' }
  ]
};

window.SMSData = structuredClone
  ? structuredClone(defaultSMSData)
  : JSON.parse(JSON.stringify(defaultSMSData));

const pathname = window.location.pathname;
const isPagesRoute = pathname.includes('/pages/');
const appPaths = {
  home: isPagesRoute ? '../index.html' : 'index.html',
  login: isPagesRoute ? 'login.html' : 'pages/login.html',
  admin: isPagesRoute ? 'admin-dashboard.html' : 'pages/admin-dashboard.html',
  resident: isPagesRoute ? 'resident-dashboard.html' : 'pages/resident-dashboard.html'
};

const firebaseConfig = window.SMS_FIREBASE_CONFIG || {};
const inferredDatabaseUrl = firebaseConfig.databaseURL || (
  firebaseConfig.projectId
    ? `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
    : ''
);
const runtimeFirebaseConfig = inferredDatabaseUrl
  ? { ...firebaseConfig, databaseURL: inferredDatabaseUrl }
  : firebaseConfig;
const hasFirebaseConfig = Boolean(
  window.firebase &&
  runtimeFirebaseConfig.apiKey &&
  runtimeFirebaseConfig.authDomain &&
  runtimeFirebaseConfig.projectId
);

const firebaseApp = hasFirebaseConfig
  ? (firebase.apps?.length ? firebase.app() : firebase.initializeApp(runtimeFirebaseConfig))
  : null;

const auth = hasFirebaseConfig
  ? firebase.auth()
  : null;

const hasDatabaseConfig = Boolean(

  hasFirebaseConfig &&
  typeof firebase.database === 'function' &&
  inferredDatabaseUrl
);

const database = hasDatabaseConfig
  ? firebase.app().database()
  : null;

let authFormInitialized = false;
const databaseListeners = [];

document.addEventListener('DOMContentLoaded', async () => {
  initSidebar();
  setActiveNavLink();
  initForms();
  
  // Apply immediate UI state from sessionStorage to prevent flicker
  applyInitialAuthState();

  await hydrateAppData();

  if (auth) {
    await initAuth();
  } else {
    showConfigWarning();
  }
});

window.addEventListener('beforeunload', detachDatabaseListeners);

function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  if (sidebar) {
    document.addEventListener('click', (event) => {
      const isClickInsideSidebar = sidebar.contains(event.target);
      const isToggleClick = event.target.id === 'sidebar-toggle' || event.target.closest('#sidebar-toggle');

      if (!isClickInsideSidebar && !isToggleClick && window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
      }
    });
  }
}

function setActiveNavLink() {
  const currentPage = pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage || href === `pages/${currentPage}` || href === `../${currentPage}`) {
      link.classList.add('active');
    }
  });
}

async function hydrateAppData() {
  renderAppData();
  if (!database) return;

  try {
    attachRealtimeCollection('stats', defaultSMSData.stats, (value) => {
      window.SMSData.stats = { ...defaultSMSData.stats, ...(value || {}) };
      renderAppData();
    });

    attachRealtimeCollection('payments', defaultSMSData.payments, (value) => {
      window.SMSData.payments = normalizeCollection(value, defaultSMSData.payments);
      renderAppData();
    });

    attachRealtimeCollection('complaints', defaultSMSData.complaints, (value) => {
      window.SMSData.complaints = normalizeCollection(value, defaultSMSData.complaints);
      window.SMSData.stats.complaints = window.SMSData.complaints.length;
      renderAppData();
    });

    attachRealtimeCollection('notices', defaultSMSData.notices, (value) => {
      window.SMSData.notices = normalizeCollection(value, defaultSMSData.notices);
      renderAppData();
    });

    attachRealtimeCollection('parkingSlots', defaultSMSData.parkingSlots, (value) => {
      window.SMSData.parkingSlots = normalizeCollection(value, defaultSMSData.parkingSlots);
      renderAppData();
    });
  } catch (error) {
    console.warn('[database] falling back to local demo data', error);
    renderAppData();
  }
}

function attachRealtimeCollection(path, fallbackValue, onValue) {
  const ref = database.ref(path);
  const listener = ref.on(
    'value',
    (snapshot) => {
      const value = snapshot.val();
      onValue(value ?? fallbackValue);
    },
    (error) => {
      console.warn(`[database] failed to subscribe to ${path}`, error);
      onValue(fallbackValue);
    }
  );

  databaseListeners.push({ ref, listener });
}

function detachDatabaseListeners() {
  databaseListeners.forEach(({ ref, listener }) => {
    ref.off('value', listener);
  });
  databaseListeners.length = 0;
}

function renderAppData() {
  updateStats();
  renderParkingGrid();
  renderNotices();
  renderComplaints();
}

function normalizeCollection(value, fallback) {
  if (!value) return [...fallback];
  if (Array.isArray(value)) return value;

  return Object.entries(value)
    .map(([key, item]) => ({ id: item?.id || key, ...item }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function updateStats() {
  const stats = window.SMSData.stats;
  const statElements = {
    flats: document.querySelector('.stat-flats'),
    residents: document.querySelector('.stat-residents'),
    pending: document.querySelector('.stat-pending'),
    complaints: document.querySelector('.stat-complaints')
  };

  if (statElements.flats) statElements.flats.textContent = stats.totalFlats;
  if (statElements.residents) statElements.residents.textContent = stats.totalResidents;
  if (statElements.pending) statElements.pending.textContent = stats.pendingPayments;
  if (statElements.complaints) statElements.complaints.textContent = stats.complaints;

  const parkingStats = summarizeParking(window.SMSData.parkingSlots);
  const parkingStatEls = document.querySelectorAll('[data-parking-stat]');
  parkingStatEls.forEach((element) => {
    const key = element.dataset.parkingStat;
    if (key in parkingStats) {
      element.textContent = parkingStats[key];
    }
  });

  const complaintStats = summarizeComplaints(window.SMSData.complaints);
  const complaintStatEls = document.querySelectorAll('[data-complaint-stat]');
  complaintStatEls.forEach((element) => {
    const key = element.dataset.complaintStat;
    if (key in complaintStats) {
      element.textContent = complaintStats[key];
    }
  });

  const noticeCount = document.querySelector('[data-notice-count]');
  if (noticeCount) {
    noticeCount.textContent = `${window.SMSData.notices.length} Active`;
  }
}

function summarizeParking(slots) {
  return slots.reduce(
    (summary, slot) => {
      const status = (slot.status || '').toLowerCase();
      summary.total += 1;
      if (status === 'available') summary.available += 1;
      if (status === 'occupied') summary.occupied += 1;
      if (status === 'reserved') summary.reserved += 1;
      return summary;
    },
    { available: 0, occupied: 0, reserved: 0, total: 0 }
  );
}

function summarizeComplaints(complaints) {
  return complaints.reduce(
    (summary, complaint) => {
      const status = (complaint.status || '').toLowerCase();
      summary.total += 1;
      if (status === 'pending') summary.pending += 1;
      if (status === 'in progress') summary.inProgress += 1;
      if (status === 'resolved') summary.resolved += 1;
      return summary;
    },
    { total: 0, pending: 0, inProgress: 0, resolved: 0 }
  );
}

function renderParkingGrid() {
  const container = document.querySelector('.parking-grid');
  if (!container) return;

  container.innerHTML = '';
  window.SMSData.parkingSlots.forEach((slot, index) => {
    const slotEl = document.createElement('div');
    const slotName = slot.slot || `P-${String(index + 1).padStart(2, '0')}`;
    const status = slot.status || 'available';
    slotEl.className = `parking-slot ${status}`;
    slotEl.textContent = slotName;
    slotEl.title = capitalize(status);
    container.appendChild(slotEl);
  });
}

function renderNotices() {
  const noticesList = document.getElementById('notices-list');
  if (noticesList) {
    noticesList.innerHTML = '';
    window.SMSData.notices.slice(0, 3).forEach((notice) => {
      const noticeEl = document.createElement('div');
      noticeEl.className = 'notice-item mb-3 p-3 bg-light rounded';
      noticeEl.innerHTML = `
        <h6 class="mb-1">${escapeHtml(notice.title)}</h6>
        <small class="text-muted">${formatDate(notice.date)}</small>
        <p class="mb-0 mt-1 small">${escapeHtml(notice.content)}</p>
      `;
      noticesList.appendChild(noticeEl);
    });
  }

  const noticesContainer = document.getElementById('notices-container');
  if (noticesContainer) {
    noticesContainer.innerHTML = '';
    window.SMSData.notices.forEach((notice) => {
      const noticeCard = document.createElement('div');
      noticeCard.className = 'p-4 border-bottom';
      noticeCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="mb-1">${escapeHtml(notice.title)}</h6>
          <span class="badge bg-primary">${formatDate(notice.date)}</span>
        </div>
        <p class="mb-2 text-muted">${escapeHtml(notice.content)}</p>
        <small class="text-muted d-block">${escapeHtml(notice.target || 'All Residents')}</small>
      `;
      noticesContainer.appendChild(noticeCard);
    });
  }
}

function renderComplaints() {
  const complaintsTableBody = document.querySelector('[data-complaints-table]');
  if (!complaintsTableBody) return;

  complaintsTableBody.innerHTML = '';
  if (!window.SMSData.complaints.length) {
    complaintsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-5">
          <i class="fas fa-inbox d-block mb-3 fs-3 text-secondary"></i>
          No complaints have been logged yet.
        </td>
      </tr>
    `;
  }

  window.SMSData.complaints.forEach((complaint, index) => {
    const row = document.createElement('tr');
    const complaintId = complaint.id || index;
    const subject = complaint.title || complaint.subject || 'Complaint';
    const resident = complaint.resident || 'Resident';
    const flat = complaint.flat || '-';
    row.innerHTML = `
      <td>
        <div class="complaint-id">${escapeHtml(getComplaintReference(complaintId, index))}</div>
        <div class="complaint-title-row">
          <h6 class="complaint-title">${escapeHtml(subject)}</h6>
          <span class="badge ${getPriorityBadgeClass(complaint.priority)}">${escapeHtml(complaint.priority || 'Medium')}</span>
        </div>
        <p class="complaint-snippet">${escapeHtml(getComplaintSnippet(complaint.description))}</p>
      </td>
      <td>
        <div class="complaint-resident">${escapeHtml(resident)}</div>
        <div class="complaint-flat">Flat ${escapeHtml(flat)}</div>
      </td>
      <td><span class="badge ${getComplaintBadgeClass(complaint.status)}">${escapeHtml(complaint.status || 'Pending')}</span></td>
      <td><span class="complaint-date">${formatShortDate(complaint.date)}</span></td>
      <td><button class="btn btn-sm btn-outline-secondary view-complaint-btn" type="button" data-id="${complaintId}"><i class="fas fa-eye me-1"></i>View Case</button></td>
    `;
    complaintsTableBody.appendChild(row);
  });

  if (complaintsTableBody.dataset.bound !== 'true') {
    complaintsTableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.view-complaint-btn');
      if (btn) {
        showComplaintDetails(btn.dataset.id);
      }
    });
    complaintsTableBody.dataset.bound = 'true';
  }
}

function showComplaintDetails(id) {
  const complaint = window.SMSData.complaints.find((c) => (c.id || window.SMSData.complaints.indexOf(c)).toString() === id.toString());
  if (!complaint) return;

  const modalEl = document.getElementById('complaintDetailsModal');
  if (!modalEl) return;

  document.getElementById('detail-id').textContent = getComplaintReference(id, window.SMSData.complaints.indexOf(complaint));
  document.getElementById('detail-subject').textContent = complaint.title || complaint.subject || 'Complaint';
  document.getElementById('detail-resident').textContent = complaint.resident || 'Resident';
  document.getElementById('detail-flat').textContent = complaint.flat || '-';
  document.getElementById('detail-description').textContent = complaint.description || 'No description provided.';
  document.getElementById('detail-date').textContent = formatDate(complaint.date);
  document.getElementById('detail-status-copy').textContent = complaint.status || 'Pending';

  const priorityEl = document.getElementById('detail-priority');
  priorityEl.textContent = complaint.priority || 'Medium';
  priorityEl.className = `badge ${getPriorityBadgeClass(complaint.priority)}`;

  const statusEl = document.getElementById('detail-status');
  statusEl.textContent = complaint.status || 'Pending';
  statusEl.className = `badge ${getComplaintBadgeClass(complaint.status)}`;

  const resolveBtn = document.getElementById('resolve-complaint-btn');
  const isAdmin = getUserRole(auth?.currentUser) === 'admin';
  if (resolveBtn) {
    resolveBtn.classList.toggle('d-none', !isAdmin || (complaint.status || '').toLowerCase() === 'resolved');
    resolveBtn.onclick = async () => {
      if (confirm('Are you sure you want to resolve this complaint?')) {
        await updateComplaintStatus(id, 'Resolved');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };
  }

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function updateComplaintStatus(id, status) {
  if (!database) return;
  try {
    await database.ref(`complaints/${id}`).update({ status });
    // Local update will happen via realtime listener
  } catch (error) {
    console.error('Failed to update complaint status', error);
  }
}

function getPriorityColor(priority) {
  const p = (priority || '').toLowerCase();
  if (p === 'high' || p === 'urgent') return 'danger';
  if (p === 'medium') return 'warning text-dark';
  return 'info';
}

function getPriorityBadgeClass(priority) {
  return `bg-${getPriorityColor(priority)}`;
}

function getComplaintBadgeClass(status) {
  const normalizedStatus = (status || '').toLowerCase();
  if (normalizedStatus === 'resolved') return 'bg-success';
  if (normalizedStatus === 'in progress') return 'bg-primary';
  return 'bg-warning text-dark';
}

function getComplaintReference(id, index) {
  if (typeof id === 'string' && id.trim()) return `Case ${id}`;
  const safeIndex = Number.isFinite(index) ? index + 1 : 1;
  return `Case #${String(safeIndex).padStart(3, '0')}`;
}

function getComplaintSnippet(description) {
  const value = (description || '').trim();
  if (!value) return 'No description provided yet.';
  return value.length > 110 ? `${value.slice(0, 107)}...` : value;
}

function initForms() {
  initComplaintForms();
  initNoticeForm();
  initAdminForms();

  const payButtons = document.querySelectorAll('.pay-btn');
  payButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      alert('Redirecting to payment gateway... (Demo)');
    });
  });
}

function initAdminForms() {
  const addResidentForm = document.getElementById('add-resident-form');
  if (!addResidentForm) return;

  addResidentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const statusEl = document.getElementById('add-resident-status');
    const submitBtn = document.getElementById('add-resident-btn');
    const formData = new FormData(addResidentForm);

    setAuthStatus(statusEl, 'info', 'Creating account...');
    submitBtn.disabled = true;

    try {
      // 1. Create the user via Backend API
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          role: 'resident', // Default role for new accounts
          displayName: formData.get('name')
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create resident account');

      // 2. Add resident details to Realtime Database
      if (database) {
        await database.ref(`residents/${data.localId}`).set({
          name: formData.get('name'),
          email: formData.get('email'),
          flat: formData.get('flat'),
          role: 'resident',
          createdAt: new Date().toISOString()
        });

        // 3. Update total residents stat
        const statsRef = database.ref('stats/totalResidents');
        await statsRef.transaction((current) => (current || 0) + 1);
      }

      setAuthStatus(statusEl, 'success', 'Resident account created successfully!');
      addResidentForm.reset();
      
      // Close modal after delay
      setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('addResidentModal'));
        if (modal) modal.hide();
        clearAuthStatus(statusEl);
      }, 2000);

    } catch (error) {
      console.error('[admin] add resident failed', error);
      setAuthStatus(statusEl, 'danger', error.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function initComplaintForms() {
  const complaintForms = document.querySelectorAll('[data-complaint-form]');
  complaintForms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const complaint = {
        title: formData.get('subject')?.toString().trim() || 'Complaint',
        description: formData.get('description')?.toString().trim() || '',
        resident: formData.get('resident')?.toString().trim() || auth?.currentUser?.email || 'Resident',
        flat: formData.get('flat')?.toString().trim() || '-',
        priority: formData.get('priority')?.toString().trim() || 'Medium',
        status: 'Pending',
        date: new Date().toISOString()
      };

      await addCollectionItem('complaints', complaint);
      window.SMSData.complaints.unshift(complaint);
      window.SMSData.stats.complaints = window.SMSData.complaints.length;
      renderAppData();

      alert('Complaint submitted successfully!');
      form.reset();
    });
  });
}

function initNoticeForm() {
  const noticeForm = document.getElementById('notice-form');
  if (!noticeForm) return;

  noticeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(noticeForm);
    const notice = {
      title: formData.get('title')?.toString().trim() || 'Notice',
      content: formData.get('content')?.toString().trim() || '',
      target: formData.get('target')?.toString().trim() || 'All Residents',
      author: auth?.currentUser?.email || 'Admin',
      date: new Date().toISOString()
    };

    await addCollectionItem('notices', notice);
    window.SMSData.notices.unshift(notice);
    renderAppData();

    alert('Notice published successfully!');
    noticeForm.reset();
  });
}

async function addCollectionItem(collectionName, item) {
  if (!database) {
    console.warn(`[database] ${collectionName} write skipped because databaseURL is missing`);
    return;
  }

  await database.ref(collectionName).push(item);
}

async function initAuth() {
  console.log('[auth] initAuth');

  auth.onAuthStateChanged(async (user) => {
    console.log('[auth] stateChanged', user ? { email: user.email, displayName: user.displayName } : null);

    if (user) {
      sessionStorage.setItem('user_role', getUserRole(user));
      sessionStorage.setItem('user_email', user.email);
    } else {
      sessionStorage.removeItem('user_role');
      sessionStorage.removeItem('user_email');
    }

    updateAuthProfile(user);
    updateHomeAuthState(user);
    await applyAuthGuard(user);

    if (!authFormInitialized && document.body?.dataset.authPage === 'login') {
      initAuthForm(user);
      authFormInitialized = true;
    }
  });
}

function applyInitialAuthState() {
  const storedRole = sessionStorage.getItem('user_role');
  const storedEmail = sessionStorage.getItem('user_email');
  
  if (storedRole) {
    // Mock a user object for immediate UI update
    const mockUser = { email: storedEmail, displayName: storedRole };
    updateAuthProfile(mockUser);
    updateHomeAuthState(mockUser);
  }
}

function initAuthForm(user) {
  const authForm = document.getElementById('login-form');
  if (!authForm) return;

  if (user && !isRecoveryFlow()) {
    window.location.href = getDashboardPath(getUserRole(user));
    return;
  }

  const authMode = document.getElementById('auth-mode');
  const submitButton = document.getElementById('auth-submit-btn');
  const emailField = document.getElementById('email-field');
  const passwordField = document.getElementById('password-field');
  const roleGroup = document.getElementById('role-group');
  const authStatus = document.getElementById('auth-status');
  const authHint = document.getElementById('auth-hint');
  const passwordInput = document.getElementById('auth-password');
  const emailInput = document.getElementById('auth-email');

  const updateAuthMode = () => {
    const mode = authMode.value;
    const isReset = mode === 'reset';
    const isSignup = mode === 'signup';
    const isPasswordUpdate = mode === 'update-password';

    emailField.classList.toggle('d-none', isPasswordUpdate);
    passwordField.classList.toggle('d-none', isReset);
    roleGroup.classList.toggle('d-none', !isSignup);
    emailInput.toggleAttribute('required', !isPasswordUpdate);
    passwordInput.toggleAttribute('required', !isReset);
    submitButton.innerHTML = isReset
      ? '<i class="fas fa-paper-plane me-2"></i>Send Reset Link'
      : isPasswordUpdate
        ? '<i class="fas fa-key me-2"></i>Set New Password'
        : isSignup
          ? '<i class="fas fa-user-plus me-2"></i>Create Account'
          : '<i class="fas fa-sign-in-alt me-2"></i>Sign In';
    authHint.textContent = isReset
      ? 'Firebase will email a password reset link to this address.'
      : isPasswordUpdate
        ? 'Enter a new password after opening the reset link from your email.'
        : isSignup
          ? 'New users will be created in Firebase Auth with the selected role.'
          : 'Use an existing Firebase Auth email and password to sign in.';
    clearAuthStatus(authStatus);
  };

  authMode.addEventListener('change', updateAuthMode);
  if (isRecoveryFlow()) {
    authMode.value = 'update-password';
  }
  updateAuthMode();

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAuthStatus(authStatus);

    const mode = authMode.value;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const selectedRole = document.querySelector('input[name="role"]:checked')?.value || 'resident';

    setAuthStatus(authStatus, 'info', 'Please wait...');
    submitButton.disabled = true;

    try {
      if (mode === 'login') {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const signedInUser = userCredential.user;
        setAuthStatus(authStatus, 'success', 'Signed in successfully. Redirecting...');
        window.location.href = getDashboardPath(getUserRole(signedInUser));
        return;
      }

      if (mode === 'signup') {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: selectedRole });
        setAuthStatus(
          authStatus,
          'success',
          'Account created. You can now sign in with your new account.'
        );
        authForm.reset();
        updateAuthMode();
        return;
      }

      if (mode === 'update-password') {
        const actionCode = new URLSearchParams(window.location.search).get('oobCode');
        if (!actionCode) throw new Error('Password reset link is missing or invalid.');

        await auth.confirmPasswordReset(actionCode, password);
        setAuthStatus(authStatus, 'success', 'Password updated successfully. Redirecting to sign in...');
        clearRecoveryHash();
        window.location.href = appPaths.login;
        return;
      }

      await auth.sendPasswordResetEmail(email, {
        url: getEmailRedirectUrl()
      });

      setAuthStatus(authStatus, 'success', 'Password reset email sent. Please check your inbox.');
    } catch (error) {
      setAuthStatus(authStatus, 'danger', error.message || 'Authentication failed.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

async function applyAuthGuard(user) {
  console.log('[auth] applyAuthGuard', {
    authRequired: document.body?.dataset.authRequired,
    roleRequired: document.body?.dataset.authRole,
    isLoginPage: document.body?.dataset.authPage === 'login',
    user: user ? { email: user.email, displayName: user.displayName } : null
  });

  const body = document.body;
  if (!body) return;

  const authRequired = body.dataset.authRequired === 'true';
  const roleRequired = body.dataset.authRole;
  const isLoginPage = body.dataset.authPage === 'login';

  if (isLoginPage && user && !isRecoveryFlow()) {
    window.location.href = getDashboardPath(getUserRole(user));
    return;
  }

  if (!authRequired) return;

  if (!user) {
    redirectToLogin();
    return;
  }

  if (roleRequired) {
    const userRole = getUserRole(user);
    if (userRole !== roleRequired) {
      window.location.href = getDashboardPath(userRole);
    }
  }
}

function updateAuthProfile(user) {
  const emailElement = document.querySelector('[data-auth-email]');
  const roleElement = document.querySelector('[data-auth-role-display]');

  if (emailElement) {
    emailElement.textContent = user?.email || 'Guest';
  }

  const role = user ? getUserRole(user) : 'visitor';
  if (roleElement) {
    roleElement.textContent = capitalize(role);
  }

  // Toggle visibility of admin-only menu items
  const adminLinks = document.querySelectorAll('.nav-link[href*="admin-dashboard"]');
  adminLinks.forEach(link => {
    const parentLi = link.closest('li');
    if (parentLi) {
      parentLi.style.display = role === 'admin' ? 'block' : 'none';
    }
  });
}

function updateHomeAuthState(user) {
  if (document.body?.dataset.homePage !== 'true') return;

  const authLink = document.querySelector('[data-home-auth-link]');
  const heroLink = document.querySelector('[data-home-hero-link]');
  const heroLabel = document.querySelector('[data-home-hero-label]');
  const greeting = document.querySelector('[data-home-greeting]');
  const logoutButton = document.querySelector('[data-home-logout-btn]');

  if (!authLink || !heroLink || !heroLabel || !greeting || !logoutButton) return;

  if (user) {
    const dashboardPath = getDashboardPath(getUserRole(user));
    authLink.href = dashboardPath;
    authLink.textContent = 'Dashboard';
    heroLink.href = dashboardPath;
    heroLabel.textContent = 'Open Dashboard';
    greeting.textContent = `Welcome back, ${user.email || capitalize(getUserRole(user))}`;
    logoutButton.classList.remove('d-none');
    return;
  }

  authLink.href = appPaths.login;
  authLink.textContent = 'Login';
  heroLink.href = appPaths.login;
  heroLabel.textContent = 'Get Started';
  greeting.textContent = 'Welcome to Society Management System';
  logoutButton.classList.add('d-none');
}

function showConfigWarning() {
  if (document.body?.dataset.authRequired === 'true') {
    redirectToLogin();
    return;
  }

  const configStatus = document.getElementById('firebase-config-status');
  if (!configStatus) return;

  const needsDatabaseUrl = hasFirebaseConfig && !hasDatabaseConfig;
  configStatus.className = 'alert alert-warning mb-4';
  configStatus.innerHTML = [
    '<strong>Firebase setup required.</strong>',
    'Add your Firebase config in <code>js/firebase-config.js</code> and enable Email/Password sign-in in the Firebase Console.',
    needsDatabaseUrl
      ? 'Realtime Database is enabled in the UI, so also add <code>databaseURL</code> to the Firebase config.'
      : ''
  ].join(' ');
}

function setAuthStatus(element, variant, message) {
  if (!element) return;
  element.className = `alert alert-${variant}`;
  element.textContent = message;
}

function clearAuthStatus(element) {
  if (!element) return;
  element.className = 'd-none';
  element.textContent = '';
}

function getUserRole(user) {
  return user?.displayName === 'admin' ? 'admin' : 'resident';
}

function getDashboardPath(role) {
  return role === 'admin' ? appPaths.admin : appPaths.resident;
}

function getEmailRedirectUrl() {
  const url = new URL(window.location.href);
  url.pathname = `${pathname.substring(0, pathname.lastIndexOf('/'))}${isPagesRoute ? '/login.html' : '/pages/login.html'}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function redirectToLogin() {
  window.location.href = appPaths.login;
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatShortDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isRecoveryFlow() {
  return window.location.hash.includes('type=recovery');
}

function clearRecoveryHash() {
  if (!window.location.hash) return;
  history.replaceState(null, document.title, window.location.pathname + window.location.search);
}

async function logout() {
  if (auth) {
    await auth.signOut();
  }
  
  sessionStorage.removeItem('user_role');
  sessionStorage.removeItem('user_email');

  redirectToLogin();
}

window.logout = logout;
