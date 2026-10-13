// ============================================================
// shipping-engine.js — Marketplace Style Zone-Based Shipping Engine
// Benchmarks: JNE / J&T / SiCepat / Cargo
// Origin: Nunukan, Kalimantan Utara
// ============================================================

const ShippingEngine = {
  rates: {},
  remoteAreas: [],
  isLoaded: false,
  origin: {
    city: 'Nunukan',
    province: 'Kalimantan Utara'
  },
  defaultBaseCost: 25000,

  async init() {
    if (this.isLoaded) return;
    try {
      const [ratesRes, remoteRes] = await Promise.all([
        fetch('data/shipping-rates.json').then(r => r.json()),
        fetch('data/remote-areas.json').then(r => r.json())
      ]);
      this.rates = ratesRes;
      this.remoteAreas = remoteRes;
      this.isLoaded = true;
      console.log('[ShippingEngine] Successfully loaded rates and remote areas DB.');
    } catch (e) {
      console.error('[ShippingEngine] Failed to load shipping DB:', e);
      // Fallback
      this.isLoaded = true;
    }
  },

  getCleanCityName(rawCity) {
    if (!rawCity) return '';
    return rawCity.replace(/(Kota|Kabupaten)\s+/gi, '').trim();
  },

  findRate(province, rawCity) {
    const city = this.getCleanCityName(rawCity);
    
    // 1. Try exact city match
    if (city && this.rates[city]) {
      return this.rates[city];
    }
    
    // 2. Try partial city match
    if (city) {
      const matchedCityKey = Object.keys(this.rates).find(k => k.toLowerCase() === city.toLowerCase() || city.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(city.toLowerCase()));
      if (matchedCityKey) return this.rates[matchedCityKey];
    }

    // 3. Try province match
    if (province) {
      const matchedProvKey = Object.keys(this.rates).find(k => k.toLowerCase() === province.toLowerCase() || province.toLowerCase().includes(k.toLowerCase()));
      if (matchedProvKey) return this.rates[matchedProvKey];
    }

    // 4. Return default
    return {
      province: province || 'Unknown',
      zone: 'DEFAULT',
      baseCost: this.defaultBaseCost,
      isDefault: true
    };
  },

  isRemoteArea(city) {
    if (!city) return false;
    const cleanCity = this.getCleanCityName(city).toLowerCase();
    return this.remoteAreas.some(remote => cleanCity.includes(remote.toLowerCase()));
  },

  async calculateShipping(province, rawCity, weightKg) {
    return [
      {
        id: 'kurir_nunukan',
        name: 'Kurir Nunukan',
        price: 0,
        desc: 'Bayar ongkir ketika barang sampai',
        icon: '🛵'
      }
    ];
  }
};

// Expose globally
window.ShippingEngine = ShippingEngine;
