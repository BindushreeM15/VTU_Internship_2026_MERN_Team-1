# 🏡 Smart Plot Investment Portal (SPIP)

A full-stack MERN application for real estate investment with **KYC verification, role-based access, and secure project approval workflows**.

---

## 🌐 Live Demo

- 🔗 Frontend: https://spip-frontend-v2.vercel.app  
- 🔗 Backend: https://spip-backend-v2.vercel.app  

---

## ⚡ Key Features

- 🔐 **Authentication & Authorization**
  - Role-based login (Investor / Builder / Admin)
  - JWT authentication

- 🏗️ **Builder Module**
  - KYC verification system
  - Create & manage projects and plots
  - Upload legal documents

- 🛡️ **Admin Panel**
  - Approve/reject KYC and projects
  - Activate/deactivate listings
  - Full document access

- 📊 **Investor Experience**
  - Browse projects with filters & sorting
  - View plot details
  - Save favorite projects

- 🌍 **Public Features**
  - Trending projects
  - Advanced filtering (price, city, facing)

---

## 🛠️ Tech Stack

**Frontend**
- React + Vite
- Tailwind CSS + shadcn/ui

**Backend**
- Node.js + Express
- MongoDB Atlas
- JWT Auth

**Other**
- Cloudinary (file uploads)
- Multer

---

## 🏗️ Architecture

- Separate **Frontend & Backend deployments (Vercel)**
- Dual MongoDB databases (Admin + User data)
- Secure document handling via Cloudinary

---

## ⚙️ Run Locally

```bash
# Clone repo
git clone https://github.com/your-username/VTU_Internship_2026_MERN_Team-1.git

# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 💡 Highlights

- Real-world **KYC + approval workflow**
- Scalable **role-based system**
- Production-ready **full-stack architecture**
- Clean UI with responsive design

---
