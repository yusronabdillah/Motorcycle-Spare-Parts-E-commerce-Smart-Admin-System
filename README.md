# 🏍️ Motorcycle Spare Parts E-Commerce & Smart Admin System (Backend API)

Backend service and automation engine for **Sahabat Motor (MotoSpare)** — a high-performance motorcycle spare parts e-commerce and store management platform. 

This service manages product catalogs, calculates nationwide delivery costs, processes multi-channel orders, and delivers real-time Telegram notifications with automated payment proof verification.

---

## ✨ Key Backend Features

- ⚡ **High-Performance In-Memory Query Engine (`db.js`)**:
  - Handles over 15,000+ spare part records with instant filtering and search across OEM part numbers and vehicle categories.
  - Custom dataset adapters for rapid prototyping without heavy database overhead.
- 🤖 **Automated Telegram Bot Admin Notification (`services/telegram.bot.js`)**:
  - Instant order dispatch alerts with customer details, order items, and delivery preferences.
  - Supports image & PDF payment receipt validation via Telegram Inline Keyboards (`Approve` / `Reject`).
  - Automatic stock inventory restoration if payment is rejected.
- 📦 **Order Management APIs (`controllers/order.controller.js`)**:
  - Full CRUD operations for orders, customer tracking, and order statuses (`pending`, `paid`, `rejected`).
- 💳 **Payment Gateway Engine**:
  - Supports Bank Transfers (BNI), Dynamic QRIS, and Cash on Delivery (COD).
- 🔐 **Clean & Scalable MVC Architecture**:
  - Modular routing for products, orders, payments, and admin endpoints.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime**: Node.js (ES6+ / CommonJS)
- **Framework**: Express.js
- **Bot Engine**: `node-telegram-bot-api`
- **Environment Management**: `dotenv` / `dotenvx`
- **Architecture**: Controller-Service-Route (MVC) Pattern

---

## 📂 Repository Structure

```text
├── controllers/
│   ├── order.controller.js       # Order creation, status updates & history
│   ├── payment.controller.js     # Payment processing & receipt validation
│   └── product.controller.js     # Product queries, search & stock status
│
├── routes/
│   ├── admin.routes.js           # Admin dashboard & management routes
│   ├── order.routes.js           # Public order placement endpoints
│   ├── payment.routes.js         # Payment & proof upload endpoints
│   └── product.routes.js         # Public product catalog endpoints
│
├── services/
│   ├── orderStore.js             # Order memory store & caching
│   ├── payment.service.js        # Payment verification business logic
│   └── telegram.bot.js           # Telegram bot integration & interactive callbacks
│
├── db.js                         # Core product database engine & queries
├── server.js                     # Express application entry point
├── package.json                  # Dependencies & scripts
└── .gitignore                    # Excludes node_modules, .env & credentials
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ or v20+ installed
- Telegram Bot Token (obtained from [@BotFather](https://t.me/BotFather))
- Telegram Admin Chat ID

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/yusronabdillah/Motorcycle-Spare-Parts-E-commerce-Smart-Admin-System.git
cd Motorcycle-Spare-Parts-E-commerce-Smart-Admin-System
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
PORT=5000
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

### 4. Running the Server

**Development Mode:**
```bash
npm run dev
# or
node server.js
```

**Production Mode:**
```bash
npm start
```

Server will run at: `http://localhost:5000`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Fetch product catalog with search & pagination |
| `GET` | `/api/products/:id` | Get spare part details by ID or OEM part number |
| `POST` | `/api/orders` | Place a new order and trigger Telegram notifications |
| `GET` | `/api/orders/:id` | Check order status and invoice |
| `POST` | `/api/payment/proof` | Upload payment proof (QRIS / Bank Transfer) |
| `GET` | `/api/admin/orders` | Get all orders for the store admin panel |

---

## 👨‍💻 Author & Maintainer

- **Developer**: [yusronabdillah](https://github.com/yusronabdillah)
- **Project**: Sahabat Motor / MotoSpare E-Commerce System

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
