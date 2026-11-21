import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const start = html.indexOf('id="view-bulk-renamer"');
const end = html.indexOf('<section id="view-pdf-studio"');
const chunk = html.substring(start, end);

// Let's find all buttons and inputs
const tagMatches = chunk.match(/<(button|input|select)[^>]*>/gi) || [];
console.log('--- BUTTONS / INPUTS IN RENAMER ---');
tagMatches.forEach(t => console.log(t));

// Let's find all elements with class containing 'col-'
const colMatches = chunk.match(/id="col-[^"]*"/gi) || [];
console.log('--- COLUMNS ---', colMatches);
