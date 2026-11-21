'use strict';
/* Дасгалын агуулга: сургалтын замнал, үгийн сан, текстүүд.
   Дасгал бүр шинээр үүсгэгдэх тул хүүхэд текстийг цээжилж чадахгүй. */
window.KH_LESSONS = (function () {

  const L = window.KH_LAYOUT;

  /* ---------------- Үгийн сан ---------------- */
  /* Зөвхөн жижиг үсэг. Дасгал бүр өөрийн сурсан үсгүүдээр шүүж авна. */
  const WORDS = [
    'ах', 'ар', 'ай', 'ой', 'ол', 'ор', 'од', 'өр', 'үр', 'үе', 'эр', 'эм', 'эх', 'их', 'юм', 'юу', 'яс', 'ус', 'үг',
    'бид', 'бүх', 'бал', 'бар', 'бол', 'бага', 'байх', 'байр', 'байна', 'баяр', 'багш', 'бэлэн', 'бүтэн',
    'бичих', 'бичиг', 'бичнэ', 'болох', 'болно', 'бодох', 'булаг', 'бөөр', 'байдал',
    'гар', 'гал', 'гэр', 'гэрэл', 'газар', 'гарах', 'гурав', 'гоё', 'гэдэг',
    'дал', 'дор', 'дуу', 'дүү', 'дээр', 'далай', 'долоо', 'дотор', 'дулаан', 'дуулах', 'дэлхий', 'дүрэм',
    'ээж', 'аав', 'эгч', 'эрдэм', 'эрт', 'эмч', 'энэ',
    'нэг', 'нар', 'ном', 'нэр', 'нүд', 'нөхөр', 'нэмэх', 'ногоон', 'нэгэн',
    'олох', 'одоо', 'орох', 'олдох', 'оюутан', 'ойр',
    'өдөр', 'өнгө', 'өндөр', 'өрөө', 'өөр',
    'сар', 'сайн', 'сайхан', 'салхи', 'сонин', 'сурах', 'сурна', 'сурагч', 'сүү',
    'тал', 'тэр', 'тоо', 'тос', 'товч', 'тоглох', 'тэнгэр', 'тэмдэг', 'түргэн', 'тэвчээр', 'туулай', 'тэгэх',
    'улс', 'улаан', 'ургах', 'усан', 'ухаан', 'учир', 'үзэх', 'үдэш', 'үнэн', 'үсэг', 'үүл',
    'хад', 'хар', 'хол', 'хор', 'хөл', 'хөх', 'хот', 'хэл', 'хүн', 'хүү', 'алх', 'хойд', 'харах',
    'хавар', 'хайр', 'халуун', 'хэлэх', 'хэрэг', 'хичээл', 'хоол', 'хувцас', 'хүүхэд', 'хүрэх', 'хоёр',
    'хөрөө', 'хөөрхөй',
    'цаг', 'цас', 'цонх', 'цагаан', 'цэвэр', 'цэцэг', 'цэнхэр',
    'чих', 'чулуу', 'шар', 'шил', 'шинэ', 'шөнө', 'шуудан',
    'жил', 'жимс', 'зам', 'зун', 'зураг', 'зурах', 'зөв', 'залуу',
    'иргэн', 'ирэх', 'идэх', 'инээх', 'мал', 'мод', 'морь', 'мөнгө', 'мөр', 'мэдэх',
    'монгол', 'манай', 'маргааш', 'кино', 'компьютер',
    'ажил', 'анги', 'арга', 'адил', 'алим', 'амар', 'ачаа', 'явах', 'ямар', 'яриа', 'ярих'
  ];

  /* ---------------- Өгүүлбэр, нэр, тэмдэг ---------------- */
  const SENTENCES = [
    'Би өдөр бүр бичиж сурна.',
    'Арван хуруугаараа алдаагүй бичнэ.',
    'Гараа үндсэн байрлалд тавина.',
    'Хурдан бичихээс зөв бичих нь чухал.',
    'Сурагч бүр өөрийн хэмнэлээр сурна.',
    'Багш шинэ дасгал өглөө.',
    'Өнөөдөр цаг сайхан байна.',
    'Хүүхдүүд хичээлдээ сайн сурч байна.',
    'Компьютерийн гар дээр арван хуруугаа тавь.',
    'Эрдэм номыг багаасаа сурвал хожим хэрэг болно.',
    'Миний нутаг өндөр сайхан уул нуруутай.',
    'Дасгалаа дуусгаад амралтаа авна.'
  ];

  const NAMES = [
    'Монгол Улс', 'Улаанбаатар', 'Хэнтий', 'Хангай', 'Орхон', 'Сэлэнгэ', 'Хөвсгөл',
    'Дархан', 'Эрдэнэт', 'Алтай', 'Говь', 'Туул', 'Онон', 'Хэрлэн',
    'Дорж', 'Сараа', 'Бат', 'Цэцэг', 'Болд', 'Наран'
  ];

  const PUNCT = [
    'Сайн байна уу? Таны нэр хэн бэ?',
    'Би Бат, тэр Сараа, энэ Дорж.',
    'Анхаар: гараа үндсэн байрлалд тавь.',
    'Хэн хурдан бичих вэ? Хэн зөв бичих вэ?',
    'Хичээл дууслаа, одоо амарцгаая.',
    'Монгол Улс - миний төрсөн нутаг.'
  ];

  const DIGITS = [
    '1 2 3 4 5 6 7 8 9 0',
    '2026 он 12 сар 31',
    '№ 15 № 24 № 7',
    '100 ₮ 500 ₮ 1000 ₮',
    '12:30 08:45 21:00',
    '2 + 2 = 4 5 + 5 = 10',
    '25% 50% 75% 100%'
  ];

  /* ---------------- Уран зохиол, сурах бичиг ---------------- */
  const texts = [
    { key: 'p1', name: 'Миний нутаг · Уулс', source: 'Д. Нацагдорж · «Миний нутаг» · Эхний хоёр мөр', text: 'Хэнтий, Хангай, Саяаны өндөр сайхан нуруунууд Хойд зүгийн чимэг болсон ой хөвч уулнууд' },
    { key: 'p2', name: 'Миний нутаг · Гол мөрөн', source: 'Д. Нацагдорж · «Миний нутаг» · Хоёрдугаар бадгийн хэсэг', text: 'Хэрлэн, Онон, Туулын тунгалаг ариун мөрнүүд Хотол олны эм болсон горхи булаг рашаанууд' },
    { key: 'p3', name: 'Миний нутаг · Төгсгөл', source: 'Д. Нацагдорж · «Миний нутаг» · Хураангуй мөр', text: 'Энэ бол миний төрсөн нутаг Монголын сайхан орон' },
    { key: 'p4', name: 'Эрдэм номын тухай', source: 'Монгол ардын зүйр цэцэн үг', text: 'Эрдмийг хичээлээр сурдаг, эрлийг сургаар олдог. Эзэн хичээвэл заяа хичээнэ.' },
    { key: 'p5', name: 'Эв нэгдлийн тухай', source: 'Монгол ардын зүйр цэцэн үг', text: 'Эвт шаазгай буга барина. Дуслыг хураавал далай, дуулсныг хураавал эрдэм.' },
    { key: 'p6', name: 'Бичгийн хэмнэл', source: 'Дасгалын текст', text: 'Арван хуруугаараа тогтмол хэмнэлээр бичвэл хурд өөрөө ирнэ. Эхлээд зөв дар, дараа нь хурдан дар.' },
    { key: 'p7', name: 'Дөрвөн цаг', source: 'Дасгалын текст', text: 'Хавар цэцэг дэлгэрч, зун өвс навч ургана. Намар ургац хурааж, өвөл цас их орно.' },
    { key: 'p8', name: 'Миний өдөр', source: 'Дасгалын текст', text: 'Өглөө эрт босч, сургуульдаа явна. Хичээлээ сайн сурч, гэртээ харина. Үдэш дасгалаа хийнэ.' },
    { key: 'p9', name: 'Монгол гар', source: 'Дасгалын текст', text: 'Монгол кирилл үсэг гучин таван үсэгтэй. Үсэг бүр гар дээр өөрийн товчтой, товч бүр өөрийн хуруутай.' }
  ];

  /* ---------------- Сургалтын замнал ---------------- */
  const stages = [
    { id: 'home', name: '1 · Үндсэн эгнээ' },
    { id: 'top', name: '2 · Дээд эгнээ' },
    { id: 'bottom', name: '3 · Доод эгнээ' },
    { id: 'extra', name: '4 · Том үсэг, тэмдэг, өгүүлбэр' }
  ];

  const curriculum = [
    { key: 'h1', stage: 'home', name: 'Ө ба Р · долоовор', keys: 'ө р', target: 50 },
    { key: 'h2', stage: 'home', name: 'Б ба О · дунд', keys: 'б о', target: 50 },
    { key: 'h3', stage: 'home', name: 'Ы ба Л · ядам', keys: 'ы л', target: 55 },
    { key: 'h4', stage: 'home', name: 'Й ба Д · чигчий', keys: 'й д', target: 55 },
    { key: 'h5', stage: 'home', name: 'А ба Х · дотоод товч', keys: 'а х', target: 60 },
    { key: 'h6', stage: 'home', name: 'П ба зай авах', keys: 'п', target: 60 },
    { key: 'h7', stage: 'home', name: 'Үндсэн эгнээний үгс', words: 14, target: 65 },

    { key: 't1', stage: 'top', name: 'Ж ба Г', keys: 'ж г', target: 60 },
    { key: 't2', stage: 'top', name: 'У ба Ш', keys: 'у ш', target: 60 },
    { key: 't3', stage: 'top', name: 'Ц ба Ү', keys: 'ц ү', target: 60 },
    { key: 't4', stage: 'top', name: 'Ф ба З', keys: 'ф з', target: 60 },
    { key: 't5', stage: 'top', name: 'Э ба Н', keys: 'э н', target: 65 },
    { key: 't6', stage: 'top', name: 'К ба Ъ', keys: 'к ъ', target: 60 },
    { key: 't7', stage: 'top', name: 'Дээд эгнээний үгс', words: 14, target: 70 },

    { key: 'b1', stage: 'bottom', name: 'С ба И', keys: 'с и', target: 65 },
    { key: 'b2', stage: 'bottom', name: 'М ба Т', keys: 'м т', target: 65 },
    { key: 'b3', stage: 'bottom', name: 'Ё ба Ь', keys: 'ё ь', target: 65 },
    { key: 'b4', stage: 'bottom', name: 'Ч ба В', keys: 'ч в', target: 65 },
    { key: 'b5', stage: 'bottom', name: 'Я ба Ю', keys: 'я ю', target: 65 },
    { key: 'b6', stage: 'bottom', name: 'Е ба Щ', keys: 'е щ', target: 65 },
    { key: 'b7', stage: 'bottom', name: 'Бүх үсгийн үгс', words: 16, target: 75 },

    { key: 'x1', stage: 'extra', name: 'Том үсэг · ⇧ товч', names: 8, target: 55 },
    { key: 'x2', stage: 'extra', name: 'Цэг, таслал, асуулт', punct: 3, target: 60 },
    { key: 'x3', stage: 'extra', name: 'Тоо ба тэмдэг', digits: 4, target: 45 },
    { key: 'x4', stage: 'extra', name: 'Бүтэн өгүүлбэр', sentences: 3, target: 70 },
    { key: 'x5', stage: 'extra', name: 'Холимог дасгал', mixed: true, target: 70 }
  ];

  /* Дасгал тус бүрт тухайн үе хүртэл сурсан үсгүүдийг тооцоолно */
  (function computeLetters() {
    let learned = [];
    curriculum.forEach(lesson => {
      lesson.review = learned.slice();
      if (lesson.keys) learned = learned.concat(lesson.keys.split(' ').filter(Boolean));
      lesson.learned = learned.slice();
      lesson.stageLetters = curriculum
        .filter(l => l.stage === lesson.stage && l.keys)
        .reduce((acc, l) => acc.concat(l.keys.split(' ').filter(Boolean)), []);
    });
  })();

  const maxStars = curriculum.length * 3;

  /* ---------------- Хуруу тус бүрийн дасгал ---------------- */
  /* Хуруу бүрт 2-3 үсэг. Чигчий хуруу хэт ачаалагдахгүй байхаар хуваасан. */
  const fingerDrills = [
    { key: 'f-lp', finger: 'LP', codes: 'KeyQ KeyA KeyZ' },
    { key: 'f-lr', finger: 'LR', codes: 'KeyW KeyS KeyX' },
    { key: 'f-lm', finger: 'LM', codes: 'KeyE KeyD KeyC' },
    { key: 'f-li1', finger: 'LI', codes: 'KeyR KeyF KeyV' },
    { key: 'f-li2', finger: 'LI', codes: 'KeyT KeyG KeyB' },
    { key: 'f-ri1', finger: 'RI', codes: 'KeyU KeyJ KeyM' },
    { key: 'f-ri2', finger: 'RI', codes: 'KeyY KeyH KeyN' },
    { key: 'f-rm', finger: 'RM', codes: 'KeyI KeyK Comma' },
    { key: 'f-rr', finger: 'RR', codes: 'KeyO KeyL Period' },
    { key: 'f-rp1', finger: 'RP', codes: 'KeyP BracketLeft BracketRight' },
    { key: 'f-rp2', finger: 'RP', codes: 'Semicolon Quote' },
    { key: 'f-rp3', finger: 'RP', codes: 'Minus Equal Slash' }
  ];

  fingerDrills.forEach(drill => {
    drill.letters = L.lettersOf(drill.codes);
    drill.name = (drill.finger.charAt(0) === 'L' ? 'Зүүн ' : 'Баруун ') +
      L.fingerMap[drill.finger].short.toLowerCase() + ' · ' + drill.letters.join(' ').toUpperCase();
    drill.source = L.fingerMap[drill.finger].name;
  });

  fingerDrills.push({
    key: 'f-thumb', finger: 'LT', letters: [],
    name: 'Эрхий · зай авах',
    source: 'Зайг аль нэг эрхий хуруугаар дарна',
    fixed: 'а о ө ү э и о а ү ө э и а о ө ү'
  });

  /* ---------------- Текст үүсгэгч ---------------- */
  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function take(list, n) { return shuffle(list).slice(0, Math.max(0, n)); }
  function randomGroups(pool, count, size) {
    return Array.from({ length: count }, () =>
      Array.from({ length: size }, () => pick(pool)).join('')).join(' ');
  }

  function keyBlocks(lesson) {
    const keys = lesson.keys.split(' ').filter(Boolean);
    const blocks = [keys.map(c => c.repeat(3)).join(' ')];
    if (keys.length > 1) {
      const pairs = [];
      keys.forEach(a => keys.forEach(b => { if (a !== b) pairs.push(a + b); }));
      blocks.push(shuffle(pairs.concat(pairs)).join(' '));
    } else {
      blocks.push(keys[0] + ' ' + keys[0].repeat(2) + ' ' + keys[0] + ' ' + keys[0].repeat(3));
    }
    blocks.push(randomGroups(keys, 6, 3));
    const review = (lesson.review || []).slice(-6);
    blocks.push(randomGroups(review.length ? review.concat(keys, keys) : keys, 6, 3));
    return blocks.join(' ');
  }

  function wordsFor(lesson, count) {
    const allowed = new Set(lesson.learned || L.alphabet.split(''));
    const eligible = WORDS.filter(word => Array.from(word).every(ch => allowed.has(ch)));
    const focus = lesson.stageLetters || [];
    const fresh = eligible.filter(word => Array.from(word).some(ch => focus.includes(ch)));
    const chosen = take(fresh, Math.min(fresh.length, Math.ceil(count * 0.6)));
    const rest = take(eligible.filter(word => chosen.indexOf(word) === -1), count - chosen.length);
    return shuffle(chosen.concat(rest)).join(' ');
  }

  function eligibleWordCount(lesson) {
    const allowed = new Set(lesson.learned || L.alphabet.split(''));
    return WORDS.filter(word => Array.from(word).every(ch => allowed.has(ch))).length;
  }

  function buildText(lesson) {
    if (lesson.fixed) return lesson.fixed;
    if (lesson.text) return lesson.text;
    if (lesson.keys) return keyBlocks(lesson);
    if (lesson.words) return wordsFor(lesson, lesson.words);
    if (lesson.names) return take(NAMES, lesson.names).join(' ');
    if (lesson.punct) return take(PUNCT, lesson.punct).join(' ');
    if (lesson.digits) return take(DIGITS, lesson.digits).join(' ');
    if (lesson.sentences) return take(SENTENCES, lesson.sentences).join(' ');
    if (lesson.mixed) return [pick(SENTENCES), pick(DIGITS), pick(PUNCT)].join(' ');
    if (lesson.letters && lesson.letters.length) {
      const letters = lesson.letters;
      return [
        letters.map(c => c.repeat(3)).join(' '),
        randomGroups(letters, 8, 3),
        take(WORDS.filter(w => Array.from(w).some(ch => letters.indexOf(ch) !== -1)), 8).join(' ')
      ].filter(Boolean).join(' ');
    }
    return '';
  }

  /* Хүүхдийн хамгийн их алдсан үсгүүдээр дасгал зохионо */
  function weakDrill(mistakes) {
    let chars = Object.keys(mistakes || {})
      .filter(ch => ch !== ' ' && L.reverseMap[ch])
      .sort((a, b) => mistakes[b] - mistakes[a])
      .slice(0, 6);
    if (!chars.length) return null;

    /* Нэг-хоёрхон үсэг байвал нэг хурууны хөрш үсгүүдийг нэмж өгнө */
    if (chars.length < 3) {
      const neighbours = [];
      chars.forEach(ch => {
        const finger = L.fingerOfChar(ch);
        if (!finger) return;
        L.lettersOf(L.fingerMap[finger].codes).forEach(letter => {
          if (chars.indexOf(letter) === -1 && neighbours.indexOf(letter) === -1) neighbours.push(letter);
        });
      });
      chars = chars.concat(take(neighbours, 4 - chars.length));
    }

    const lower = chars.map(ch => ch.toLowerCase());
    const blocks = [
      chars.map(ch => ch.repeat(3)).join(' '),
      randomGroups(chars, 8, 3)
    ];
    const words = WORDS.filter(word => Array.from(word).some(ch => lower.indexOf(ch) !== -1));
    if (words.length) blocks.push(take(words, 10).join(' '));
    return {
      key: 'weak',
      name: 'Миний алдаатай үсгүүд',
      source: 'Алдааны түүхээс автоматаар зохиосон дасгал',
      text: blocks.join(' ')
    };
  }

  return {
    WORDS, SENTENCES, NAMES, PUNCT, DIGITS,
    stages, curriculum, fingerDrills, texts, maxStars,
    buildText, weakDrill, eligibleWordCount
  };
})();
