const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'c:\\Users\\jerem\\Downloads\\Javic_Product_Import_Corrected.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get all data as JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
  
  console.log('Total rows:', data.length);
  console.log('\nFirst 5 rows:');
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
  
  // Check specific columns
  console.log('\nColumn headers:', Object.keys(data[0] || {}));
  
  // Check for sizes with commas
  console.log('\nRows with Size column:');
  data.forEach((row, i) => {
    if (row['Size']) {
      console.log(`Row ${i + 1}: Size = "${row['Size']}"`);
    }
  });
  
} catch (error) {
  console.error('Error:', error.message);
}
