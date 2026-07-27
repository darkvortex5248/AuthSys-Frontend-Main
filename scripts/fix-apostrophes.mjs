import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const base = 'D:/TESTING_ALL/new_web/RinoxAuth/frontend/src/app'
const { execSync } = await import('child_process')
const result = execSync(`dir "${base}" /s /b page.tsx`, { encoding: 'utf8' })
const files = result.trim().split('\r\n').filter(Boolean)

const curlyApostrophe = String.fromCharCode(0x2019)
let count = 0

for (const f of files) {
  let content = readFileSync(f, 'utf8')
  const searchStr = 'RinoxAuth' + "'" + 's'
  if (content.includes(searchStr)) {
    content = content.split(searchStr).join('RinoxAuth' + curlyApostrophe + 's')
    writeFileSync(f, content, 'utf8')
    console.log('Fixed:', join(base, f))
    count++
  }
}
console.log('Fixed ' + count + ' files')
