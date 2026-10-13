// ============================================
// Sahabat Motor — Shim: Missing global services & constants
// Provides: MITRA_CODES, LocationService, OngkirService
// ============================================

// --- Mitra codes (used by auth.js) ---
const MITRA_CODES = [
  { code: 'MITRA123', name: 'Toko Motor Jaya' },
  { code: 'MITRA456', name: 'Bengkel Sejahtera' },
  { code: 'MITRA789', name: 'Distributor Parts Indo' },
  { code: 'MITRAVIP', name: 'VIP Reseller' },
];

// --- Location Service (used by app.js and cart.js) ---
const LocationService = {
  _lat: null,
  _lng: null,
  _distKm: null,
  _durMin: null,

  // Store coordinates: toko = Kalimantan Utara
  STORE_LAT: 4.1422599,
  STORE_LNG: 117.6539374,

  requestLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this._lat = pos.coords.latitude;
        this._lng = pos.coords.longitude;
        this._distKm = this._haversine(this._lat, this._lng, this.STORE_LAT, this.STORE_LNG);
        this._durMin = Math.round(this._distKm * 2.5); // rough estimate
        // Update location indicator if exists
        const el = document.getElementById('location-indicator');
        if (el) el.innerHTML = `📍 Lokasi terdeteksi · ${this._distKm.toFixed(1)} km dari toko`;
      },
      () => { /* silent fail */ }
    );
  },

  _haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  getDistanceKm() { return this._distKm; },
  getDurationMinutes() { return this._durMin; },

  estimateOngkir(distKm) {
    if (distKm <= 5) return 8000;
    if (distKm <= 10) return 12000;
    if (distKm <= 20) return 18000;
    if (distKm <= 50) return 25000;
    return Math.round(distKm * 600);
  },

  formatDuration(minutes) {
    if (minutes < 60) return `${minutes} menit`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
  }
};

