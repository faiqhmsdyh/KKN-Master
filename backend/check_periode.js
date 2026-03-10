const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'otomatisasi'
});

// Check periode 2024/2025
pool.query('SELECT * FROM periode_kkn WHERE angkatan = "2024"', (err, periodeRows) => {
  if (err) {
    console.error('Error checking periode:', err);
    pool.end();
    return;
  }
  
  console.log('\n📅 PERIODE 2024/2025:');
  if (periodeRows.length > 0) {
    console.log('✅ Found periode:', periodeRows[0].nama_periode);
    console.log('   ID:', periodeRows[0].id_periode);
    console.log('   Active:', periodeRows[0].is_active ? 'Yes' : 'No');
    console.log('   Tahun Akademik:', periodeRows[0].tahun_akademik);
    
    const periodeId = periodeRows[0].id_periode;
    
    // Check dosen with this periode
    pool.query(
      'SELECT COUNT(*) as total FROM data_dosen WHERE id_periode = ?',
      [periodeId],
      (err2, dosenRows) => {
        if (err2) {
          console.error('Error checking dosen:', err2);
        } else {
          console.log(`\n👥 DOSEN ASSIGNED: ${dosenRows[0].total} dosen`);
        }
        
        // Check dosen with NULL periode
        pool.query(
          'SELECT COUNT(*) as total FROM data_dosen WHERE id_periode IS NULL',
          (err3, nullRows) => {
            if (err3) {
              console.error('Error checking NULL dosen:', err3);
            } else {
              console.log(`⚠️  NULL PERIODE: ${nullRows[0].total} dosen\n`);
            }
            pool.end();
          }
        );
      }
    );
  } else {
    console.log('❌ Periode 2024/2025 NOT FOUND');
    pool.end();
  }
});
