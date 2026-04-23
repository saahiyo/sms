# 🏢 Izhar SMS — Society Management System

A modern, full-featured **Society Management System** built for residential apartments and housing communities. Izhar SMS provides dedicated dashboards for administrators and residents to manage parking, payments, complaints, and notices — all from a single, beautifully designed platform.

---

## ✨ Features

| Module | Description |
|---|---|
| **Admin Dashboard** | Overview of society stats, resident count, recent activity, and quick actions |
| **Resident Dashboard** | Personalized view for residents with their payments, complaints, and notices |
| **Parking Management** | Register vehicles, allocate parking slots, and track availability |
| **Payment Management** | Track maintenance fees, generate payment records, and view history |
| **Complaint System** | Residents can file complaints; admins can track, respond, and resolve them |
| **Notice Board** | Publish and manage society-wide announcements and notices |
| **Role-Based Access** | Automatic sidebar visibility based on user role (Admin / Resident) |
| **Authentication** | Firebase-powered login and registration with role management |

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **UI Framework:** Bootstrap 5
- **Icons:** Font Awesome 6
- **Charts:** Chart.js
- **Backend:** Node.js + Express.js
- **Authentication & Database:** Firebase (Auth + Realtime Database)
- **Deployment:** Vercel (serverless-ready)

---

## 📁 Project Structure

```
izhar-sms/
├── index.html                 # Landing page (home)
├── server.js                  # Express server entry point
├── package.json               # Node.js dependencies and scripts
├── vercel.json                # Vercel deployment configuration
├── .env.example               # Environment variable template
├── .gitignore
│
├── pages/                     # Application pages
│   ├── login.html             # Login & Registration page
│   ├── admin-dashboard.html   # Admin dashboard
│   ├── resident-dashboard.html# Resident dashboard
│   ├── parking.html           # Parking management
│   ├── payments.html          # Payment management
│   ├── complaints.html        # Complaint system
│   └── notices.html           # Notice board
│
├── public/                    # Static assets
│   ├── css/
│   │   └── style.css          # Global stylesheet
│   ├── js/
│   │   ├── main.js            # Core application logic
│   │   ├── firebase-config.js # Firebase configuration
│   │   └── data.json          # Seed data for Firebase RTDB
│   └── images/                # Image assets
│
├── backend/                   # Server-side modules
│   └── auth.js                # Authentication API routes
│
└── api/                       # Vercel serverless functions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Firebase** project with Authentication and Realtime Database enabled

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/izhar-sms.git
cd izhar-sms
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
PORT=3000
```

### 4. Firebase Setup (Full Guide)

This project uses **Firebase Authentication** (Email/Password) and **Firebase Realtime Database** for all data. Follow every step below to get a working backend.

#### Step 4.1 — Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** → give it a name (e.g. `izhar-sms`) → click **Continue**.
3. Disable Google Analytics (optional) → click **Create project**.
4. Once created, click **Continue** to enter the project dashboard.

#### Step 4.2 — Register a Web App

1. On the project overview page, click the **Web** icon (`</>`) to add a web app.
2. Enter a nickname (e.g. `izhar-sms-web`) → click **Register app**.
3. Firebase will show you a config object. **Copy these values** — you'll need them in Step 4.5.

#### Step 4.3 — Enable Authentication

1. In the left sidebar, go to **Build → Authentication**.
2. Click **Get started**.
3. Go to the **Sign-in method** tab.
4. Enable **Email/Password** → click **Save**.
5. Go to the **Users** tab → click **Add user** to create your first admin account:
   - **Email:** your admin email (e.g. `admin@izharsms.com`)
   - **Password:** choose a strong password
   - Click **Add user**


#### Step 4.4 — Set Up Realtime Database & Import Seed Data

1. In the left sidebar, go to **Build → Realtime Database**.
2. Click **Create Database**.
3. Choose a database location (e.g. `asia-southeast1`) → click **Next**.
4. Select **Start in test mode** (you can tighten rules later) → click **Enable**.

##### Import the Seed Data (`data.json`)

