const fs = require('fs');
const rows = JSON.parse(fs.readFileSync('scratch/sheet_rows.json', 'utf8'));

console.log('Searching Google Sheet rows for phone numbers starting with 8 or containing 825...');

const target = '82535923';
const targetSub = '8253';

rows.forEach((row, index) => {
  const phone = String(row[3] || '');
  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
  
  if (cleanPhone.startsWith('82') || cleanPhone.startsWith('9182') || cleanPhone.includes(targetSub) || cleanPhone.includes('825')) {
    console.log(`Row ${index + 1}: Name: ${row[1]} | Phone: ${row[3]} | Email: ${row[2]} | Date: ${row[0]}`);
  }
});
