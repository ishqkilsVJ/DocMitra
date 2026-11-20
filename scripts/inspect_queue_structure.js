import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const queueStart = html.indexOf('id="col-queue"');
const previewStart = html.indexOf('id="col-preview"');
const footerStart = html.indexOf('id="btnUndoRename"');

console.log('QUEUE CHUNK:\n', html.substring(queueStart, previewStart).slice(0, 1500));
console.log('\nPREVIEW CHUNK:\n', html.substring(previewStart, footerStart).slice(0, 1500));
