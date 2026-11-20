import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const start = html.indexOf('id="view-image-studio"');
const end = html.indexOf('id="view-print-studio"');
const chunk = html.substring(start, end);

const btns = chunk.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
[0, 1, 19, 20, 21, 22, 23].forEach(i => {
  console.log(`IMAGE BUTTON [${i}]:\n`, btns[i]);
});
