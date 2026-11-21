/* Агуулгын шалгалт: node scripts/check.mjs
   Хөтөч шаардахгүй. Дасгалын текстэд бичиж болохгүй тэмдэгт орвол
   курсор дуугүйхэн гацдаг тул энэ шалгалт ЗАЙЛШГҮЙ. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const context = vm.createContext({ window: {}, console });
for (const file of ['layout.js', 'lessons.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const L = context.window.KH_LAYOUT;
const C = context.window.KH_LESSONS;

const problems = [];
const fail = msg => problems.push(msg);
const typeable = str => Array.from(str).filter(ch => !L.reverseMap[ch]);

/* 1. Гарын зураглал */
const noKey = Array.from(L.alphabet).filter(ch => !L.reverseMap[ch]);
if (noKey.length) fail(`Товчгүй үсэг: ${noKey.join(' ')}`);

/* 2. Сургалтын замнал: үсэг давхардалгүй, бүрэн */
const seen = new Map();
C.curriculum.forEach(lesson => {
  if (!lesson.keys) return;
  lesson.keys.split(' ').filter(Boolean).forEach(ch => {
    if (seen.has(ch)) fail(`[${ch}] үсэг хоёр дасгалд: ${seen.get(ch)} ба ${lesson.key}`);
    seen.set(ch, lesson.key);
  });
});
const missing = Array.from(L.alphabet).filter(ch => !seen.has(ch));
if (missing.length) fail(`Замналд ороогүй үсэг: ${missing.join(' ')}`);

/* 3. Дасгалын түлхүүр давхардахгүй */
const keys = new Set();
[...C.curriculum, ...C.fingerDrills, ...C.texts].forEach(item => {
  if (keys.has(item.key)) fail(`Түлхүүр давхардсан: ${item.key}`);
  keys.add(item.key);
});

/* 4. Том үсэг, тэмдэг шаардсан дасгал бүх товчийг сурсны дараа байх */
const lastKeyLesson = C.curriculum.reduce((last, lesson, i) => (lesson.keys ? i : last), -1);
C.curriculum.forEach((lesson, i) => {
  const needsAll = lesson.names || lesson.punct || lesson.digits || lesson.sentences || lesson.mixed;
  if (needsAll && i < lastKeyLesson) fail(`${lesson.key} дасгал үсгийн дасгалуудаас эрт байна`);
});

/* 5. Текст үүсгэгч: дасгал бүрийг 25 удаа үүсгэж шалгана */
[...C.curriculum, ...C.fingerDrills, ...C.texts].forEach(lesson => {
  for (let i = 0; i < 25; i++) {
    const text = C.buildText(lesson);
    if (!text || text.length < 8) { fail(`${lesson.key}: текст хэт богино ("${text}")`); break; }
    const bad = typeable(text);
    if (bad.length) { fail(`${lesson.key}: бичиж болохгүй тэмдэгт ${JSON.stringify(bad)}`); break; }
  }
});

/* 6. Үгийн дасгалд хүрэлцэх үг байгаа эсэх */
C.curriculum.filter(lesson => lesson.words).forEach(lesson => {
  const count = C.eligibleWordCount(lesson);
  if (count < lesson.words) fail(`${lesson.key}: ${lesson.words} үг хэрэгтэй ч ${count} л тохирно`);
});

/* 7. Үгийн сан: жижиг үсэг, бичигдэх боломжтой */
C.WORDS.forEach(word => {
  if (word !== word.toLowerCase()) fail(`Үгийн сан дахь том үсэг: ${word}`);
  const bad = Array.from(word).filter(ch => !L.alphabet.includes(ch));
  if (bad.length) fail(`${word}: үсэг бус тэмдэгт ${JSON.stringify(bad)}`);
});

/* 8. Бусад текстүүд */
[...C.SENTENCES, ...C.NAMES, ...C.PUNCT, ...C.DIGITS].forEach(str => {
  const bad = typeable(str);
  if (bad.length) fail(`"${str.slice(0, 30)}": бичиж болохгүй ${JSON.stringify(bad)}`);
});

/* 9. Хуруу тус бүрийн дасгал бүх үсгийг нэг удаа хамрах */
const drilled = [];
C.fingerDrills.forEach(drill => (drill.letters || []).forEach(ch => drilled.push(ch)));
const dup = drilled.filter((ch, i) => drilled.indexOf(ch) !== i);
if (dup.length) fail(`Хурууны дасгалд давхардсан үсэг: ${dup.join(' ')}`);
const notDrilled = Array.from(L.alphabet).filter(ch => drilled.indexOf(ch) === -1);
if (notDrilled.length) fail(`Хурууны дасгалд байхгүй үсэг: ${notDrilled.join(' ')}`);
C.fingerDrills.forEach(drill => {
  if (drill.letters && drill.letters.length > 3) fail(`${drill.key}: нэг хуруунд ${drill.letters.length} үсэг (дээд тал 3)`);
});

/* 10. Алдааны дасгал */
const weak = C.weakDrill({ 'ө': 5, 'ж': 3, 'щ': 2 });
if (!weak) fail('weakDrill хоосон буцлаа');
else if (typeable(weak.text).length) fail('weakDrill: бичиж болохгүй тэмдэгт');
if (C.weakDrill({}) !== null) fail('weakDrill хоосон түүх дээр null буцаах ёстой');

/* ---------------- Дүн ---------------- */
const stats = {
  'дасгалын замнал': C.curriculum.length,
  'хурууны дасгал': C.fingerDrills.length,
  'уран зохиол': C.texts.length,
  'үгийн сан': C.WORDS.length,
  'өгүүлбэр': C.SENTENCES.length,
  'нийт од': C.maxStars
};
console.log(Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join(' · '));

if (problems.length) {
  console.error(`\n${problems.length} алдаа:`);
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log('Шалгалт OK');
