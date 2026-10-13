// ============================================================
// ongkir.js — Wrapper for the New Shipping Engine
// This bridges the existing frontend components (Cart, Map Picker)
// to the new zone-based Shipping Engine.
// ============================================================

window.OngkirSystem = {
  debounceTimer: null,
  currentAddressQuery: '',
  totalWeightKg: 1,
  onCalculateStart: null,
  onCalculateSuccess: null,

  // ---- Public: set weight from cart ----
  setTotalWeight(weightKg) {
    this.totalWeightKg = Math.max(0.5, weightKg); // minimum 0.5kg
  },

  // ---- Public: debounced trigger ----
  debounceCalculation(address, city, zip) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.calculateFromInput(address, city, zip);
    }, 1200);
  },

  // ---- Main calculation ----
  async calculateFromInput(addressText, cityText, zipText) {
    if (!cityText || cityText.length < 3) return; // need at least city

    const queryKey = `${cityText}-${this.totalWeightKg}`;
    if (this.currentAddressQuery === queryKey) return;
    this.currentAddressQuery = queryKey;

    if (this.onCalculateStart) this.onCalculateStart();

    try {
      // 1. Try to geocode the city to extract province data if available
      let province = "";
      const geoData = await this.geocode(cityText);
      if (geoData) {
        province = this.extractProvince(geoData.address);
      }

      // 2. Delegate to the new Zone-Based Shipping Engine
      if (window.ShippingEngine) {
        const options = await window.ShippingEngine.calculateShipping(province, cityText, this.totalWeightKg);
        if (this.onCalculateSuccess) this.onCalculateSuccess(options);
      } else {
        throw new Error('ShippingEngine not loaded');
      }

    } catch (err) {
      console.error("Ongkir Error:", err);
      const fallback = this.getFallbackOptions(this.totalWeightKg);
      if (this.onCalculateSuccess) this.onCalculateSuccess(fallback, true);
    }
  },

  // ---- Fallback if everything fails ----
  getFallbackOptions(weightKg) {
    return [
      {
        id: 'kurir_nunukan', name: 'Kurir Nunukan',
        price: 0,
        desc: 'Bayar ongkir ketika barang sampai', icon: '🛵'
      }
    ];
  },

  // ---- Render debug panel (hidden by default) ----
  renderDebugPanel() {
    return '';
  },

  // ---- API: Nominatim Geocoding (For getting Province from City) ----
  async geocode(query) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&countrycodes=id`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'id-ID,id;q=0.9' }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.length > 0 ? data[0] : null;
    } catch (e) { return null; }
  },

  // ---- API: Nominatim Reverse Geocoding (Kept for the Map Picker) ----
  async reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'id-ID,id;q=0.9' }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { return null; }
  },

  // ---- Extract province from Nominatim address ----
  extractProvince(addressObj) {
    if (!addressObj) return "";
    return (addressObj.state || addressObj.province || addressObj.region || "").toLowerCase();
  }
};
