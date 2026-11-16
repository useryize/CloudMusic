import fs from 'node:fs'
import { htmlToMd } from './html2md.mjs'

const docs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const d = docs.find((x) => x.title === process.argv[3]) || docs[0]
console.log('TITLE: ' + d.title + '  PATH: ' + d.path.join(' / '))
console.log('----------------------------------------')
console.log(htmlToMd(d.content))
