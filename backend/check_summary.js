require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'otomatisasi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('🔍 Checking periode summary columns...\n');

// Check stored columns
pool.query(`
  SELECT 
    id_periode, 
    nama_periode, 
    jumlah_lokasi AS stored_lokasi, 
    jumlah_dosen AS stored_dosen
  FROM periode_kkn 
  WHERE id_periode IN (3, 6)
  ORDER BY id_periode
`, (err, storedRows) => {
  if (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
  
  console.log('📊 STORED COLUMNS (in periode_kkn table):');
  storedRows.forEach(row => {
    console.log(`  ${row.nama_periode}: lokasi=${row.stored_lokasi}, dosen=${row.stored_dosen}`);
  });
  
  // Check realtime counts
  pool.query(`
    SELECT 
      p.id_periode,
      p.nama_periode,
      COUNT(DISTINCT l.id_lokasi) AS realtime_lokasi,
      COUNT(DISTINCT d.id_dosen) AS realtime_dosen
    FROM periode_kkn p
    LEFT JOIN data_lokasi_kkn l ON l.id_periode = p.id_periode
    LEFT JOIN data_dosen d ON d.id_periode = p.id_periode
    WHERE p.id_periode IN (3, 6)
    GROUP BY p.id_periode, p.nama_periode
    ORDER BY p.id_periode
  `, (err2, realtimeRows) => {
    if (err2) {
      console.error('❌ Error:', err2.message);
      process.exit(1);
    }
    
    console.log('\n📊 REALTIME COUNTS (via JOIN query):');
    realtimeRows.forEach(row => {
      console.log(`  ${row.nama_periode}: lokasi=${row.realtime_lokasi}, dosen=${row.realtime_dosen}`);
    });
    
    console.log('\n✅ Check complete');
    process.exit(0);
  });
});
