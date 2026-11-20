import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const start = html.indexOf('id="view-image-studio"');
const end = html.indexOf('id="view-print-studio"');
const chunk = html.substring(start, end);

const idMatches = chunk.match(/id="([^"]+)"/g) || [];
console.log('IMAGE STUDIO IDs:\n', idMatches);

const toolBtns = chunk.match(/class="tool-ribbon-btn[^"]*"[\s\S]*?<\/a>/gi) || [];
console.log('\nIMAGE TOOL RIBBON BUTTONS count:', toolBtns.length);
toolBtns.forEach(b => {
  const label = b.match(/<span class="font-label-md[^"]*">([^<]+)<\/span>/i) || b.match(/<span>([^<]+)<\/span>/i);
  console.log(' - Tool:', label ? label[1] : 'Unknown');
});

const btns = chunk.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
console.log('\nIMAGE STUDIO BUTTONS count:', btns.length);
btns.forEach((b, i) => console.log(`[${i}] ${b.slice(0, 150)}`));
