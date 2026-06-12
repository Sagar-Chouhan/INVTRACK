# INVTrack - Stock Management System

## 🚀 Quick Start Guide

### 1. Start Backend Server

```powershell
cd backend
npm start
```

Backend should start on: `http://localhost:4000`

### 2. Start Frontend Development Server

```powershell
cd Frontend
npm run dev
```

Frontend should start on: `http://localhost:5173`

### 3. Login Credentials

#### Admin Login:
- **Email:** `admin@example.com`
- **Password:** `Admin@1234`

After login, admin will be automatically redirected to: `http://localhost:5173/admin/dashboard`

#### Test Login (Optional):
To test if backend is working, run:
```powershell
cd backend
node test-login.js
```

## 📋 Admin Panel Features

Once logged in as admin, you can access:

1. **Dashboard** (`/admin/dashboard`) - Overview with stats and charts
2. **Add Stock** (`/admin/add-stock`) - Add new stock items
3. **Stock List** (`/admin/stock-list`) - View and manage all stock items
4. **Pending Verifications** - Coming soon
5. **Reports** - Coming soon
6. **Users** - Coming soon
7. **Settings** - Coming soon

## 🔧 Troubleshooting

### Login Not Working:

1. **Check if backend is running:**
   - Open `http://localhost:4000/api/health`
   - Should show: `{"status":"ok","message":"INVTrack backend running"}`

2. **Check MongoDB connection:**
   - Look for "✅ MongoDB connected successfully" in backend console
   - Check `.env` file has correct `MONGODB_URI`

3. **Check browser console for errors:**
   - Press F12 in browser
   - Check Console and Network tabs for errors

4. **Clear browser storage:**
   ```javascript
   // Run in browser console
   localStorage.clear();
   location.reload();
   ```

### Backend Errors:

If you see "MongoDB connection error":
- Check your internet connection
- Verify MongoDB URI in `.env` file
- Ensure MongoDB Atlas IP whitelist includes your IP

## 📝 Project Structure

```
INVTrack/
├── Backend/
│   ├── src/
│   │   ├── config.js
│   │   ├── db.js
│   │   ├── server.js
│   │   ├── routes/
│   │   │   └── auth.routes.js
│   │   └── models/
│   │       └── User.js
│   ├── .env
│   └── package.json
│
└── Frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   └── admin/
    │   │       ├── AddStock.jsx
    │   │       └── StockList.jsx
    │   ├── components/
    │   │   └── admin/
    │   │       └── AdminLayout.jsx
    │   └── contexts/
    │       └── AuthContext.jsx
    └── package.json
```

## 🎯 Next Steps

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd Frontend && npm run dev`
3. Open browser: `http://localhost:5173`
4. Login with admin credentials
5. Explore admin panel!
