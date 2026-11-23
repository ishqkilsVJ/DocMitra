import { buildName, cleanName, matchFilenameSmart, evaluateMatch, matchDocument } from '../rename_tool_logic.js';
import { BUILTIN_PRESETS, DEFAULT_SHORTCUTS } from '../rename_tool_ui.js';

console.log('--- 🧪 RUNNING DEEP QA & SUBSTRING COLLISION TESTS ---');

const testCases = [
  { name: 'Pankesh PAN Card direct', file: 'pankesh_pan.pdf', student: 'Pankesh' },
  { name: 'Pankesh single PAN code input', input: 'PAN', student: 'Pankesh' },
  { name: 'Pankesh P A N space input', input: 'P A N', student: 'Pankesh' },
  { name: 'Pankesh already in base', input: 'PAN CARD PANKESH', student: 'Pankesh' },
  { name: 'Pankesh raw input', input: 'Pankesh', student: 'Pankesh' },
  { name: 'Pankesh PAN Card raw', input: 'pan card', student: 'Pankesh' },
  { name: 'Dominic DOM input', input: 'DOM', student: 'Dominic' },
  { name: 'Dominic D O M input', input: 'D O M', student: 'Dominic' },
  { name: 'Dominic raw name', input: 'Dominic', student: 'Dominic' },
  { name: 'Indira INC input', input: 'INC', student: 'Indira' },
  { name: 'Prakash CAS input', input: 'CAS', student: 'Prakash' },
  { name: 'Prakash CST input', input: 'CST', student: 'Prakash' }
];

for (const tc of testCases) {
  console.log(`\nTesting: [${tc.name}] | Student: "${tc.student}"`);
  if (tc.file) {
    const match = matchFilenameSmart(tc.file, tc.student);
    console.log(`  Filename match: "${tc.file}" -> ${match.canonical} (${match.confidence}%)`);
  }
  if (tc.input) {
    const builtUpper = buildName(tc.input, tc.student, null, 'upper');
    const builtTitle = buildName(tc.input, tc.student, null, 'title');
    const builtLower = buildName(tc.input, tc.student, null, 'lower');
    console.log(`  Input: "${tc.input}"`);
    console.log(`    -> Upper: "${builtUpper}"`);
    console.log(`    -> Title: "${builtTitle}"`);
    console.log(`    -> Lower: "${builtLower}"`);
  }
}
