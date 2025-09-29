# ✨ Dure Aesthetics Backend

A modern **Next.js + MariaDB backend system** for managing staff, services, roles, clients, and appointments with logging, authentication, and email notifications.  

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![MariaDB](https://img.shields.io/badge/MariaDB-Database-blue?logo=mariadb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-teal?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-Safe-blue?logo=typescript)

---

## 🌸 Features  

- 🔐 **Secure Authentication** with JWT & role-based permissions  
- 👥 **Staff Management** — CRUD with change history (`changed_by`)  
- 📅 **Appointments** — create, confirm/decline with email notifications  
- 🛠 **Services Management** — organized by category with icons  
- 📜 **Audit Logs** — every action is tracked for accountability  
- 🎨 **Modern UI** — gradient backgrounds, smooth modals, password strength bar  
- ⚡ **Next.js 15 + Turbopack** — optimized builds, blazing fast  

---

## 🖼 Preview  

_Add screenshots of your app here._  

| Dashboard | Services Page |
|-----------|---------------|
| ![Dashboard Screenshot](./screenshots/dashboard.png) | ![Services Screenshot](./screenshots/services.png) |

---

## ⚙️ Tech Stack  

- **Frontend:** Next.js (App Router), React, TailwindCSS, Framer Motion  
- **Backend:** Next.js API Routes  
- **Database:** MariaDB with `mysql2`  
- **Auth:** JSON Web Tokens (JWT)  
- **Email:** Nodemailer  
- **Deployment:** Node.js + Nginx + PM2  

---

## 🚀 Getting Started  

Clone the repo and install dependencies:  

\`\`\`bash
git clone https://github.com/yourusername/dure-backend.git
cd dure-backend
npm install
\`\`\`

Run the dev server:  

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser.  

---

## 🏗 Build & Deploy  

Production build:  

```bash
npm run build
npm run start
```

If self-hosting:  
- Use **Nginx** as a reverse proxy  
- Run with **PM2** for process management  

---

## 📖 API Endpoints  

| Method   | Endpoint                     | Description                        |
|----------|------------------------------|------------------------------------|
| \`POST\`   | \`/api/auth\`                  | Staff login                        |
| \`GET\`    | \`/api/staff\`                 | Fetch all staff                    |
| \`POST\`   | \`/api/staff\`                 | Create staff                       |
| \`PUT\`    | \`/api/staff/[id]\`            | Update staff                       |
| \`DELETE\` | \`/api/staff/[id]\`            | Delete staff                       |
| \`GET\`    | \`/api/appointments\`          | Get all appointments               |
| \`GET\`    | \`/api/appointments/[id]\`     | Get single appointment by ID       |
| \`PATCH\`  | \`/api/appointments/[id]\`     | Confirm/Decline appointment        |

---

## 📜 Logging Example  

Every action is tracked with \`changed_by\`:  

```json
{
  "entity_type": "appointment",
  "entity_id": 42,
  "action": "update",
  "changed_by": "Jane Smith",
  "changes": {
    "old": { "status": "pending" },
    "new": { "status": "confirmed" }
  }
}
```

---

## 🤝 Contributing  

1. Fork the project 🍴  
2. Create your branch:  
   ```bash
   git checkout -b feature/amazing-feature
   ``` 
3. Commit your changes:  
   ```bash
   git commit -m "Added amazing feature"
   ``` 
4. Push to the branch:  
   ```bash
   git push origin feature/amazing-feature
   ```  
5. Open a Pull Request 🚀  

---

##   

GRAPHINITY LAB © 2025 — Built with 💖 for Dure Aesthetics
