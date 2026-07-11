const XLSX = require('xlsx-js-style');
const html = `<table><tr><td style="background-color: #ff0000; font-weight: bold;">Hello</td></tr></table>`;
const wb = XLSX.read(html, {type: 'string', cellStyles: true});
const ws = wb.Sheets.Sheet1;
console.log(JSON.stringify(ws['A1']));
