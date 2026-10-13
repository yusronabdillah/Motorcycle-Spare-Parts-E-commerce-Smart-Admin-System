# 🏍️ Sahabat Motor (MotoSpare) — E-Commerce Spare Part Motor

Platform e-commerce katalog dan pemesanan spare part motor lengkap dengan integrasi WhatsApp / Telegram notification, kalkulator ongkir nasional, dan sistem checkout berbasis web.

---

## ✨ Fitur Utama

- 🔍 **Katalog & Pencarian Cepat**: Pencarian ribuan spare part berdasarkan nama produk, kode part OEM, maupun kategori motor.
- 📦 **Manajemen Stok & Kategori**: Pemetaan kategori bertingkat dan informasi ketersediaan stok (*Tersedia* / *Habis*).
- 🛒 **Shopping Cart & Checkout**: Keranjang belanja interaktif dengan estimasi harga dan ringkasan pesanan.
- 🚚 **Kalkulator Ongkir**: Perhitungan estimasi ongkos kirim (Ojek Online lokal, ekspedisi J&T / JNE, hingga opsi ambil di toko).
- 📲 **Notifikasi Pesanan Otomatis**: Integrasi bot (WhatsApp / Telegram) untuk konfirmasi pesanan dan verifikasi bukti pembayaran (QRIS / Transfer Bank).
- ⚡ **Ringan & Cepat**: Dibangun dengan arsitektur frontend modular berbasis Vanilla JavaScript dan backend Node.js / Express.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3** (Responsive modern UI)
- **Vanilla JavaScript (ES6+)**
- **Leaflet.js** (Deteksi lokasi & pemetaan jarak pengiriman)

### Backend & Integrasi
- **Node.js & Express.js**
- **Telegram Bot API / WhatsApp Web JS** (Notifikasi admin & checkout)
- **JSON / Mock Database Memory Engine** (Data store produk & pesanan)

---

## 📂 Struktur Project

```text
├── frontend/
│   ├── index.html              # Halaman utama aplikasi
│   ├── css/
│   │   └── style.css           # Styling dan layout antarmuka
│   └── js/
│       ├── app.js              # Controller utama & router frontend
│       ├── api.js              # Service API & komunikasi backend
│       ├── cart.js             # Logika keranjang & checkout
│       ├── mock_db.js          # Master dataset produk & kategori
│       ├── shipping-engine.js  # Mesin kalkulasi ongkir
│       └── utils.js            # Helper functions
│
├── backend/
│   ├── server.js               # Entry point Express server
│   ├── db.js                   # Adapter dataset & query engine
│   └── services/
│       └── telegram.bot.js     # Layanan bot notifikasi pembayaran
│
└── README.md
