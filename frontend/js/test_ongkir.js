// Quick self-test for ongkir pricing logic
// Run: node test_ongkir.js

// Simulate the pricing engine
const ZONE_TARIFFS = {
  REGULER: {
    INTRA_CITY:     { perKg: 9000,  minPrice: 9000,  maxPrice: 20000,  eta: '1-2 hari' },
    INTRA_PROVINCE: { perKg: 12000, minPrice: 12000, maxPrice: 30000,  eta: '2-3 hari' },
    INTRA_ISLAND:   { perKg: 18000, minPrice: 18000, maxPrice: 55000,  eta: '3-5 hari' },
    INTER_ISLAND: {
      JAWA:    { perKg: 35000, minPrice: 35000, eta: '4-7 hari' },
      SUMATERA:{ perKg: 42000, minPrice: 42000, eta: '5-8 hari' },
      SULAWESI:{ perKg: 32000, minPrice: 32000, eta: '4-6 hari' },
      BALI:    { perKg: 38000, minPrice: 38000, eta: '4-7 hari' },
      NTB_NTT: { perKg: 45000, minPrice: 45000, eta: '5-8 hari' },
      MALUKU:  { perKg: 52000, minPrice: 52000, eta: '6-10 hari' },
      PAPUA:   { perKg: 68000, minPrice: 68000, eta: '7-14 hari' },
    }
  },
  OJOL: { baseFee: 10000, perKm: 2500, freeKm: 3, maxDistance: 30, maxPrice: 35000 },
  CARGO_DARAT: {
    INTRA_PROVINCE: { perKg: 5000,  minChargeKg: 10, eta: '3-5 hari' },
    INTRA_ISLAND:   { perKg: 7000,  minChargeKg: 10, eta: '4-7 hari' },
  },
  CARGO_LAUT: {
    minChargeKg: 10,
    routes: {
      JAWA:    { perKg: 5500 },
      SUMATERA:{ perKg: 7000 },
      SULAWESI:{ perKg: 5000 },
      BALI:    { perKg: 6000 },
      NTB_NTT: { perKg: 8000 },
      MALUKU:  { perKg: 10000},
      PAPUA:   { perKg: 13000},
    }
  },
  CARGO_UDARA: {
    INTER_ISLAND: {
      JAWA:    { perKg: 45000, minPrice: 45000 },
      SUMATERA:{ perKg: 55000, minPrice: 55000 },
      SULAWESI:{ perKg: 40000, minPrice: 40000 },
      PAPUA:   { perKg: 85000, minPrice: 85000 },
    }
  }
};

function round1k(n) { return Math.round(n / 1000) * 1000; }

