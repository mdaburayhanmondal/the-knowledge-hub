# 📚 The Knowledge Hub - Library Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application designed to simulate real-world library operations. This project focuses heavily on **backend architecture, complex aggregation pipelines, and automated logic** over frontend aesthetics.

🔴 **Live Demo:** [https://theknowledgehub.netlify.app](https://theknowledgehub.netlify.app)
⚙️ **Backend API:** [https://theknowledgehub.onrender.com](https://theknowledgehub.onrender.com)

## 🎯 Project Goal

The primary objective of this project was to master **Express.js and MongoDB** logic. While the frontend provides a functional interface using React and Tailwind, the core strength lies in the backend's ability to handle role-based security, complex fine calculations, and automated scheduling.

## 🚀 Key Features

### 🔐 Authentication & Security

- **JWT Authentication:** Secure stateless authentication with HttpOnly cookies/headers.
- **Role-Based Access Control (RBAC):** Distinct routes and capabilities for `Members` vs `Librarians`.
- **Route Guards:** Frontend protection preventing unauthorized access to admin dashboards.

### 📖 Borrowing Logic (The Core)

- **Stock Management:** Atomic transactions ensure books cannot be borrowed if stock is 0.
- **Duplicate Prevention:** Prevents users from borrowing the same book twice simultaneously.
- **Renewal System:** Complex logic that allows renewals only within a specific window, calculates fines for the current period, and "archives" previous debt before resetting the clock.

### 💰 Automated Fine System

- **Real-time Calculation:** Fines are calculated dynamically based on borrow dates and renewal history.
- **Archive History:** The system tracks cumulative debt across multiple renewal cycles (e.g., if a user is late, renews, and is late again, both fines are preserved).
- **Cron Jobs:** A nightly automated job runs on the server to scan for overdue books and calculate fines without user intervention.

### 📧 Email Automation

- **Smart Reminders:** Integrated with `Nodemailer` and `node-cron`.
- **Logic:** Sends a "Warning Email" 2 days before the due date and a "Final Notice" 1 day before.

## 🛠️ Tech Stack

**Backend:**

- Node.js & Express.js
- MongoDB (Native Driver & Aggregations)
- JWT (JSON Web Tokens)
- Nodemailer (Email Service)
- Node-Cron (Scheduled Tasks)

**Frontend:**

- React.js (Vite)
- Tailwind CSS
- React Router DOM
- Axios (with Interceptors)

## 👨‍💻 Developer

**Md. Abu Rayhan Mondal** *Full Stack Developer*

I am open to opportunities and collaborations. If you find the logic in this project interesting, feel free to connect!

- 🌍 **Portfolio:** [rayhanfsdev.netlify.app](https://rayhanfsdev.netlify.app)
- 💼 **LinkedIn:** [md-abu-rayhan-mondal](https://www.linkedin.com/in/md-abu-rayhan-mondal/)
- 🐙 **GitHub:** [mdaburayhanmondal](https://github.com/mdaburayhanmondal)

---
*Note: This project is a showcase of backend functional logic. The UI is kept minimal intentionally.*
