const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'otomatisasi'
});

console.log('🔄 Recalculating jumlah_dosen for all periode...\n');

// Recalculate jumlah_dosen for all periode
pool.query(`
  UPDATE periode_kkn p
  SET p.jumlah_dosen = (
    SELECT COUNT(*) 
    FROM data_dosen d 
    WHERE d.id_periode = p.id_periode
  )
`, (err, result) => {
  if (err) {
    console.error('❌ Error updating jumlah_dosen:', err);
    pool.end();
    return;
  }
  
  console.log(`✅ Updated ${result.affectedRows} periode records\n`);
  
  // Verify the results
  pool.query(`
    SELECT 
      p.id_periode,
      p.nama_periode,
      p.jumlah_lokasi,
      p.jumlah_dosen,
      COUNT(d.id_dosen) as actual_dosen
    FROM periode_kkn p
    LEFT JOIN data_dosen d ON p.id_periode = d.id_periode
    GROUP BY p.id_periode
    ORDER BY p.id_periode
  `, (err2, rows) => {
    if (err2) {
      console.error('❌ Error checking results:', err2);
      pool.end();
      return;
    }
    
    console.log('📊 VERIFICATION RESULTS:');
    console.log('═'.repeat(70));
    rows.forEach(row => {
      const match = row.jumlah_dosen === row.actual_dosen;
      const status = match ? '✅' : '❌';
      console.log(`${status} Periode ${row.id_periode}: ${row.nama_periode}`);
      console.log(`   📍 Lokasi: ${row.jumlah_lokasi} | 👥 Dosen: ${row.jumlah_dosen} (Actual: ${row.actual_dosen})`);
    });
    console.log('═'.repeat(70) + '\n');
    
    pool.end();
    console.log('✅ Recalculation complete!');
  });
});
