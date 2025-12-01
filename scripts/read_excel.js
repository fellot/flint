const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/december_features_additional.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Headers:', data[0]);
console.log('First row:', data[1]);
