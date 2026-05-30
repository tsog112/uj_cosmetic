const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const XLSX = require('xlsx');

const url = 'https://data.humdata.org/dataset/a9b0a8a6-cb14-448e-b35c-aa5eb51b0557/resource/8a9c3d58-1393-4bce-a7c1-af2e51142ab4/download/mng_admin_boundaries.xlsx';
const dest = path.join(__dirname, 'mng_admin_boundaries.xlsx');

function download(fileUrl, filePath, callback) {
  const protocol = fileUrl.startsWith('https') ? https : http;
  protocol.get(fileUrl, (response) => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      console.log(`Following redirect to: ${response.headers.location}`);
      return download(response.headers.location, filePath, callback);
    }
    
    if (response.statusCode !== 200) {
      return callback(new Error(`Failed to download file, status code: ${response.statusCode}`));
    }

    const file = fs.createWriteStream(filePath);
    response.pipe(file);
    file.on('finish', () => {
      file.close(() => callback(null));
    });
  }).on('error', (err) => {
    callback(err);
  });
}

console.log('Downloading OCHA Mongolia boundaries Excel (following redirects)...');
download(url, dest, (err) => {
  if (err) {
    console.error('Download error:', err.message);
    return;
  }
  console.log('Download complete. Reading Excel...');
  try {
    const workbook = XLSX.readFile(dest);
    console.log('Sheet names:', workbook.SheetNames);
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      console.log(`Sheet "${sheetName}" has ${rows.length} rows.`);
      if (rows.length > 0) {
        console.log('First row sample:', rows[0]);
      }
    }
  } catch (err) {
    console.error('Error reading Excel:', err);
  }
});
