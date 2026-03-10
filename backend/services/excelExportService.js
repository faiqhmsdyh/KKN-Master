const ExcelJS = require('exceljs');

/**
 * Generate Excel file dengan format terstruktur per kelompok
 * Structure: 
 * - Header Kelompok (Lokasi, Desa/Kecamatan, Kabupaten)
 * - Sub-header (NO, NIM, NAMA, PRODI, FAKULTAS, KELOMPOK, NO.TELEPON)
 * - Data Mahasiswa per kelompok
 */
async function generateGroupingExcel(groupingData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Hasil Penempatan KKN');

  // Set column widths
  worksheet.columns = [
    { key: 'no', width: 5 },
    { key: 'nim', width: 15 },
    { key: 'nama', width: 30 },
    { key: 'prodi', width: 30 },
    { key: 'fakultas', width: 35 },
    { key: 'kelompok', width: 12 },
    { key: 'no_telepon', width: 15 }
  ];

  let currentRow = 1;

  // Iterate through each group
  const groups = groupingData.groups || [];
  
  groups.forEach((group, groupIndex) => {
    // === HEADER KELOMPOK (2 rows) - Format: Label di A, Value di B-C, Label di D, Value di E-G ===
    
    // Row 1: Lokasi | (value span B-C) | Kabupaten | (value span E-G)
    worksheet.getCell(`A${currentRow}`).value = 'Lokasi';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = group.lokasi || 'BELUM DITEMPATKAN';
    worksheet.getCell(`B${currentRow}`).font = { size: 11 };
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`B${currentRow}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    worksheet.getCell(`D${currentRow}`).value = 'Kabupaten';
    worksheet.getCell(`D${currentRow}`).font = { bold: true, size: 11 };
    worksheet.getCell(`D${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`D${currentRow}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    worksheet.mergeCells(`E${currentRow}:G${currentRow}`);
    worksheet.getCell(`E${currentRow}`).value = group.kabupaten || '';
    worksheet.getCell(`E${currentRow}`).font = { size: 11 };
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`E${currentRow}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    currentRow++;
    
    // Row 2: Desa/Kecamatan | (value span B-C) | DPL | (value span E-G)
    worksheet.getCell(`A${currentRow}`).value = 'Desa/Kecamatan';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`A${currentRow}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    const desaKecamatan = [group.desa, group.kecamatan]
      .filter(Boolean)
      .join(' / ') || '';
    
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.getCell(`B${currentRow}`).value = desaKecamatan;
    worksheet.getCell(`B${currentRow}`).font = { size: 11 };
    worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`B${currentRow}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    worksheet.getCell(`D${currentRow}`).value = 'DPL';
    worksheet.getCell(`D${currentRow}`).font = { bold: true, size: 11 };
    worksheet.getCell(`D${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`D${currentRow}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    worksheet.mergeCells(`E${currentRow}:G${currentRow}`);
    worksheet.getCell(`E${currentRow}`).value = group.nama_dpl || '-';
    worksheet.getCell(`E${currentRow}`).font = { size: 11 };
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getCell(`E${currentRow}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    currentRow++;
    
    // === SUB-HEADER (Column Names) ===
    const subHeaderRow = worksheet.getRow(currentRow);
    subHeaderRow.values = ['NO', 'NIM', 'NAMA', 'PRODI', 'FAKULTAS', 'KELOMPOK', 'NO.TELEPON'];
    subHeaderRow.font = { bold: true, size: 10 };
    subHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' }
    };
    subHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    subHeaderRow.height = 20;
    
    subHeaderRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    currentRow++;
    
    // === DATA MAHASISWA ===
    if (group.anggota && group.anggota.length > 0) {
      group.anggota.forEach((mahasiswa, idx) => {
        const dataRow = worksheet.getRow(currentRow);
        dataRow.values = [
          idx + 1,
          mahasiswa.nim || '',
          mahasiswa.nama || '',
          mahasiswa.prodi || '',
          mahasiswa.fakultas || '',
          group.nomor_kelompok,
          mahasiswa.nomor_telepon || ''
        ];
        dataRow.font = { size: 10 };
        dataRow.alignment = { vertical: 'middle' };
        dataRow.height = 18;
        
        // Border untuk setiap cell
        dataRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Center align untuk NO, NIM, KELOMPOK, dan NO.TELEPON
          if (colNumber === 1 || colNumber === 2 || colNumber === 6 || colNumber === 7) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
        
        currentRow++;
      });
    } else {
      // Empty group
      const emptyRow = worksheet.getRow(currentRow);
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = '(Tidak ada anggota)';
      worksheet.getCell(`A${currentRow}`).font = { italic: true, size: 10, color: { argb: 'FF999999' } };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(`A${currentRow}`).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      currentRow++;
    }
    
    // Spacing between groups (1 empty row)
    currentRow++;
  });

  return workbook;
}

/**
 * Export endpoint handler
 */
async function exportGroupingToExcel(req, res, pool) {
  try {
    const { id_grouping } = req.params;
    
    // Fetch grouping data
    pool.query(
      'SELECT * FROM grouping_history WHERE id_grouping = ?',
      [id_grouping],
      async (err, rows) => {
        if (err) {
          console.error('Error fetching grouping:', err);
          return res.status(500).json({ error: 'Gagal mengambil data: ' + err.message });
        }
        
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Grouping tidak ditemukan' });
        }
        
        let groupingData;
        try {
          groupingData = JSON.parse(rows[0].data_grouping);
        } catch (parseErr) {
          console.error('Error parsing JSON:', parseErr);
          return res.status(500).json({ error: 'Data grouping rusak' });
        }
        
        // Generate Excel
        const workbook = await generateGroupingExcel(groupingData);
        
        // Set response headers
        const filename = `Hasil_Penempatan_KKN_${rows[0].periode_angkatan || 'Export'}.xlsx`;
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`
        );
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Export Excel berhasil: ${filename}`);
      }
    );
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Gagal export ke Excel: ' + error.message });
  }
}

/**
 * Export hasil_autogrup to Excel (using existing table structure)
 */
async function exportHasilAutogrupToExcel(req, res, pool) {
  try {
    const { id } = req.params;
    
    console.log('📥 Export Excel for id_hasil:', id);
    
    // Check if data exists first
    pool.query(
      'SELECT COUNT(*) as count FROM detail_hasil_autogrup WHERE id_hasil = ?',
      [id],
      (countErr, countRows) => {
        if (countErr) {
          console.error('❌ Error checking detail count:', countErr);
          return res.status(500).json({ 
            error: 'Database error: ' + countErr.message 
          });
        }
        
        const count = countRows[0].count;
        console.log(`📊 Found ${count} records for export`);
        
        if (count === 0) {
          return res.status(404).json({ 
            error: 'Data tidak ditemukan untuk hasil ini' 
          });
        }
        
        // Fetch detail data grouped by kelompok
        pool.query(
          `SELECT 
            d.*,
            m.nama AS nama_dpl
          FROM detail_hasil_autogrup d
            LEFT JOIN data_dosen m ON d.id_dosen = m.id_dosen
          WHERE d.id_hasil = ? 
          ORDER BY d.nomor_kelompok, d.nama`,
          [id],
          async (err, rows) => {
            if (err) {
              console.error('❌ Error fetching detail for export:', err);
              console.error('❌ Error code:', err.code);
              
              // If data_dosen table doesn't exist, try without JOIN
              if (err.code === 'ER_NO_SUCH_TABLE' || err.sqlMessage?.includes('data_dosen')) {
                console.warn('⚠️ Table data_dosen not found, exporting without DPL info');
                pool.query(
                  'SELECT * FROM detail_hasil_autogrup WHERE id_hasil = ? ORDER BY nomor_kelompok, nama',
                  [id],
                  async (err2, rows2) => {
                    if (err2) {
                      return res.status(500).json({ error: 'Gagal mengambil data: ' + err2.message });
                    }
                    await processExportData(rows2, id, pool, res);
                  }
                );
                return;
              }
              
              return res.status(500).json({ error: 'Gagal mengambil data: ' + err.message });
            }
            
            await processExportData(rows, id, pool, res);
          }
        );
      }
    );
    
  } catch (error) {
    console.error('❌ Error exporting to Excel:', error);
    res.status(500).json({ error: 'Gagal export ke Excel: ' + error.message });
  }
}

async function processExportData(rows, id, pool, res) {
  try {
    // Group by nomor_kelompok
    const grouped = {};
    rows.forEach(row => {
      if (!grouped[row.nomor_kelompok]) {
        grouped[row.nomor_kelompok] = {
          nomor_kelompok: row.nomor_kelompok,
          id_lokasi: row.id_lokasi,
          lokasi: row.lokasi,
          desa: row.desa,
          kecamatan: row.kecamatan,
          kabupaten: row.kabupaten,
          nama_dpl: row.nama_dpl || '', // May be null
          anggota: []
        };
      }
      grouped[row.nomor_kelompok].anggota.push({
        nim: row.nim,
        nama: row.nama,
        prodi: row.prodi,
        fakultas: row.fakultas,
        jenis_kelamin: row.jenis_kelamin,
        nomor_telepon: row.nomor_telepon,
        kesehatan: row.kesehatan
      });
    });
    
    const groupingData = {
      groups: Object.values(grouped)
    };
    
    // Fetch header info for filename
    pool.query(
      'SELECT angkatan_kkn FROM hasil_autogrup WHERE id_hasil = ?',
      [id],
      async (headerErr, headerRows) => {
        const angkatan = headerRows && headerRows[0] ? headerRows[0].angkatan_kkn : 'Export';
        
        // Generate Excel
        const workbook = await generateGroupingExcel(groupingData);
        
        // Set response headers
        const filename = `Hasil_Penempatan_KKN_${angkatan}.xlsx`;
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`
        );
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Export Excel berhasil: ${filename}`);
      }
    );
  } catch (error) {
    console.error('❌ Error processing export data:', error);
    throw error;
  }
}

module.exports = {
  generateGroupingExcel,
  exportGroupingToExcel,
  exportHasilAutogrupToExcel
};
