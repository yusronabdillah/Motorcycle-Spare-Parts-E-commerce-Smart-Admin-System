# 🏍️ Sahabat Motor (MotoSpare) — Motorcycle Spare Parts E-Commerce

An e-commerce platform for browsing and ordering motorcycle spare parts, featuring WhatsApp / Telegram notification integration, a nationwide shipping cost calculator, and a web-based checkout system.

---

## ✨ Key Features

- 🔍 **Product Catalog & Quick Search**: Search thousands of spare parts by product name, OEM part number, or motorcycle category.
- 📦 **Inventory & Category Management**: Hierarchical category mapping with stock availability information (*In Stock* / *Out of Stock*).
- 🛒 **Shopping Cart & Checkout**: Interactive shopping cart with price estimates and order summaries.
- 🚚 **Shipping Cost Calculator**: Estimated shipping fees for local ride-hailing services, J&T / JNE couriers, and in-store pickup options.
- 📲 **Automated Order Notifications**: Bot integration (WhatsApp / Telegram) for order confirmations and payment proof verification (QRIS / bank transfer).
- ⚡ **Lightweight & Fast**: Built with a modular Vanilla JavaScript frontend architecture and a Node.js / Express backend.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3** (Modern, responsive UI)
- **Vanilla JavaScript (ES6+)**
- **Leaflet.js** (Location detection and delivery distance mapping)

### Backend & Integrations
- **Node.js & Express.js**
- **Telegram Bot API / WhatsApp Web JS** (Admin notifications and checkout)
- **JSON / In-Memory Mock Database Engine** (Product and order data storage)

---

## 📂 Project Structure

```text
├── frontend/
│   ├── index.html              # Main application page
│   ├── css/
│   │   └── style.css           # UI styling and layout
│   └── js/
│       ├── app.js              # Main controller and frontend router
│       ├── api.js              # API service and backend communication
│       ├── cart.js             # Shopping cart and checkout logic
│       ├── mock_db.js          # Master product and category dataset
│       ├── shipping-engine.js  # Shipping cost calculation engine
│       └── utils.js            # Helper functions
│
├── backend/
│   ├── server.js               # Express server entry point
│   ├── db.js                   # Dataset adapter and query engine
│   └── services/
│       └── telegram.bot.js     # Payment notification bot service
│
└── README.md
```
