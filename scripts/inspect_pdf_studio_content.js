import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const start = html.indexOf('id="view-pdf-studio"');
const end = html.indexOf('id="view-image-studio"');
const chunk = html.substring(start, end);

const btns = chunk.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
console.log('PDF STUDIO BUTTONS count:', btns.length);
btns.forEach((b, i) => console.log(`[${i}] ${b.slice(0, 150)}`));
