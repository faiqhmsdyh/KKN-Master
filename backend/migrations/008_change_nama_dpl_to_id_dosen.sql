-- Change nama_dpl to id_dosen with FK to master_dosen
ALTER TABLE detail_hasil_autogrup DROP COLUMN IF EXISTS nama_dpl;

ALTER TABLE detail_hasil_autogrup 
ADD COLUMN id_dosen VARCHAR(10) DEFAULT NULL AFTER kabupaten,
ADD CONSTRAINT fk_detail_hasil_dosen 
  FOREIGN KEY (id_dosen) REFERENCES master_dosen(id_dosen) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Create index for faster joins
CREATE INDEX idx_id_dosen ON detail_hasil_autogrup(id_dosen);
