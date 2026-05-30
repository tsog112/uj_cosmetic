const XLSX = require('xlsx');
const workbook = XLSX.readFile('mng_admin_boundaries.xlsx');

const adm1 = workbook.Sheets['mng_admin1'];
const rows1 = XLSX.utils.sheet_to_json(adm1);
console.log('ADM1 sample (first 5 rows):');
console.log(rows1.slice(0, 5));

const adm2 = workbook.Sheets['mng_admin2'];
const rows2 = XLSX.utils.sheet_to_json(adm2);
console.log('\nADM2 sample (first 5 rows):');
console.log(rows2.slice(0, 5));