The project includes a ready-made seed file at `public/js/data.json` that pre-populates the database with sample stats, payments, notices, complaints, and parking slots.

1. In the Firebase Console, open your **Realtime Database**.
2. Click the **⋮ (three-dot menu)** at the top right of the data viewer.
3. Click **Import JSON**.
4. Browse and select the file: **`public/js/data.json`** from this project.
5. Click **Import**.

After import, your database tree should look like this:

```
root
├── stats
│   ├── totalFlats: 125
│   ├── totalResidents: 84
│   ├── pendingPayments: 3
│   └── complaints: 5
├── payments
│   ├── paymentId1: { resident, month, amount, status, date }
│   ├── paymentId2: { ... }
│   └── ...
├── notices
│   ├── noticeId1: { title, content, target, author, date }
│   └── ...
├── complaints
│   ├── complaintId1: { title, description, resident, flat, priority, status, date }
│   └── ...
└── parkingSlots
    ├── slot1: { slot: "P-01", status: "occupied" }
    └── ...
```

##### Set User Roles

After importing `data.json`, you need to add user roles. In the Realtime Database, manually add a `users` node:

1. Click the **+** button at the root of your database.
2. Add the following structure:

```
users
└── <USER_UID>
    ├── email: "admin@izharsms.com"
    └── role: "admin"
```

> Replace `<USER_UID>` with the UID shown in **Authentication → Users** tab for your admin account.

##### Recommended Security Rules

Once everything is working, update your **Database Rules** to:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".write": "$uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin'"
      }
    }
  }
}
```

#### Step 4.5 — Update Firebase Config in the Project

Open `public/js/firebase-config.js` and replace the placeholder values with the config from Step 4.2:

```javascript
window.SMS_FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
  databaseURL: 'https://YOUR_PROJECT-default-rtdb.REGION.firebasedatabase.app/',
  measurementId: 'YOUR_MEASUREMENT_ID'
};
```

> **Important:** The `databaseURL` must match the region you selected when creating the Realtime Database. Check the URL shown at the top of the Realtime Database page in the Firebase Console.

Also update the `.env` file:

```env
FIREBASE_API_KEY=YOUR_API_KEY
PORT=3000
```

### 5. Start the Development Server

```bash
npm start
```

The server will start at **http://localhost:3000**.

---

## 🌐 Deployment (Vercel)

This project is pre-configured for **Vercel** deployment.

### Deploy via CLI

```bash
npm i -g vercel
vercel
```

### Deploy via GitHub

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Set the environment variables (`FIREBASE_API_KEY`, `PORT`) in the Vercel project settings.
4. Deploy — Vercel will automatically detect the configuration from `vercel.json`.

### Clean URLs

The `vercel.json` configuration provides clean URL rewrites:

| URL | Page |
|---|---|
| `/` | Landing page |
| `/login` | Login page |
| `/admin` | Admin Dashboard |
| `/resident` | Resident Dashboard |
| `/parking` | Parking Management |
| `/payments` | Payment Management |
| `/complaints` | Complaint System |
| `/notices` | Notice Board |

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Admin** | Full access — all dashboards, management modules, and notice creation |
| **Resident** | Resident dashboard, parking, payments, complaints, and notice viewing |

The sidebar and navigation automatically adapt based on the logged-in user's role.

---

## 🎨 Design System

- **Primary Color:** `#cb997e` (warm terracotta)
- **Font:** [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
- **Sidebar:** White/cream, 230px width, with animated transitions
- **Navbar:** Fixed top bar with avatar dropdown
- **Layout:** Responsive with mobile sidebar drawer and backdrop overlay

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the production server |
| `npm test` | Run tests (placeholder) |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 🙏 Acknowledgments

- [Bootstrap 5](https://getbootstrap.com/) — UI framework
- [Font Awesome](https://fontawesome.com/) — Icon library
- [Chart.js](https://www.chartjs.org/) — Data visualization
- [Firebase](https://firebase.google.com/) — Authentication & Database
- [Vercel](https://vercel.com/) — Hosting & Deployment

---

<p align="center">
  Built with ❤️ by the Izhar SMS Team
</p>
