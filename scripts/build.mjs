/* Хостинг дээр тавих файлуудыг dist/ рүү хуулна: node scripts/build.mjs
   .openai/hosting.json нь dist хавтсыг статикаар тараадаг. */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const files = ['index.html', 'styles.css', 'layout.js', 'lessons.js', 'app.js'];

fs.mkdirSync(dist, { recursive: true });

/* Хуучин файлуудыг цэвэрлэнэ (зөвхөн хуулдаг өргөтгөлүүдийг) */
for (const name of fs.readdirSync(dist)) {
  if (/\.(html|css|js|map)$/.test(name) && !files.includes(name)) {
    fs.rmSync(path.join(dist, name));
    console.log('хассан:  ' + name);
  }
}

let total = 0;
for (const name of files) {
  const from = path.join(root, name);
  if (!fs.existsSync(from)) {
    console.error('АЛДАА: ' + name + ' байхгүй');
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(dist, name));
  const size = fs.statSync(from).size;
  total += size;
  console.log('хуулсан: ' + name.padEnd(12) + (size / 1024).toFixed(1) + ' KB');
}
console.log('dist/ бэлэн · нийт ' + (total / 1024).toFixed(1) + ' KB');
