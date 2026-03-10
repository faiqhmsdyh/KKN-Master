/**
 * AUTOGROUP SERVICE - Rule-Based Automation (IF-THEN Algorithm)
 * Algoritma pembagian kelompok dan penempatan lokasi KKN
 * Mengambil aturan dari database (tidak hardcoded)
 * 
 * === ALGORITMA IF-THEN RULES ===
 * 
 * 1. IF kapasitas kelompok penuh (>= max_anggota) THEN skip kelompok
 * 2. IF mahasiswa sakit AND kelompok sudah punya peserta sakit THEN skip kelompok
 * 3. IF aturan_gender = 'dipisah' AND kelompok sudah ada gender berbeda THEN skip kelompok
 * 4. IF aturan_gender = 'laki-laki' AND mahasiswa perempuan THEN skip kelompok
 * 5. IF aturan_gender = 'perempuan' AND mahasiswa laki-laki THEN skip kelompok
 * 
 * === SCORING SYSTEM (Best Group Selection) ===
 * 
 * 1. Load Balancing: +100 per slot kosong (prioritas tertinggi)
 * 2. Variasi Prodi: +80 jika belum memenuhi minimal, +30 jika sudah memenuhi
 * 3. Variasi Fakultas: +60 jika belum memenuhi minimal, +20 jika sudah memenuhi
 * 4. Gender Balance: +40 jika menambah gender minoritas
 * 
 * Kelompok dengan score tertinggi yang lolos validasi akan dipilih.
 */

/**
 * Hitung jarak antara 2 koordinat (Haversine Formula)
 * @returns jarak dalam kilometer
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Dapatkan kategori jarak
 * @returns kategori: 'Sangat Dekat' | 'Dekat' | 'Sedang' | 'Jauh'
 */
function getDistanceCategory(distance) {
  if (distance < 2) return 'Sangat Dekat';
  if (distance < 5) return 'Dekat';
  if (distance < 10) return 'Sedang';
  return 'Jauh';
}

/**
 * Cek apakah lokasi aman untuk peserta sakit
 * AMAN = jarak ke puskesmas < 5km (hijau/biru)
 * TIDAK AMAN = jarak ke puskesmas > 10km (merah)
 */
function isLokasiAmanUntukSakit(location) {
  // Jika ada data kategori jarak
  if (location.kategori_jarak) {
    return location.kategori_jarak === 'Sangat Dekat' || location.kategori_jarak === 'Dekat';
  }
  
  // ✅ UPDATED: Gunakan jarak_ke_puskesmas (bukan jarak_ke_faskes yang sudah deprecated)
  if (location.jarak_ke_puskesmas !== null && location.jarak_ke_puskesmas !== undefined) {
    return location.jarak_ke_puskesmas < 5; // < 5km = aman (hijau + biru)
  }
  
  // Default: tidak aman jika tidak ada data
  return false;
}

/**
 * Cari puskesmas terdekat menggunakan Overpass API (lebih akurat berdasarkan koordinat)
 * @returns {Promise<{name: string, distance: number, lat: number, lon: number} | null>}
 */
async function findNearestPuskesmas(lat, lon, kabupaten = '') {
  try {
    // Gunakan Overpass API untuk cari puskesmas dalam radius 25km dari koordinat
    // Query: cari node/way dengan tag amenity=clinic atau amenity=hospital atau name~puskesmas
    const radius = 25000; // 25 km dalam meter
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="clinic"](around:${radius},${lat},${lon});
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        way["amenity"="clinic"](around:${radius},${lat},${lon});
        way["amenity"="hospital"](around:${radius},${lat},${lon});
        node["healthcare"="centre"](around:${radius},${lat},${lon});
        way["healthcare"="centre"](around:${radius},${lat},${lon});
      );
      out center;
    `;
    
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`⚠️  Overpass API rate limit, coba Nominatim...`);
      } else {
        console.warn(`⚠️  Overpass API error: ${response.status}`);
      }
      // Fallback ke Nominatim
      return await findNearestPuskesmasNominatim(lat, lon, kabupaten);
    }
    
    const data = await response.json();
    
    if (!data.elements || data.elements.length === 0) {
      console.warn(`⚠️  Tidak ada puskesmas ditemukan via Overpass, coba Nominatim...`);
      return await findNearestPuskesmasNominatim(lat, lon, kabupaten);
    }
    
    // Hitung jarak ke semua puskesmas, ambil yang terdekat
    let minDistance = Infinity;
    let nearestPuskesmas = null;
    
    data.elements.forEach(element => {
      const name = element.tags?.name || element.tags?.['name:id'] || 'Fasilitas Kesehatan';
      
      // Filter hanya yang mengandung kata "puskesmas" atau "klinik" atau "clinic"
      const nameLower = name.toLowerCase();
      if (nameLower.includes('puskesmas') || nameLower.includes('klinik') || nameLower.includes('clinic') || element.tags?.amenity === 'clinic') {
        const elementLat = element.lat || element.center?.lat;
        const elementLon = element.lon || element.center?.lon;
        
        if (elementLat && elementLon) {
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lon),
            parseFloat(elementLat),
            parseFloat(elementLon)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestPuskesmas = {
              name: name,
              distance: distance,
              lat: parseFloat(elementLat),
              lon: parseFloat(elementLon)
            };
          }
        }
      }
    });
    
    if (nearestPuskesmas) {
      return nearestPuskesmas;
    } else {
      // Jika tidak ada yang match filter, ambil fasilitas kesehatan terdekat apapun
      data.elements.forEach(element => {
        const elementLat = element.lat || element.center?.lat;
        const elementLon = element.lon || element.center?.lon;
        
        if (elementLat && elementLon) {
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lon),
            parseFloat(elementLat),
            parseFloat(elementLon)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestPuskesmas = {
              name: element.tags?.name || 'Fasilitas Kesehatan',
              distance: distance,
              lat: parseFloat(elementLat),
              lon: parseFloat(elementLon)
            };
          }
        }
      });
      
      return nearestPuskesmas;
    }
  } catch (error) {
    console.error('Error finding nearest puskesmas via Overpass:', error.message);
    // Fallback ke Nominatim
    return await findNearestPuskesmasNominatim(lat, lon, kabupaten);
  }
}

/**
 * Fallback: Cari puskesmas menggunakan Nominatim API
 */
async function findNearestPuskesmasNominatim(lat, lon, kabupaten = '') {
  try {
    // Gunakan bounding box di sekitar koordinat (±0.3 derajat = ~33km)
    const delta = 0.3;
    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
    
    // Query dengan bounded search
    const searchQuery = kabupaten ? `puskesmas ${kabupaten}` : 'puskesmas';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=50&bounded=1&viewbox=${bbox}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KKNAutoGroup/1.0' }
    });
    
    if (!response.ok) {
      console.warn(`⚠️  Nominatim API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn(`⚠️  Tidak ada puskesmas ditemukan untuk: ${searchQuery}`);
      return null;
    }
    
    // Hitung jarak ke semua puskesmas, ambil yang terdekat
    let minDistance = Infinity;
    let nearestPuskesmas = null;
    
    data.forEach(place => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lon),
        parseFloat(place.lat),
        parseFloat(place.lon)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPuskesmas = {
          name: place.display_name.split(',')[0],
          distance: distance,
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon)
        };
      }
    });
    
    return nearestPuskesmas;
  } catch (error) {
    console.error('Error finding nearest puskesmas via Nominatim:', error.message);
    return null;
  }
}

