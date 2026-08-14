# 📄 PDFCraft - PDF Extraction & Management Suite

PDFCraft is a complete full-stack web application designed for importing, previewing, splitting, and extracting custom page ranges from PDF files. It features secure user authentication, interactive PDF visual manipulation, a history log of recent extractions, and robust server-side processing to reconstruct PDF structures cleanly.

---

## 🚀 Features

### **🔒 User Authentication & Security**
- **Register & Login**: JWT-based authentication system.
- **Secure Sessions**: User credentials encrypted using `bcryptjs` and session tokens stored securely on the client.
- **Authorized Workspaces**: Custom private workspaces loaded dynamically for logged-in users only.

### **📂 Interactive Document Workspace**
- **Drag & Drop PDF Uploads**: Uploading files effortlessly with size & format validation.
- **Dynamic Previews**: Rendering PDF pages visually inside a clean interactive grid layout utilizing `react-pdf` and `pdfjs-dist`.
- **Page Selection Mode**: Select pages individually with mouse clicks, or specify ranges (e.g., `1-3, 5`) directly.
- **Reorder & Exclude**: Preview the exact document flow before processing.

### **⚡ Extraction & Downloader**
- **High-Fidelity Splitting**: Uses `pdf-lib` on the backend to construct fully optimized, uncorrupted PDF documents based on selected lists.
- **Instant Downloads**: Save the extracted documents immediately to your device.
- **Physical Document Archival**: Storage logic to retrieve and manage files safely.

### **📜 History Log & Dashboard**
- **Recent Extractions list**: Keeps track of recent tasks with direct redownload links.
- **Visual Status Tracking**: Timestamps, original names, and size markers stored per extraction task.

---

## 🛠️ Technology Stack

### **Frontend**
*   **Framework**: [React 19](https://react.dev/) (bootstrapped with [Vite](https://vite.dev/))
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **State Management & API Fetching**: [React Query (TanStack)](https://tanstack.com/query/latest) & [Axios](https://axios-http.com/)
*   **PDF Rendering**: [React-PDF](https://projects.wojtekmaj.pl/react-pdf/) & [PDF.js](https://mozilla.github.io/pdf.js/)
*   **Toasts/Notifications**: [React Hot Toast](https://react-hot-toast.com/)

### **Backend**
*   **Runtime Environment**: [Node.js](https://nodejs.org/) (ES Modules)
*   **Framework**: [Express 5](https://expressjs.com/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (managed using `tsx watch` for dev hot-reloads)
*   **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
*   **PDF Manipulation**: [pdf-lib](https://pdf-lib.js.org/)
*   **File Upload Handler**: [Multer](https://github.com/expressjs/multer)
*   **Encryption & Auth**: [jsonwebtoken (JWT)](https://github.com/auth0/node-jsonwebtoken) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

---

## 📁 Repository Structure

```
boarding/
├── frontend/
│   └── vite-project/          # Vite + React Client App
│       ├── src/
│       │   ├── components/    # Reusable UI Elements (Auth, workspace panels)
│       │   ├── Pages/         # Page components (Home, Dashboard)
│       │   ├── services/      # Fetching clients & api setups
│       │   └── index.css      # Core styles & styling system
│       └── package.json
│
└── pdf-extractor-backend/     # Express + TypeScript Server
    ├── src/
    │   ├── config/            # DB Connections & configuration
    │   ├── controllers/       # Route request handlers
    │   ├── middleware/        # JWT validator, error controllers
    │   ├── models/            # Mongoose schemas (User, Extraction)
    │   ├── routes/            # Route maps
    │   ├── services/          # PDF manipulation logic & core helpers
    │   └── server.ts          # Server entry point
    └── package.json
```

---

## ⚙️ Installation & Setup

### **Prerequisites**
- **Node.js** (v18.x or higher)
- **MongoDB** running locally or a **MongoDB Atlas URI**

---

### **1. Backend Configuration & Launch**

1. Navigate to the backend directory:
   ```bash
   cd pdf-extractor-backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `pdf-extractor-backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/pdfcraft
   JWT_SECRET=your_jwt_secret_key_change_me
   ```
4. Start the development server (runs with hot-reloading using `tsx watch`):
   ```bash
   npm run dev
   ```
   *The backend will boot up on `http://localhost:5000`.*

---

### **2. Frontend Configuration & Launch**

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend/vite-project
   ```
2. Install the client-side dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `frontend/vite-project/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Spin up the local development server:
   ```bash
   npm run dev
   ```
   *The client app will launch (typically at `http://localhost:5173`).*

---

## 💡 Usage Guidelines

1. **Sign Up/Log In**: Visit the portal page to sign up or sign in.
2. **Import PDF**: Click or drag a `.pdf` file into the upload zone.
3. **Select Pages**:
   - Tap individual thumbnails to include/exclude.
   - Enter comma-separated ranges (e.g., `1-3, 5-7, 9`) in the query input.
4. **Export**: Preview the final set and hit **Extract PDF** to trigger backend synthesis. The file will download immediately.
5. **View History**: Look at the history sidebar to redownload your past files at any time.
