import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const start = html.indexOf('id="view-pdf-studio"');
const end = html.indexOf('id="view-image-studio"');
const chunk = html.substring(start, end);

const btns = chunk.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
[0, 1, 18, 19, 20, 21, 22].forEach(i => {
  console.log(`BUTTON [${i}]:\n`, btns[i]);
});
