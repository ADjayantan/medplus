# 💊 MedPlus — Pharmacy E-Commerce Platform

A full-stack pharmacy e-commerce website built with **Node.js**, **Express**, **MongoDB**, and **vanilla HTML/CSS/JS**.

![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- 🛒 Product listing, search & cart
- 🔐 User authentication (JWT)
- 📋 Prescription upload & admin review
- 📦 Order management
- 🏥 Insurance comparison page
- 🛠️ Admin dashboard (products, orders, prescriptions, users)

---

## 🚀 Quick Start (Local)

### Prerequisites
- [Node.js v16+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally  
  _or_ a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/medplus.git
cd medplus
```

### 2. Configure environment
```bash
cd backend
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET
```

### 3. Install & seed
```bash
npm install
node seed.js      # Creates admin user + sample products
```

### 4. Run
```bash
node server.js    # http://localhost:3000
```

---

## 🔑 Default Admin Account

A default admin account is created by `seed.js`. **Change the password immediately after first login.**

The seed credentials are intentionally not published here. Check your private onboarding notes, or inspect `backend/seed.js` locally — never commit real credentials to a public repo.

---

## 🌐 Deploying to the Web

### Backend → [Render](https://render.com) (free tier)
1. Push this repo to GitHub
2. New Web Service on Render → connect your repo
3. **Root directory:** `backend`
4. **Build command:** `npm install`
5. **Start command:** `node server.js`
6. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `PORT=3000`

### Frontend → [GitHub Pages](https://pages.github.com)
1. After deploying the backend, copy its URL (e.g. `https://medplus-api.onrender.com`)
2. Open `frontend/js/api.js` and update `PRODUCTION_API`:
   ```js
   const PRODUCTION_API = 'https://medplus-api.onrender.com/api';
   ```
3. Go to your GitHub repo → **Settings → Pages → Source: main / root**
4. Your frontend will be live at `https://<your-username>.github.io/medplus/frontend/`

---

## 📁 Project Structure

```
medplus/
├── frontend/
│   ├── index.html               # Home page
│   ├── products.html
│   ├── cart.html
│   ├── checkout.html
│   ├── login.html / register.html
│   ├── profile.html
│   ├── insurance.html
│   ├── upload-prescription.html
│   ├── admin-*.html             # Admin pages
│   ├── css/                     # Stylesheets
│   └── js/                      # Frontend scripts
└── backend/
    ├── server.js
    ├── package.json
    ├── .env.example             # ← copy to .env, never commit .env
    ├── seed.js
    ├── middleware/auth.js
    ├── models/                  # Mongoose schemas
    └── routes/                  # Express routes
```

---

## 🔌 API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/register | ❌ | Register user |
| POST | /api/login | ❌ | Login |
| GET | /api/products | ❌ | List products |
| GET | /api/products/:id | ❌ | Get product |
| POST | /api/orders | ✅ | Place order |
| GET | /api/orders/my | ✅ | My orders |
| POST | /api/prescriptions/upload | ✅ | Upload prescription |
| GET | /api/admin/stats | ✅ Admin | Dashboard stats |

---

## 🛡️ Security Notes

- `.env` is in `.gitignore` — never commit real secrets
- Change `JWT_SECRET` to a long random string in production
- Change default admin password after first login
- Set `CORS` origin to your frontend domain in production

---

## 📄 License

MIT
