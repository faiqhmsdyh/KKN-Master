const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'otomatisasi'
});

console.log('🔄 Updating id_periode from 7 to 2 in data_dosen table...\n');

// First, check current data
pool.query(
  'SELECT id_periode, COUNT(*) as total FROM data_dosen GROUP BY id_periode ORDER BY id_periode',
  (err, beforeRows) => {
    if (err) {
      console.error('❌ Error checking current data:', err);
      pool.end();
      return;
    }
    
    console.log('📊 BEFORE UPDATE:');
    beforeRows.forEach(row => {
      console.log(`   Periode ID ${row.id_periode}: ${row.total} dosen`);
    });
    console.log('');
    
    // Execute UPDATE
    pool.query(
      'UPDATE data_dosen SET id_periode = 2 WHERE id_periode = 7',
      (updateErr, result) => {
        if (updateErr) {
          console.error('❌ Error updating:', updateErr);
          pool.end();
          return;
        }
        
        console.log(`✅ Successfully updated ${result.affectedRows} records\n`);
        
        // Check after update
        pool.query(
          'SELECT id_periode, COUNT(*) as total FROM data_dosen GROUP BY id_periode ORDER BY id_periode',
          (err2, afterRows) => {
            if (err2) {
              console.error('❌ Error checking result:', err2);
              pool.end();
              return;
            }
            
            console.log('📊 AFTER UPDATE:');
            afterRows.forEach(row => {
              console.log(`   Periode ID ${row.id_periode}: ${row.total} dosen`);
            });
            console.log('');
            
            // Check periode names
            pool.query(
              'SELECT id_periode, nama_periode, angkatan FROM periode_kkn WHERE id_periode IN (2, 7)',
              (err3, periodeRows) => {
                if (err3) {
                  console.error('❌ Error checking periode:', err3);
                  pool.end();
                  return;
                }
                
                console.log('📅 PERIODE INFO:');
                periodeRows.forEach(row => {
                  console.log(`   ID ${row.id_periode}: ${row.nama_periode} (${row.angkatan})`);
                });
                console.log('');
                
                pool.end();
                console.log('✅ All done!');
              }
            );
          }
        );
      }
    );
  }
);