/**
 * Hitung jarak ke puskesmas terdekat untuk semua lokasi (OTOMATIS via Maps API)
 * ⚠️  NOTE: Function ini sudah deprecated - data jarak sekarang diambil dari database
 * Tambahkan field: jarak_ke_puskesmas, puskesmas_terdekat, kategori_jarak
 */
async function enrichLocationsWithDistance(locations) {
  if (!locations || locations.length === 0) return locations;
  
  console.log('🏥 Mencari puskesmas terdekat untuk', locations.length, 'lokasi...');
  
  const enrichedLocations = [];
  
  for (const loc of locations) {
    // Jika tidak punya koordinat, skip
    if (!loc.latitude || !loc.longitude) {
      enrichedLocations.push({
        ...loc,
        jarak_ke_puskesmas: null,
        puskesmas_terdekat: null,
        kategori_jarak: null
      });
      continue;
    }
    
    // Cari puskesmas terdekat via API
    const puskesmas = await findNearestPuskesmas(
      parseFloat(loc.latitude),
      parseFloat(loc.longitude),
      loc.kabupaten
    );
    
    if (puskesmas) {
      enrichedLocations.push({
        ...loc,
        jarak_ke_puskesmas: puskesmas.distance,
        puskesmas_terdekat: puskesmas.name,
        kategori_jarak: getDistanceCategory(puskesmas.distance)
      });
      
      console.log(`  ✓ ${loc.lokasi}: ${puskesmas.distance.toFixed(1)} km ke ${puskesmas.name}`);
    } else {
      // Jika tidak ditemukan puskesmas, set null
      enrichedLocations.push({
        ...loc,
        jarak_ke_puskesmas: null,
        puskesmas_terdekat: null,
        kategori_jarak: null
      });
      
      console.warn(`  ⚠️  ${loc.lokasi}: Puskesmas tidak ditemukan`);
    }
    
    // Delay untuk menghindari rate limit (Overpass: 2-3 req/sec, Nominatim: 1 req/sec)
    // Gunakan delay 3 detik untuk aman
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return enrichedLocations;
}

/**
 * Shuffle array menggunakan Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Hitung jumlah prodi unik dalam kelompok
 */
function countProdi(group) {
  const prodiSet = new Set();
  group.anggota.forEach(mhs => {
    if (mhs.prodi) prodiSet.add(mhs.prodi);
  });
  return prodiSet.size;
}

/**
 * Hitung jumlah fakultas unik dalam kelompok
 */
function countFakultas(group) {
  const fakultasSet = new Set();
  group.anggota.forEach(mhs => {
    if (mhs.fakultas) fakultasSet.add(mhs.fakultas);
  });
  return fakultasSet.size;
}

/**
 * Hitung gender balance dalam kelompok
 */
function balanceGender(group) {
  let laki = 0;
  let perempuan = 0;
  
  group.anggota.forEach(mhs => {
    const gender = (mhs.jenis_kelamin || '').toLowerCase();
    if (gender.includes('laki') || gender === 'l' || gender === 'male') {
      laki++;
    } else if (gender.includes('perempuan') || gender === 'p' || gender === 'female') {
      perempuan++;
    }
  });
  
  return { laki, perempuan, diff: Math.abs(laki - perempuan) };
}

/**
 * Cek apakah mahasiswa sakit
 */
function isSakit(mahasiswa) {
  const kesehatan = (mahasiswa.kesehatan || '').toLowerCase();
  return kesehatan.includes('sakit') || kesehatan.includes('tidak sehat');
}

/**
 * Pisahkan mahasiswa berdasarkan kondisi kesehatan
 */
function separateByHealth(mahasiswa) {
  const sakit = [];
  const sehat = [];
  
  mahasiswa.forEach(mhs => {
    if (isSakit(mhs)) {
      sakit.push(mhs);
    } else {
      sehat.push(mhs);
    }
  });
  
  return { sakit, sehat };
}

/**
 * Hitung jumlah kelompok optimal berdasarkan min/max anggota
 */
function calculateOptimalGroups(totalMahasiswa, minAnggota, maxAnggota) {
  // Gunakan default values jika tidak valid
  const MIN_DEFAULT = 8;
  const MAX_DEFAULT = 12;
  
  let validMin = (minAnggota && minAnggota > 0) ? minAnggota : MIN_DEFAULT;
  let validMax = (maxAnggota && maxAnggota > 0) ? maxAnggota : MAX_DEFAULT;
  
  // Pastikan max >= min
  if (validMax < validMin) {
    validMax = validMin;
  }
  
  // Coba buat kelompok dengan max anggota
  let jumlahKelompok = Math.ceil(totalMahasiswa / validMax);
  
  // Cek apakah rata-rata anggota tidak kurang dari min
  const avgAnggota = totalMahasiswa / jumlahKelompok;
  
  if (avgAnggota < validMin) {
    // Adjust agar memenuhi min anggota
    jumlahKelompok = Math.floor(totalMahasiswa / validMin);
  }
  
  // Minimal 1 kelompok
  return Math.max(1, jumlahKelompok);
}

/**
 * Buat struktur kelompok kosong
 */
function createEmptyGroups(jumlahKelompok) {
  const groups = [];
  for (let i = 1; i <= jumlahKelompok; i++) {
    groups.push({
      nomor_kelompok: i,
      anggota: [],
      lokasi: null,
      desa: null,
      kecamatan: null,
      kabupaten: null,
      stats: {
        total: 0,
        laki_laki: 0,
        perempuan: 0,
        sakit: 0,
        prodi: {},
        fakultas: {}
      }
    });
  }
  return groups;
}

/**
 * Update statistik kelompok setelah menambah anggota
 */
function updateGroupStats(group, mahasiswa) {
  group.stats.total++;
  
  // Gender
  const gender = (mahasiswa.jenis_kelamin || '').toLowerCase();
  if (gender.includes('laki') || gender === 'l' || gender === 'male') {
    group.stats.laki_laki++;
  } else if (gender.includes('perempuan') || gender === 'p' || gender === 'female') {
    group.stats.perempuan++;
  }
  
  // Kesehatan
  if (isSakit(mahasiswa)) {
    group.stats.sakit++;
  }
  
  // Prodi
  const prodi = mahasiswa.prodi || 'Unknown';
  group.stats.prodi[prodi] = (group.stats.prodi[prodi] || 0) + 1;
  
  // Fakultas
  const fakultas = mahasiswa.fakultas || 'Unknown';
  group.stats.fakultas[fakultas] = (group.stats.fakultas[fakultas] || 0) + 1;
}

/**
 * Recalculate group statistics from scratch
 * Digunakan setelah member swapping
 */
function recalculateGroupStats(group) {
  // Reset stats
  group.stats = {
    total: 0,
    laki_laki: 0,
    perempuan: 0,
    sakit: 0,
    prodi: {},
    fakultas: {}
  };
  
  // Recalculate from all members
  group.anggota.forEach(mahasiswa => {
    updateGroupStats(group, mahasiswa);
  });
}

/**
 * Cek apakah bisa menambah mahasiswa ke kelompok berdasarkan rules (IF-THEN validation)
 */
function canAddToGroup(group, mahasiswa, config) {
  const { 
    aturan_jenis_kelamin,
    sebar_peserta_sakit
  } = config;
  
  // Use safe default for max anggota
  const maxAnggota = (config.max_anggota_per_kelompok && config.max_anggota_per_kelompok > 0) ? config.max_anggota_per_kelompok : 12;
  
  // Rule 1: IF kapasitas penuh THEN reject
  if (group.stats.total >= maxAnggota) {
    return false;
  }
  
  // Rule 2: IF sebar_sakit enabled AND mahasiswa sakit AND kelompok sudah ada sakit THEN reject
  if (sebar_peserta_sakit && isSakit(mahasiswa) && group.stats.sakit >= 1) {
    return false;
  }
  
  // Rule 3-5: IF-THEN gender rules
  const gender = (mahasiswa.jenis_kelamin || '').toLowerCase();
  const isLaki = gender.includes('laki') || gender === 'l' || gender === 'male';
  const isPerempuan = gender.includes('perempuan') || gender === 'p' || gender === 'female';
  
  if (aturan_jenis_kelamin === 'dipisah' || aturan_jenis_kelamin === 'laki-laki') {
    // IF gender dipisah AND kelompok ada perempuan AND mahasiswa laki-laki THEN reject
    if (isLaki && group.stats.perempuan > 0) return false;
    // IF khusus laki-laki AND mahasiswa perempuan THEN reject
    if (aturan_jenis_kelamin === 'laki-laki' && isPerempuan) return false;
  }
  
  if (aturan_jenis_kelamin === 'dipisah' || aturan_jenis_kelamin === 'perempuan') {
    // IF gender dipisah AND kelompok ada laki-laki AND mahasiswa perempuan THEN reject
    if (isPerempuan && group.stats.laki_laki > 0) return false;
    // IF khusus perempuan AND mahasiswa laki-laki THEN reject
    if (aturan_jenis_kelamin === 'perempuan' && isLaki) return false;
  }
  
  return true;
}

/**
 * Cari kelompok terbaik untuk mahasiswa berdasarkan scoring + rules (IF-THEN Scoring System)
 */
function findBestGroup(groups, mahasiswa, config) {
  const { 
    aturan_jenis_kelamin,
    variasi_prodi,
    variasi_fakultas
  } = config;
  
  // Use safe defaults
  const maxAnggota = (config.max_anggota_per_kelompok && config.max_anggota_per_kelompok > 0) ? config.max_anggota_per_kelompok : 12;
  
  let bestGroup = null;
  let bestScore = -Infinity;
  
  for (const group of groups) {
    // Validasi IF-THEN rules terlebih dahulu
    if (!canAddToGroup(group, mahasiswa, config)) {
      continue;
    }
    
    let score = 0;
    const scoreBreakdown = {};
    
    // Prioritas 1: Load balancing - kelompok dengan anggota paling sedikit
    const loadBalanceScore = (maxAnggota - group.stats.total) * 100;
    score += loadBalanceScore;
    scoreBreakdown.loadBalance = loadBalanceScore;
    
    // Prioritas 2: Variasi prodi (IF-THEN scoring)
    if (variasi_prodi > 0) {
      const currentProdiCount = countProdi(group);
      // IF belum memenuhi minimal THEN bonus besar
      if (currentProdiCount < variasi_prodi) {
        // IF menambah prodi baru THEN bonus lebih besar
        if (!group.stats.prodi[mahasiswa.prodi]) {
          score += 80;
          scoreBreakdown.prodi = 80;
        }
      } else {
        // ELSE IF sudah memenuhi BUT masih bisa tambah variasi THEN bonus kecil
        if (!group.stats.prodi[mahasiswa.prodi]) {
          score += 30;
          scoreBreakdown.prodi = 30;
        }
      }
    }
    
    // Prioritas 3: Variasi fakultas (IF-THEN scoring)
    if (variasi_fakultas > 0) {
      const currentFakultasCount = countFakultas(group);
      // IF belum memenuhi minimal THEN bonus besar
      if (currentFakultasCount < variasi_fakultas) {
        if (!group.stats.fakultas[mahasiswa.fakultas]) {
          score += 60;
          scoreBreakdown.fakultas = 60;
        }
      } else {
        // ELSE IF sudah memenuhi BUT masih bisa tambah variasi THEN bonus kecil
        if (!group.stats.fakultas[mahasiswa.fakultas]) {
          score += 20;
          scoreBreakdown.fakultas = 20;
        }
      }
    }
    
    // Prioritas 4: Gender balance (IF-THEN scoring)
    if (aturan_jenis_kelamin === 'seimbang' || aturan_jenis_kelamin === 'campur' || aturan_jenis_kelamin === 'bebas') {
      const balance = balanceGender(group);
      const gender = (mahasiswa.jenis_kelamin || '').toLowerCase();
      const isLaki = gender.includes('laki') || gender === 'l' || gender === 'male';
      
      // IF menambah gender minoritas THEN bonus
      if (isLaki && balance.perempuan > balance.laki) {
        score += 40;
        scoreBreakdown.genderBalance = 40;
      } else if (!isLaki && balance.laki > balance.perempuan) {
        score += 40;
        scoreBreakdown.genderBalance = 40;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestGroup = group;
    }
  }
  
  return bestGroup;
}

/**
 * Distribusi peserta sakit dengan aturan maksimal 1 per kelompok
 */
function distributePesertaSakit(groups, pesertaSakit, config) {
  if (!config.sebar_peserta_sakit || pesertaSakit.length === 0) {
    return;
  }
  
  // Shuffle peserta sakit untuk randomisasi
  const shuffledSakit = shuffleArray(pesertaSakit);
  
  // Distribusi maksimal 1 per kelompok
  let groupIndex = 0;
  for (const sakit of shuffledSakit) {
    let placed = false;
    
    // Coba tempatkan di kelompok yang belum ada peserta sakit
    for (let i = 0; i < groups.length; i++) {
      const idx = (groupIndex + i) % groups.length;
      const group = groups[idx];
      
      if (canAddToGroup(group, sakit, config)) {
        group.anggota.push(sakit);
        updateGroupStats(group, sakit);
        placed = true;
        groupIndex = (idx + 1) % groups.length;
        break;
      }
    }
    
    // Jika tidak bisa ditempatkan (semua kelompok sudah ada sakit), coba paksa ke kelompok paling sedikit
    if (!placed) {
      const minGroup = groups.reduce((min, g) => 
        g.stats.total < min.stats.total ? g : min
      );
      minGroup.anggota.push(sakit);
      updateGroupStats(minGroup, sakit);
    }
  }
}

/**
 * Assign lokasi ke kelompok
 * LOGIKA: SEQUENTIAL ASSIGNMENT 1:1 (TIDAK PAKAI KUOTA) + MEMBER SWAPPING
 * 
 * 1. STEP 1 - Sequential Assignment (1:1 mapping):
 *    - Kelompok 1 → Lokasi dengan id_lokasi terkecil
 *    - Kelompok 2 → Lokasi dengan id_lokasi berikutnya
 *    - Kelompok N → Lokasi N (sequential, tidak ada sistem kuota)
 * 
 * 2. STEP 2 - Member Swapping (Health Priority):
 *    - Anggota sakit pindah ke kelompok yang dapat lokasi AMAN (<5km puskesmas)
 *    - Anggota sehat pindah ke kelompok yang dapat lokasi BERBAHAYA (>5km puskesmas)
 * 
 * PENTING: Sistem ini TIDAK menggunakan kuota lokasi. Setiap lokasi hanya untuk 1 kelompok.
 */
function assignLocationsToGroups(groups, locations) {
  if (!locations || locations.length === 0) {
    console.log('⚠️  Tidak ada lokasi tersedia! Semua kelompok tidak mendapat lokasi.');
    groups.forEach(g => {
      g.id_lokasi = null;
      g.lokasi = 'BELUM DITEMPATKAN';
      g.desa = null;
      g.kecamatan = null;
      g.kabupaten = null;
      g.latitude = null;
      g.longitude = null;
      g.jarak_ke_puskesmas = null;
      g.puskesmas_terdekat = null;
      g.kategori_jarak = null;
    });
    return groups;
  }
  
  console.log('\n🗺️  === LOGIKA PENEMPATAN SEQUENTIAL + MEMBER SWAPPING ===');
  console.log(`   📊 Total kelompok: ${groups.length}`);
  console.log(`   📍 Total lokasi tersedia: ${locations.length}`);
  console.log(`   ℹ️  SISTEM: 1 Lokasi = 1 Kelompok (TIDAK PAKAI KUOTA)`);
  
  // Sort lokasi berdasarkan ID (urutan input) - ASCENDING
  const sortedLocations = [...locations].sort((a, b) => (a.id_lokasi || 0) - (b.id_lokasi || 0));
  
  // Sort kelompok berdasarkan nomor kelompok - ASCENDING
  const sortedGroups = [...groups].sort((a, b) => a.nomor_kelompok - b.nomor_kelompok);
  
  console.log(`   📋 Urutan lokasi (by ID):`, sortedLocations.map(l => `${l.id_lokasi}:${l.lokasi}`).join(', '));
  
  // ✅ Count lokasi aman berdasarkan jarak puskesmas (bukan field faskes yang deprecated)
  const lokasiAmanCount = sortedLocations.filter(loc => isLokasiAmanUntukSakit(loc)).length;
  console.log(`   ✅ Lokasi AMAN (<5km puskesmas): ${lokasiAmanCount}`);
  console.log(`   ⚠️  Lokasi BERBAHAYA (>5km puskesmas): ${sortedLocations.length - lokasiAmanCount}\n`);
  
  // === STEP 1: ASSIGNMENT SEQUENTIAL (Kelompok N → Lokasi N) ===
  console.log('📍 STEP 1: Assignment Sequential (1:1 mapping)');
  
  let assignedCount = 0;
  const maxAssignments = Math.min(sortedGroups.length, sortedLocations.length);
  
  for (let i = 0; i < maxAssignments; i++) {
    const group = sortedGroups[i];
    const location = sortedLocations[i];
    
    assignLocationToGroup(group, location);
    assignedCount++;
    
    const hasSakit = group.stats && group.stats.sakit > 0;
    // ✅ Gunakan kategori_jarak untuk menentukan apakah lokasi aman (bukan field faskes yang deprecated)
    const isAman = isLokasiAmanUntukSakit(location);
    const jarakInfo = location.jarak_ke_puskesmas ? `${parseFloat(location.jarak_ke_puskesmas).toFixed(1)}km` : location.kategori_jarak || '';
    
    console.log(`   ✓ Kelompok ${group.nomor_kelompok} → Lokasi ${location.id_lokasi}: ${location.lokasi} ${jarakInfo ? `(${jarakInfo})` : ''} ${isAman ? '✅' : ''}`);
  }
  
  // Mark kelompok yang tidak dapat lokasi
  for (let i = maxAssignments; i < sortedGroups.length; i++) {
    const group = sortedGroups[i];
    group.id_lokasi = null;
    group.lokasi = 'BELUM DITEMPATKAN';
    group.desa = null;
    group.kecamatan = null;
    group.kabupaten = null;
    group.latitude = null;
    group.longitude = null;
    group.jarak_ke_puskesmas = null;
    group.puskesmas_terdekat = null;
    group.kategori_jarak = null;
  }
  
  // === STEP 2: MEMBER SWAPPING (Prioritas Lokasi Aman untuk Peserta Sakit) ===
  console.log('\n📍 STEP 2: Member Swapping (Prioritas Lokasi Aman untuk Peserta Sakit)');
  
  const assignedGroups = sortedGroups.filter(g => g.id_lokasi);
  
  // Identifikasi mismatch berdasarkan kategori jarak
  const groupsAmanNoSick = []; // Kelompok di lokasi aman (hijau/biru) tapi tidak ada sakit
  const groupsBahayaButSick = []; // Kelompok di lokasi berbahaya (merah/kuning) tapi ada sakit
  
  assignedGroups.forEach(group => {
    // Cari data lokasi lengkap
    const locationData = sortedLocations.find(l => l.id_lokasi === group.id_lokasi);
    const isAman = locationData ? isLokasiAmanUntukSakit(locationData) : false;
    const hasSakit = group.stats && group.stats.sakit > 0;
    
    if (isAman && !hasSakit) {
      groupsAmanNoSick.push({ group, location: locationData });
    } else if (!isAman && hasSakit) {
      groupsBahayaButSick.push({ group, location: locationData });
    }
  });
  
  console.log(`   🟢 Kelompok di lokasi aman (hijau/biru) tanpa sakit: ${groupsAmanNoSick.length}`);
  console.log(`   🔴 Kelompok di lokasi berbahaya (merah/kuning) dengan sakit: ${groupsBahayaButSick.length}`);
  
  let swapCount = 0;
  
  // Lakukan pertukaran anggota
  for (let i = 0; i < Math.min(groupsAmanNoSick.length, groupsBahayaButSick.length); i++) {
    const amanItem = groupsAmanNoSick[i];
    const bahayaItem = groupsBahayaButSick[i];
    
    // Ambil 1 anggota sakit dari kelompok berbahaya
    const sakitMemberIndex = bahayaItem.group.anggota.findIndex(m => isSakit(m));
    if (sakitMemberIndex === -1) continue;
    
    const sakitMember = bahayaItem.group.anggota[sakitMemberIndex];
    
    // Ambil 1 anggota sehat dari kelompok aman
    const sehatMemberIndex = amanItem.group.anggota.findIndex(m => !isSakit(m));
    if (sehatMemberIndex === -1) continue;
    
    const sehatMember = amanItem.group.anggota[sehatMemberIndex];
    
    // SWAP
    bahayaItem.group.anggota[sakitMemberIndex] = sehatMember;
    amanItem.group.anggota[sehatMemberIndex] = sakitMember;
    
    // Update stats
    recalculateGroupStats(amanItem.group);
    recalculateGroupStats(bahayaItem.group);
    
    swapCount++;
    
    // ✅ Gunakan jarak_ke_puskesmas atau kategori_jarak untuk display
    const amanInfo = amanItem.location.jarak_ke_puskesmas 
      ? `${parseFloat(amanItem.location.jarak_ke_puskesmas).toFixed(1)}km` 
      : amanItem.location.kategori_jarak || 'N/A';
    const bahayaInfo = bahayaItem.location.jarak_ke_puskesmas 
      ? `${parseFloat(bahayaItem.location.jarak_ke_puskesmas).toFixed(1)}km` 
      : bahayaItem.location.kategori_jarak || 'N/A';
    
    console.log(`   🔄 SWAP: ${sakitMember.nama} (sakit) → Kel${amanItem.group.nomor_kelompok} (${amanItem.group.lokasi} - ${amanInfo})`);
    console.log(`        ↔ ${sehatMember.nama} (sehat) → Kel${bahayaItem.group.nomor_kelompok} (${bahayaItem.group.lokasi} - ${bahayaInfo})`);
  }
  
  console.log(`\n✅ Total swapping: ${swapCount} pertukaran anggota`);
  
  const unassignedCount = sortedGroups.length - assignedCount;
  
  if (unassignedCount > 0) {
    console.log(`\n⚠️  ${unassignedCount} kelompok BELUM DITEMPATKAN (lokasi kurang)`);
    console.log(`   Silakan tambahkan ${unassignedCount} lokasi untuk menampung semua kelompok.`);
  }
  
  console.log(`\n✅ RINGKASAN PENEMPATAN:`);
  console.log(`   - ${assignedCount} kelompok berhasil ditempatkan`);
  console.log(`   - ${swapCount} pertukaran anggota (prioritas lokasi aman)`);
  console.log(`   - ${unassignedCount} kelompok belum ditempatkan`);
  console.log(`   - ${assignedCount} lokasi terpakai dari ${sortedLocations.length} tersedia\n`);
  
  // Return groups sorted by nomor_kelompok
  return groups.sort((a, b) => a.nomor_kelompok - b.nomor_kelompok);
}

/**
 * Helper function to assign location data to group
 */
function assignLocationToGroup(group, location) {
  group.id_lokasi = location.id_lokasi;
  group.lokasi = location.lokasi || `Lokasi ${location.id_lokasi}`;
  group.desa = location.desa;
  group.kecamatan = location.kecamatan;
  group.kabupaten = location.kabupaten;
  group.latitude = location.latitude;
  group.longitude = location.longitude;
  // ✅ Data jarak puskesmas (menggantikan field faskes yang sudah deprecated)
  group.jarak_ke_puskesmas = location.jarak_ke_puskesmas;
  group.puskesmas_terdekat = location.puskesmas_terdekat;
  group.kategori_jarak = location.kategori_jarak;
}

/**
 * MAIN FUNCTION: Generate Autogroup
 * Uses konfigurasi_kriteria to build rules object
 */
async function generateAutogroup(pool) {
  return new Promise((resolve, reject) => {
    // Step 1: Ambil konfigurasi autogrup terakhir
    pool.query(
      'SELECT * FROM konfigurasi_autogrup ORDER BY created_at DESC LIMIT 1',
      (konfErr, konfRows) => {
        if (konfErr) {
          return reject(new Error('Gagal mengambil konfigurasi: ' + konfErr.message));
        }
        
        if (konfRows.length === 0) {
          return reject(new Error('Belum ada konfigurasi autogroup. Silakan buat konfigurasi terlebih dahulu.'));
        }
        
        const baseConfig = konfRows[0];
        
        // Step 1.5: Cari periode yang sesuai dengan tahun akademik konfigurasi
        const tahunAkademik = baseConfig.angkatan_kkn || null;
        console.log('📅 Tahun Akademik dari Konfigurasi:', tahunAkademik);
        
        pool.query(
          `SELECT id_periode, nama_periode, tahun_akademik FROM periode_kkn WHERE tahun_akademik = ?`,
          [tahunAkademik],
          (periodeErr, periodeRows) => {
            if (periodeErr) {
              console.error('Warning: Gagal mengambil periode:', periodeErr.message);
            }
            
            const matchingPeriode = periodeRows && periodeRows.length > 0 ? periodeRows[0] : null;
            const idPeriodeForLocations = matchingPeriode ? matchingPeriode.id_periode : null;
            
            if (matchingPeriode) {
              console.log(`✅ Menggunakan lokasi dari periode: ${matchingPeriode.nama_periode} (ID: ${matchingPeriode.id_periode})`);
            } else {
              console.warn(`⚠️  Tidak ditemukan periode dengan tahun akademik: ${tahunAkademik}`);
              console.warn('   Akan menggunakan SEMUA lokasi (tanpa filter periode)');
            }
        
        // Step 2: Ambil konfigurasi_kriteria aktif dan konversi ke rules object
        pool.query(
          `SELECT kk.*, k.nama_kriteria, k.tipe_data 
           FROM konfigurasi_kriteria kk 
           JOIN kriteria k ON kk.id_kriteria = k.id_kriteria 
           WHERE kk.is_active = 1`,
          (kriteriaErr, kriteriaRows) => {
            if (kriteriaErr) {
              console.error('Warning: Gagal mengambil konfigurasi kriteria:', kriteriaErr.message);
            }
            
            // Konversi konfigurasi_kriteria menjadi rules object
            const rules = {
              jumlah_kelompok: 0, // akan dihitung otomatis
              min_anggota_per_kelompok: baseConfig.min_anggota_per_kelompok || 8,
              max_anggota_per_kelompok: baseConfig.max_anggota_per_kelompok || 12,
              variasi_prodi: baseConfig.variasi_prodi || 0,
              variasi_fakultas: baseConfig.variasi_fakultas || 0,
              aturan_jenis_kelamin: baseConfig.aturan_jenis_kelamin || 'bebas',
              sebar_peserta_sakit: baseConfig.sebar_peserta_sakit ?? true
            };
            
            // Parse konfigurasi_kriteria into rules
            if (kriteriaRows && kriteriaRows.length > 0) {
              kriteriaRows.forEach(kk => {
                const namaLower = (kk.nama_kriteria || '').toLowerCase();
                
                if (namaLower.includes('jumlah peserta') || namaLower.includes('anggota')) {
                  if (kk.tipe_data === 'range') {
                    rules.min_anggota_per_kelompok = kk.nilai_min || rules.min_anggota_per_kelompok;
                    rules.max_anggota_per_kelompok = kk.nilai_max || rules.max_anggota_per_kelompok;
                  }
                } else if (namaLower.includes('variasi prodi') || namaLower.includes('prodi')) {
                  rules.variasi_prodi = kk.nilai_min || rules.variasi_prodi;
                } else if (namaLower.includes('variasi fakultas') || namaLower.includes('fakultas')) {
                  rules.variasi_fakultas = kk.nilai_min || rules.variasi_fakultas;
                } else if (namaLower.includes('jenis kelamin') || namaLower.includes('gender')) {
                  rules.aturan_jenis_kelamin = kk.nilai_gender || rules.aturan_jenis_kelamin;
                } else if (namaLower.includes('sebar') || namaLower.includes('sakit') || namaLower.includes('riwayat')) {
                  rules.sebar_peserta_sakit = kk.nilai_boolean === 1 || kk.nilai_boolean === true;
                }
              });
            }
            
            console.log('\n========================================');
            console.log('📋 RULES DARI KONFIGURASI_KRITERIA:');
            console.log(JSON.stringify(rules, null, 2));
            console.log('========================================\n');
            
            // Step 3: Count total mahasiswa dan filter HANYA REGULER (is_reguler = 1)
            // Mahasiswa tematik (is_reguler = 0) TIDAK diikutkan dalam autogroup
            pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN is_reguler = 1 THEN 1 ELSE 0 END) as reguler, SUM(CASE WHEN is_reguler = 0 THEN 1 ELSE 0 END) as tematik FROM data_peserta_kkn', (countErr, countRows) => {
              const stats = countRows?.[0] || { total: 0, reguler: 0, tematik: 0 };
              console.log('\n📊 STATISTIK MAHASISWA:');
              console.log(`   - Total di database: ${stats.total}`);
              console.log(`   - Reguler (is_reguler=1): ${stats.reguler}`);
              console.log(`   - Tematik (is_reguler=0): ${stats.tematik}`);
              console.log(`   ⚠️  Hanya mahasiswa REGULER yang akan diproses autogroup\n`);
              
              // QUERY: Hanya ambil yang is_reguler = 1 (TANPA NULL)
              pool.query('SELECT * FROM data_peserta_kkn WHERE is_reguler = 1', (mhsErr, mhsRows) => {
                if (mhsErr) {
                  return reject(new Error('Gagal mengambil data mahasiswa: ' + mhsErr.message));
                }
                
                console.log(`✅ Mahasiswa reguler yang diambil untuk autogroup: ${mhsRows.length}`);
                
                if (mhsRows.length === 0) {
                  return reject(new Error('Tidak ada data mahasiswa reguler (is_reguler=1). Pastikan data sudah diimport dengan benar.'));
                }
              
              // Step 4: Shuffle mahasiswa untuk distribusi acak
                const shuffledMahasiswa = shuffleArray(mhsRows);
                
                // Step 5: Hitung statistik kesehatan
                const { sakit, sehat } = separateByHealth(shuffledMahasiswa);
                
                console.log('\n========================================');
                console.log('🔄 ALGORITMA IF-THEN RULE-BASED AUTOGROUP');
                console.log('========================================');
                console.log('📊 Data Mahasiswa Reguler (yang akan dikelompokkan):');
                console.log('   - Total Reguler:', shuffledMahasiswa.length);
                console.log('   - Sehat:', sehat.length);
                console.log('   - Sakit:', sakit.length);
                if (stats.tematik > 0) {
                  console.log(`   - Tematik (TIDAK diproses): ${stats.tematik}`);
                }
                console.log('');
                console.log('⚙️ Rules Applied:');
                console.log('   - Min anggota per kelompok:', rules.min_anggota_per_kelompok);
                console.log('   - Max anggota per kelompok:', rules.max_anggota_per_kelompok);
                console.log('   - Aturan gender:', rules.aturan_jenis_kelamin);
                console.log('   - Variasi prodi:', rules.variasi_prodi);
                console.log('   - Variasi fakultas:', rules.variasi_fakultas);
                console.log('   - Sebar peserta sakit:', rules.sebar_peserta_sakit, '(max 1 per kelompok)');
                console.log('========================================\n');
                
                // Step 6: Hitung jumlah kelompok optimal
                const jumlahKelompok = calculateOptimalGroups(
                  shuffledMahasiswa.length,
                  rules.min_anggota_per_kelompok,
                  rules.max_anggota_per_kelompok
                );
                rules.jumlah_kelompok = jumlahKelompok;
                
                console.log('📊 Jumlah kelompok optimal:', jumlahKelompok);
                console.log('🎯 Target: ' + rules.min_anggota_per_kelompok + '-' + rules.max_anggota_per_kelompok + ' anggota per kelompok\n');
                
                // Step 7: Buat struktur kelompok kosong
                const groups = createEmptyGroups(jumlahKelompok);
                
                // Step 8: Distribusi SEMUA mahasiswa (sakit + sehat) dengan IF-THEN scoring
                // Rule sebar_peserta_sakit akan diterapkan otomatis via canAddToGroup (max 1 sakit per kelompok)
                console.log('🔄 Distribusi mahasiswa ke kelompok dengan IF-THEN scoring...');
                console.log('   ⚕️  Mahasiswa sakit akan otomatis dibatasi max 1 per kelompok\n');
                
                const sisaMahasiswa = []; // Track mahasiswa yang tidak masuk kelompok
                
                for (const mhs of shuffledMahasiswa) {
                  const bestGroup = findBestGroup(groups, mhs, rules);
                  if (bestGroup) {
                    bestGroup.anggota.push(mhs);
                    updateGroupStats(bestGroup, mhs);
                    
                    // Log jika mahasiswa sakit ditempatkan
                    if (isSakit(mhs)) {
                      console.log(`   ⚕️  Mahasiswa sakit "${mhs.nama}" ditempatkan di Kelompok ${bestGroup.nomor_kelompok}`);
                    }
                  } else {
                    sisaMahasiswa.push(mhs);
                    console.warn(`⚠️  Tidak ada kelompok yang cocok untuk ${mhs.nama} (NIM: ${mhs.nim})`);
                  }
                }
              
              if (sisaMahasiswa.length > 0) {
                console.log(`\n⚠️  PERHATIAN: ${sisaMahasiswa.length} mahasiswa tidak masuk kelompok manapun:`);
                sisaMahasiswa.forEach(m => {
                  console.log(`   - ${m.nama} (${m.nim}) - ${m.prodi}`);
                });
              }
              console.log('✅ Distribusi mahasiswa selesai\n');
              
              // Step 10: Ambil lokasi dari database (filter by periode jika ada)
              // LOGIKA: 1 Lokasi (Dusun) = 1 Kelompok (Sequential Assignment, TIDAK PAKAI KUOTA)
              const totalMhs = shuffledMahasiswa.length;
              const jmlKelompok = jumlahKelompok;
              
              console.log('📍 Mengambil data lokasi (dusun) dari database...');
              console.log('   ℹ️  SISTEM: 1 Lokasi = 1 Kelompok (Sequential, tidak pakai kuota)');
              
              // Build query with optional periode filter
              let locationQuery = `SELECT l.id_lokasi, l.lokasi, 
                 d.nama AS desa, kc.nama AS kecamatan, k.nama AS kabupaten,
                 l.latitude, l.longitude,
                 l.jarak_ke_puskesmas, l.puskesmas_terdekat, l.kategori_jarak
                 FROM data_lokasi_kkn l
                 LEFT JOIN kabupaten k ON l.id_kabupaten = k.id_kabupaten
                 LEFT JOIN kecamatan kc ON l.id_kecamatan = kc.id_kecamatan
                 LEFT JOIN desa d ON l.id_desa = d.id_desa`;
              
              const queryParams = [];
              if (idPeriodeForLocations) {
                locationQuery += ` WHERE l.id_periode = ?`;
                queryParams.push(idPeriodeForLocations);
                console.log(`   🔍 Filter: Hanya lokasi dari periode ID ${idPeriodeForLocations}`);
              } else {
                console.log('   ⚠️  Filter periode TIDAK aktif - mengambil semua lokasi');
              }
              locationQuery += ` ORDER BY l.id_lokasi ASC`;
              
              pool.query(locationQuery, queryParams, (locErr, locRows) => {
                  if (locErr) {
                    console.error('❌ Error fetching locations:', locErr);
                    locRows = [];
                  }
                  
                  console.log(`📍 QUERY LOKASI RESULT: ${locRows ? locRows.length : 0} rows`);
                  if (locRows && locRows.length > 0) {
                    console.log('   Sample lokasi data:', JSON.stringify(locRows[0], null, 2));
                  }
                  
                  if (!locRows || locRows.length === 0) {
                    console.warn('⚠️  TIDAK ADA DATA LOKASI di database!');
                    console.warn('   Semua kelompok akan dibuat tanpa lokasi (BELUM DITEMPATKAN)');
                    console.warn('   Silakan tambahkan data lokasi (dusun) di menu Data Lokasi\n');
                  } else {
                    console.log(`✓ Ditemukan ${locRows.length} lokasi (dusun) tersedia`);
                    // ✅ Count lokasi aman berdasarkan jarak puskesmas
                    const lokasiAmanInitial = locRows.filter(l => {
                      const kategori = (l.kategori_jarak || '').toLowerCase();
                      return kategori.includes('sangat') || kategori === 'dekat';
                    }).length;
                    console.log(`   - ${lokasiAmanInitial} lokasi AMAN (<5km puskesmas)`);
                    console.log(`   - ${locRows.length - lokasiAmanInitial} lokasi BERBAHAYA (>5km puskesmas)`);
                    if (locRows.length < jmlKelompok) {
                      console.warn(`⚠️  Lokasi kurang! Ada ${jmlKelompok} kelompok tapi hanya ${locRows.length} lokasi`);
                      console.warn(`   ${jmlKelompok - locRows.length} kelompok akan berstatus BELUM DITEMPATKAN\n`);
                    } else {
                      console.log(`✓ Semua ${jmlKelompok} kelompok akan mendapat lokasi\n`);
                    }
                  }
                  
                  continueWithLocations(locRows || []);
                  
                  function continueWithLocations(locationsData) {
                    // Step 11: Assign lokasi ke kelompok 
                    // LOGIKA: 1 Lokasi = 1 Kelompok (prioritas lokasi AMAN untuk kelompok dengan sakit)
                    let finalGroups = groups;
                    if (locationsData && locationsData.length > 0) {
                      console.log('🗺️  Langkah 3: Penempatan lokasi ke kelompok...');
                      console.log('   - Lokasi tersedia:', locationsData.length);
                      
                      // ✅ Data jarak sudah ada di database (dari query pertama)
                      console.log('   ✅ Menggunakan data lokasi dari query (sudah lengkap dengan jarak puskesmas)');
                      
                      const lokasiAman = locationsData.filter(l => isLokasiAmanUntukSakit(l)).length;
                      console.log(`   🟢 Lokasi AMAN untuk peserta sakit (<5km puskesmas): ${lokasiAman}`);
                      console.log(`   🔴 Lokasi BERBAHAYA untuk peserta sakit (>5km puskesmas): ${locationsData.length - lokasiAman}`);
                      
                      finalGroups = assignLocationsToGroups(groups, locationsData);
                      console.log('✅ Penempatan lokasi selesai\n');
                      
                      finishGrouping(finalGroups, locationsData);
                    } else {
                      console.warn('⚠️  Tidak ada lokasi. Semua kelompok berstatus BELUM DITEMPATKAN.\n');
                      // Mark all as unassigned
                      groups.forEach(g => {
                        g.id_lokasi = null;
                        g.lokasi = 'BELUM DITEMPATKAN';
                        g.desa = null;
                        g.kecamatan = null;
                        g.kabupaten = null;
                        g.latitude = null;
                        g.longitude = null;
                        g.jarak_ke_puskesmas = null;
                        g.puskesmas_terdekat = null;
                        g.kategori_jarak = null;
                      });
                      
                      finishGrouping(groups, []);
                    }
                  }
                  
                  function finishGrouping(finalGroups, locationsData) {
                    // Hitung statistik akhir
                    const minAnggota = Math.min(...finalGroups.map(g => g.stats.total));
                    const maxAnggota = Math.max(...finalGroups.map(g => g.stats.total));
                    const kelompokDenganLokasi = finalGroups.filter(g => g.lokasi && g.lokasi !== 'BELUM DITEMPATKAN').length;
                    
                    const totalTergabung = finalGroups.reduce((sum, g) => sum + g.stats.total, 0);
                    const totalSisa = sisaMahasiswa.length;
                    
                    console.log('========================================');
                    console.log('✅ HASIL ALGORITMA IF-THEN RULE-BASED');
                    console.log('========================================');
                    console.log('📊 Statistik:');
                    console.log('   - Jumlah kelompok:', jmlKelompok);
                    console.log('   - Total mahasiswa:', totalMhs);
                    console.log('   - Tergabung dalam kelompok:', totalTergabung);
                    console.log('   - Sisa (belum terkelompok):', totalSisa);
                    console.log('   - Rata-rata per kelompok:', (totalTergabung / jmlKelompok).toFixed(1));
                    console.log('   - Min anggota:', minAnggota);
                    console.log('   - Max anggota:', maxAnggota);
                    console.log('   - Kelompok dengan lokasi:', kelompokDenganLokasi);
                    console.log('========================================\n');
                    
                    // Return hasil
                    resolve({
                      success: true,
                      rules: rules,
                      konfigurasi: baseConfig,
                      groups: finalGroups,
                      sisaMahasiswa: sisaMahasiswa, // Include sisa mahasiswa
                      statistics: {
                        total_mahasiswa: totalMhs,
                        total_tergabung: totalTergabung,
                        total_sisa: totalSisa,
                        total_sehat: sehat.length,
                        total_sakit: sakit.length,
                        jumlah_kelompok: jmlKelompok,
                        jumlah_lokasi: locationsData?.length || 0,
                        kelompok_dengan_lokasi: kelompokDenganLokasi,
                        avg_per_kelompok: (totalTergabung / jmlKelompok).toFixed(1),
                        min_anggota: minAnggota,
                        max_anggota: maxAnggota
                      }
                    });
                  }
                }
              );
            }); // Close pool.query SELECT mahasiswa callback
          }); // Close pool.query COUNT callback
        }
      );
      }); // Close periode_kkn query callback
    }
  );
});
}

module.exports = {
  generateAutogroup,
  shuffleArray,
  separateByHealth,
  calculateOptimalGroups,
  createEmptyGroups,
  updateGroupStats,
  countProdi,
  countFakultas,
  balanceGender,
  canAddToGroup,
  findBestGroup,
  distributePesertaSakit,
  assignLocationsToGroups,
  enrichLocationsWithDistance
};
