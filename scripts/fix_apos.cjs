const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const base = 'D:/TESTING_ALL/new_web/RinoxAuth/frontend/src/app';
const result = execSync('dir "' + base + '" /s /b page.tsx', { encoding: 'utf8' });
const files = result.trim().split('\r\n').filter(Boolean);

const curly = String.fromCharCode(0x2019);
let count = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const search = "RinoxAuth's";
  if (content.includes(search)) {
    content = content.split(search).join('RinoxAuth' + curly + 's');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed:', path.relative(base, f));
    count++;
  }
}
console.log('Fixed ' + count + ' files');
