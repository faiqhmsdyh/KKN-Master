const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'otomatisasi'
});

console.log('📊 CHECKING ALL PERIODE AND DOSEN ASSIGNMENTS\n');

// Get all periode with dosen counts
pool.query(`
  SELECT 
    p.id_periode,
    p.nama_periode,
    p.tahun_akademik,
    p.angkatan,
    p.is_active,
    p.jumlah_lokasi,
    p.jumlah_dosen as jumlah_dosen_stored,
    COUNT(d.id_dosen) as jumlah_dosen_actual
  FROM periode_kkn p
  LEFT JOIN data_dosen d ON p.id_periode = d.id_periode
  GROUP BY p.id_periode
  ORDER BY p.id_periode
`, (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
    pool.end();
    return;
  }
  
  console.log('═'.repeat(80));
  rows.forEach(row => {
    console.log(`\n📅 PERIODE ID: ${row.id_periode}`);
    console.log(`   Nama: ${row.nama_periode}`);
    console.log(`   Tahun Akademik: ${row.tahun_akademik || '-'}`);
    console.log(`   Angkatan: ${row.angkatan || '-'}`);
    console.log(`   Status: ${row.is_active ? '✅ Aktif' : '❌ Non-Aktif'}`);
    console.log(`   📍 Jumlah Lokasi: ${row.jumlah_lokasi}`);
    console.log(`   👥 Jumlah Dosen (Stored): ${row.jumlah_dosen_stored || 0}`);
    console.log(`   👥 Jumlah Dosen (Actual): ${row.jumlah_dosen_actual}`);
    
    if (row.jumlah_dosen_stored != row.jumlah_dosen_actual) {
      console.log(`   ⚠️  MISMATCH: Stored count doesn't match actual count!`);
    }
  });
  console.log('\n' + '═'.repeat(80) + '\n');
  
  pool.end();
});