function testScenario(label, zone, island, distKm, weightKg) {
  console.log(`\n======== ${label} ========`);
  console.log(`Zone: ${zone} | Island: ${island} | Dist: ${distKm}km | Weight: ${weightKg}kg`);
  const w = Math.max(1, Math.ceil(weightKg));

  if (zone !== 'INTER_ISLAND') {
    // Ojol
    if (zone === 'INTRA_CITY' && distKm <= 30) {
      const extra = Math.max(0, distKm - 3);
      let p = 10000 + extra * 2500;
      p = Math.min(p, 35000);
      console.log(`  🏍️ Ojol: Rp ${round1k(p).toLocaleString()}`);
    }
    // Reguler
    const rt = ZONE_TARIFFS.REGULER[zone];
    let rp = rt.perKg * w;
    rp = Math.max(rp, rt.minPrice);
    if (rt.maxPrice) rp = Math.min(rp, rt.maxPrice);
    console.log(`  📦 Reguler: ${w}kg × Rp${rt.perKg} = Rp ${round1k(rp).toLocaleString()}`);
    // Cargo Darat
    if ((zone === 'INTRA_PROVINCE' || zone === 'INTRA_ISLAND') && (w >= 5 || distKm > 50)) {
      const ct = zone === 'INTRA_PROVINCE' ? ZONE_TARIFFS.CARGO_DARAT.INTRA_PROVINCE : ZONE_TARIFFS.CARGO_DARAT.INTRA_ISLAND;
      const ck = Math.max(w, ct.minChargeKg);
      console.log(`  🚛 Cargo Darat: ${ck}kg (min ${ct.minChargeKg}) × Rp${ct.perKg} = Rp ${round1k(ct.perKg * ck).toLocaleString()}`);
    }
  } else {
    // Reguler
    const rt = ZONE_TARIFFS.REGULER.INTER_ISLAND[island];
    let rp = rt.perKg * w;
    rp = Math.max(rp, rt.minPrice);
    console.log(`  📦 Reguler: ${w}kg × Rp${rt.perKg} = Rp ${round1k(rp).toLocaleString()}`);
    // Cargo Udara
    const ut = ZONE_TARIFFS.CARGO_UDARA.INTER_ISLAND[island];
    if (ut) {
      let up = ut.perKg * w;
      up = Math.max(up, ut.minPrice);
      console.log(`  ✈️ Cargo Udara: ${w}kg × Rp${ut.perKg} = Rp ${round1k(up).toLocaleString()}`);
    }
    // Cargo Laut
    const lt = ZONE_TARIFFS.CARGO_LAUT.routes[island];
    if (lt) {
      const lk = Math.max(w, 10);
      console.log(`  🚢 Cargo Laut: ${lk}kg (min 10) × Rp${lt.perKg} = Rp ${round1k(lt.perKg * lk).toLocaleString()}`);
    }
  }
}

console.log('=== ONGKIR SELF-TEST ===');
console.log('Benchmark: JNE REG 1kg Jawa = ~Rp9-25k, Antar Pulau = ~Rp30-70k');

// Dalam Kota (Tarakan -> Tarakan)
testScenario('Dalam Kota (Tarakan), 1 item 500g', 'INTRA_CITY', 'KALIMANTAN', 5, 0.5);
testScenario('Dalam Kota (Tarakan), 2 item 500g', 'INTRA_CITY', 'KALIMANTAN', 10, 1);
testScenario('Dalam Kota (Tarakan), 5 item 500g', 'INTRA_CITY', 'KALIMANTAN', 15, 2.5);

// Satu Provinsi
testScenario('Satu Provinsi (Nunukan), 1kg', 'INTRA_PROVINCE', 'KALIMANTAN', 80, 1);
testScenario('Satu Provinsi (Nunukan), 10kg', 'INTRA_PROVINCE', 'KALIMANTAN', 80, 10);

// Satu Pulau
testScenario('Satu Pulau (Balikpapan), 1kg', 'INTRA_ISLAND', 'KALIMANTAN', 500, 1);
testScenario('Satu Pulau (Balikpapan), 15kg', 'INTRA_ISLAND', 'KALIMANTAN', 500, 15);

// Antar Pulau
testScenario('Antar Pulau (Jakarta), 1kg', 'INTER_ISLAND', 'JAWA', null, 1);
testScenario('Antar Pulau (Jakarta), 5kg', 'INTER_ISLAND', 'JAWA', null, 5);
testScenario('Antar Pulau (Jakarta), 20kg', 'INTER_ISLAND', 'JAWA', null, 20);

testScenario('Antar Pulau (Makassar), 1kg', 'INTER_ISLAND', 'SULAWESI', null, 1);
testScenario('Antar Pulau (Makassar), 20kg', 'INTER_ISLAND', 'SULAWESI', null, 20);

testScenario('Antar Pulau (Jayapura), 1kg', 'INTER_ISLAND', 'PAPUA', null, 1);
testScenario('Antar Pulau (Jayapura), 20kg', 'INTER_ISLAND', 'PAPUA', null, 20);

testScenario('Antar Pulau (Sumatera), 1kg', 'INTER_ISLAND', 'SUMATERA', null, 1);
