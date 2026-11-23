'use strict';
/* Хуруу — дасгалын логик.
   Ахицын өгөгдөл одоогоор зөвхөн localStorage дээр. Сессийн бичлэг
   нь өгөгдлийн сангийн мөртэй ижил бүтэцтэй (дараагийн шатанд sync хийнэ). */
(function () {

  const L = window.KH_LAYOUT;
  const C = window.KH_LESSONS;
  const keyMap = L.keyMap, fingerMap = L.fingerMap, codeFinger = L.codeFinger, reverseMap = L.reverseMap;
  const $ = id => document.getElementById(id);

  /* ======================= Хадгалалт ======================= */

  const STORE_KEY = 'khuuruu.mn.v2';
  const LEGACY_KEY = 'khuuruu.mn.v1';
  const MAX_HISTORY = 200;

  let storageAvailable = true;

  function defaults() {
    return {
      version: 2,
      bestCpm: 0,
      bestAccuracy: 0,
      sessions: 0,
      mistakes: {},
      lessons: {},
      history: [],
      streak: { count: 0, last: null },
      sound: false,
      light: false,
      unlockAll: false
    };
  }

  let saved = defaults();

  const positive = v => (Number.isFinite(v) && v >= 0 ? v : 0);

  /* Гаднаас ирсэн өгөгдлийг шалгаж байж хүлээн авна (хадгалсан файл ч мөн адил) */
  function applyData(v, legacy) {
    if (!v || typeof v !== 'object') return false;
    const next = defaults();

    /* v1 дээр дээд амжилт нь үг/мин байсан */
    next.bestCpm = legacy ? Math.round(positive(v.best) * 5) : positive(v.bestCpm);
    next.bestAccuracy = positive(v.bestAccuracy);
    next.sessions = positive(v.sessions);

    Object.keys(v.mistakes || {}).forEach(ch => {
      const n = v.mistakes[ch];
      if (reverseMap[ch] && Number.isFinite(n) && n > 0) next.mistakes[ch] = n;
    });

    if (Array.isArray(v.history)) {
      next.history = v.history.filter(entry => entry && typeof entry === 'object').slice(-MAX_HISTORY);
    }

    const known = {};
    C.curriculum.forEach(lesson => { known[lesson.key] = true; });
    Object.keys(v.lessons || {}).forEach(key => {
      const p = v.lessons[key];
      if (!known[key] || !p || typeof p !== 'object') return;
      next.lessons[key] = {
        stars: Math.min(3, positive(p.stars)),
        bestCpm: positive(p.bestCpm),
        bestAccuracy: positive(p.bestAccuracy),
        passes: positive(p.passes),
        last: typeof p.last === 'string' ? p.last : null
      };
    });

    if (v.streak && typeof v.streak === 'object') {
      next.streak = {
        count: positive(v.streak.count),
        last: typeof v.streak.last === 'string' ? v.streak.last : null
      };
    }

    next.sound = v.sound === true;
    next.light = v.light === true;
    next.unlockAll = v.unlockAll === true;

    saved = next;
    return true;
  }

  function loadSaved() {
    let raw = null, legacy = false;
    try {
      raw = localStorage.getItem(STORE_KEY);
      if (!raw) { raw = localStorage.getItem(LEGACY_KEY); legacy = !!raw; }
    } catch (err) { storageAvailable = false; return; }
    if (!raw) return;
    let v;
    try { v = JSON.parse(raw); } catch (err) { return; }
    applyData(v, legacy);
  }

  let persistTimer = null;

  function writeNow() {
    if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
    try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); }
    catch (err) { storageAvailable = false; }
  }
  /* Бичиж байх үед дэлгэц дахин зурахгүй — зөвхөн дараалалд тавина */
  function persistLater() {
    if (!persistTimer) persistTimer = setTimeout(() => { persistTimer = null; writeNow(); }, 800);
  }
  function persist() { writeNow(); renderProgress(); renderHistory(); }

  window.addEventListener('pagehide', writeNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') writeNow();
    else if (started !== null && !finished) tick();
  });

  /* ======================= Гар ба хуруу ======================= */

  const keyEls = {}, fingerEls = {}, feedbackTimers = new WeakMap();
  let cued = [];

  L.rows.forEach((row, rowIndex) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'row';
    if (rowIndex === 4) rowEl.style.margin = '6px 24%';
    row.forEach(code => {
      const key = document.createElement('div');
      key.className = 'key' + (L.specialLabels[code] ? ' wide' : '') + (code === 'Space' ? ' space' : '');
      key.dataset.code = code;
      if (codeFinger[code]) key.style.setProperty('--finger', fingerMap[codeFinger[code]].color);
      const pair = keyMap[code];
      key.append(document.createTextNode(L.specialLabels[code] || pair[0].toUpperCase()));
      if (pair && pair[0] !== pair[1] && !L.alphabet.includes(pair[0])) {
        const small = document.createElement('small');
        small.textContent = pair[1];
        key.append(small);
      }
      if (L.restKeys.indexOf(code) !== -1) key.classList.add('rest');
      keyEls[code] = key;
      rowEl.append(key);
    });
    $('keyboard').append(rowEl);
  });

  Object.keys(fingerMap).forEach(id => {
    const f = fingerMap[id];
    const wrap = document.createElement('div');
    wrap.className = 'finger' + (id.charAt(1) === 'T' ? ' thumb' : '');
    wrap.style.setProperty('--finger', f.color);
    wrap.title = f.name;
    const icon = document.createElement('div');
    icon.className = 'finger-icon';
    icon.setAttribute('aria-label', f.name);
    wrap.append(icon, document.createTextNode(f.short));
    fingerEls[id] = icon;
    $(id.charAt(0) === 'L' ? 'leftHand' : 'rightHand').append(wrap);
  });

  /* ======================= Сессийн төлөв ======================= */

  let mode = 'course';
  let list = [], index = 0, current = null;
  let text = '', cursor = 0, painted = -1, expected = null;
  let attempts = 0, correctHits = 0, firstAttempts = 0, firstCorrect = 0;
  let touched = [], mistakes = {}, charMs = {}, lastStroke = null;
  let started = null, elapsed = 0, finished = false, timer = null, audioContext = null;

  const displayChar = ch => (ch === ' ' ? 'Зай' : ch);
  const starsOf = lesson => (lesson && saved.lessons[lesson.key] ? saved.lessons[lesson.key].stars : 0);
  const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

  function isUnlocked(i) {
    if (mode !== 'course') return true;
    if (i === 0 || saved.unlockAll) return true;
    return starsOf(C.curriculum[i - 1]) > 0;
  }

  function listFor(name) {
    if (name === 'course') return C.curriculum;
    if (name === 'fingers') {
      const weak = C.weakDrill(saved.mistakes);
      return (weak ? [weak] : []).concat(C.fingerDrills);
    }
    return C.texts;
  }

  function pickIndex(keepKey) {
    if (keepKey) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].key === keepKey && isUnlocked(i)) return i;
      }
    }
    if (mode !== 'course') return 0;
    for (let i = 0; i < list.length; i++) {
      if (isUnlocked(i) && starsOf(list[i]) === 0) return i;
    }
    let last = 0;
    list.forEach((lesson, i) => { if (isUnlocked(i)) last = i; });
    return last;
  }

  function fillLessons(keepKey) {
    list = listFor(mode);
    const select = $('lesson');
    select.replaceChildren();

    if (mode === 'course') {
      C.stages.forEach(stage => {
        const group = document.createElement('optgroup');
        group.label = stage.name;
        list.forEach((lesson, i) => {
          if (lesson.stage !== stage.id) return;
          const option = document.createElement('option');
          option.value = String(i);
          group.append(option);
        });
        select.append(group);
      });
    } else {
      list.forEach((item, i) => {
        const option = document.createElement('option');
        option.value = String(i);
        option.textContent = item.name;
        select.append(option);
      });
    }

    refreshLabels();
    index = pickIndex(keepKey);
    select.value = String(index);
    $('durationLabel').hidden = mode !== 'timed';
    reset();
  }

  /* Од, түгжээний тэмдэглэгээг шинэчилнэ (дасгалыг дахин эхлүүлэхгүйгээр) */
  function refreshLabels() {
    if (mode !== 'course') return;
    Array.prototype.forEach.call($('lesson').querySelectorAll('option'), option => {
      const i = Number(option.value);
      const lesson = C.curriculum[i];
      if (!lesson) return;
      const unlocked = isUnlocked(i);
      option.textContent = (unlocked ? starText(starsOf(lesson)) : '🔒') + ' ' + lesson.name;
      option.disabled = !unlocked;
    });
    if (current && current.key) {
      $('title').textContent = current.name + ' · ' + starText(starsOf(current));
    }
  }

  function setMode(name, keepKey) {
    mode = name;
    Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), button => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === name));
    });
    fillLessons(keepKey);
  }

  /* ======================= Текст ======================= */

  function charSpans(str) {
    const frag = document.createDocumentFragment();
    for (const ch of str) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      frag.append(span);
    }
    return frag;
  }

  function renderText() {
    $('passage').replaceChildren(charSpans(text));
    painted = -1;
    updateTarget();
  }

  /* Урт сорилд нэг текст давтагдахгүйн тулд өөр текст залгана */
  function nextTimedText() {
    const others = C.texts.filter(item => !current || item.key !== current.key);
    const pool = others.length ? others : C.texts;
    return pool[Math.floor(Math.random() * pool.length)].text;
  }

  /* Хугацаатай сорилд текст урсгалаар нэмэгдэнэ — зөвхөн шинэ тэмдэгтийг зурна */
  function appendText(extra) {
    text += extra;
    $('passage').append(charSpans(extra));
  }

  function paint(i, cls) {
    const el = $('passage').children[i];
    if (el) el.className = 'char' + (cls ? ' ' + cls : '');
  }

  function clearCues() {
    cued.forEach(el => el.classList.remove('next'));
    cued = [];
  }

  function addCue(el) {
    if (!el) return;
    el.classList.add('next');
    cued.push(el);
  }

  function updateTarget() {
    if (painted >= 0 && painted !== cursor) paint(painted, painted < cursor ? 'done' : '');
    paint(cursor, 'current');
    painted = cursor;

    $('position').textContent = cursor + ' / ' + text.length;
    $('progress').value = text.length ? cursor / text.length : 0;
    const el = $('passage').children[cursor];
    if (el) $('passage').scrollTop = Math.max(0, el.offsetTop - $('passage').offsetTop - 40);

    clearCues();
    expected = reverseMap[text[cursor]];
    if (!expected) { $('guide').textContent = ''; $('shiftGuide').textContent = ''; return; }

    const finger = codeFinger[expected.code];
    addCue(keyEls[expected.code]);
    const fingers = expected.code === 'Space' ? ['LT', 'RT'] : [finger];
    fingers.forEach(id => {
      fingerEls[id].dataset.cue = expected.code === 'Space' ? '␣' : text[cursor].toUpperCase();
      addCue(fingerEls[id]);
    });

    $('guide').textContent = expected.code === 'Space'
      ? 'Аль нэг эрхий хуруу ➔ [Зай]'
      : fingerMap[finger].name + ' ➔ [' + text[cursor] + ']';

    if (expected.shift) {
      const opposite = finger.charAt(0) === 'L' ? 'RP' : 'LP';
      addCue(keyEls[opposite === 'LP' ? 'ShiftLeft' : 'ShiftRight']);
      fingerEls[opposite].dataset.cue = '⇧';
      addCue(fingerEls[opposite]);
      $('shiftGuide').textContent = fingerMap[opposite].name + 'гаар ⇧ товчийг хамт дарна.';
    } else {
      $('shiftGuide').textContent = 'Гараа үндсэн байрлалд байлгаарай.';
    }
  }

  function stopTimer() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function reset() {
    stopTimer();
    started = null; elapsed = 0; finished = false;
    cursor = 0; painted = -1;
    attempts = 0; correctHits = 0; firstAttempts = 0; firstCorrect = 0;
    touched = []; mistakes = {}; charMs = {}; lastStroke = null;

    current = list[index] || list[0] || null;
    /* Алдааны дасгалыг хамгийн сүүлийн алдааны түүхээр шинэчилнэ */
    if (current && current.key === 'weak') {
      const refreshed = C.weakDrill(saved.mistakes);
      if (refreshed) { current = refreshed; list[index] = refreshed; }
    }
    text = current ? C.buildText(current) : '';

    $('title').textContent = current
      ? current.name + (mode === 'course' ? ' · ' + starText(starsOf(current)) : '')
      : '';
    $('source').textContent = current
      ? (current.source || (current.target ? 'Хүрэх хурд ' + current.target + ' тэмдэгт/мин · 90% нарийвчлалтай бичвэл дараагийнх онгойно' : ''))
      : '';
    $('instruction').textContent = 'Энд дарж, гэрэлтсэн үсгээс эхлээрэй.';
    $('start').hidden = false;
    $('clockLabel').textContent = mode === 'timed' ? 'Үлдсэн хугацаа' : 'Өнгөрсөн хугацаа';

    renderText();
    updateStats();
  }

  /* ======================= Хэмжүүр ======================= */

  const getElapsed = () => (started === null ? 0 : (performance.now() - started) / 1000);
  const getCpm = () => (elapsed > 0 ? Math.round(cursor / (elapsed / 60)) : 0);
  const getWpm = () => Math.round(getCpm() / 5);
  /* Нарийвчлал = эхний удаад зөв дарсан тэмдэгт. Буцаах товчоор "засах" боломжгүй. */
  const getAccuracy = () => (firstAttempts ? Math.round(firstCorrect / firstAttempts * 1000) / 10 : 100);
  const getRawAccuracy = () => (attempts ? Math.round(correctHits / attempts * 1000) / 10 : 100);

  /* 60 секундээс дээш бол минут:секунд */
  function formatClock(seconds) {
    if (seconds >= 60) {
      return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
    }
    return seconds.toFixed(1);
  }

  function updateStats() {
    $('cpm').textContent = getCpm();
    $('accuracy').textContent = getAccuracy() + '%';
    $('clock').textContent = formatClock(mode === 'timed'
      ? Math.max(0, Number($('duration').value) - elapsed)
      : elapsed);
  }

  function tick() {
    if (finished) return;
    elapsed = getElapsed();
    if (mode === 'timed' && elapsed >= Number($('duration').value)) {
      elapsed = Number($('duration').value);
      finish();
    } else {
      updateStats();
    }
  }

  /* ======================= Хариу үйлдэл ======================= */

  function flash(el, ok) {
    if (!el) return;
    clearTimeout(feedbackTimers.get(el));
    el.classList.remove('good', 'bad');
    el.classList.add(ok ? 'good' : 'bad');
    feedbackTimers.set(el, setTimeout(() => el.classList.remove('good', 'bad'), 180));
  }

  function playSound(ok) {
    if (!saved.sound) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = ok ? 660 : 170;
      gain.gain.setValueAtTime(.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .07);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + .075);
    } catch (err) { /* дуу боломжгүй бол чимээгүй үргэлжилнэ */ }
  }

  function focusPractice() {
    $('practice').focus({ preventScroll: true });
    $('instruction').textContent = 'Бэлэн. Дараагийн үсгийг гар дээрээ дараарай.';
    $('start').hidden = true;
  }

  $('practice').addEventListener('keydown', e => {
    if (e.target !== $('practice') || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (!keyMap[e.code] && ['Backspace', 'ShiftLeft', 'ShiftRight', 'CapsLock'].indexOf(e.code) === -1) return;
    e.preventDefault();
    if (e.repeat || finished) return;
    if (started !== null) { tick(); if (finished) return; }
    if (keyEls[e.code]) keyEls[e.code].classList.add('pressed');
    if (e.code.indexOf('Shift') === 0 || e.code === 'CapsLock') return;

    if (e.code === 'Backspace') {
      if (cursor > 0) { cursor--; updateTarget(); updateStats(); }
      return;
    }

    if (started === null) {
      started = performance.now();
      timer = setInterval(tick, 100);
      $('instruction').textContent = 'Алдсан үсгээ зөв дараад үргэлжлүүлээрэй.';
      $('start').hidden = true;
    }

    const char = keyMap[e.code][Number(e.shiftKey)];
    const target = text[cursor];
    const ok = char === target;

    attempts++;
    if (!touched[cursor]) {
      touched[cursor] = true;
      firstAttempts++;
      if (ok) firstCorrect++;
    }

    const now = performance.now();
    if (ok && lastStroke !== null) {
      const delta = now - lastStroke;
      if (delta < 4000) {
        const stat = charMs[target] || (charMs[target] = { sum: 0, n: 0 });
        stat.sum += delta;
        stat.n++;
      }
    }
    lastStroke = now;

    const finger = codeFinger[e.code];
    flash(keyEls[e.code], ok);
    flash(fingerEls[finger], ok);
    if (e.code === 'Space') flash(fingerEls.LT, ok);
    ['ShiftLeft', 'ShiftRight'].forEach(code => {
      if (keyEls[code].classList.contains('pressed')) {
        flash(keyEls[code], ok);
        flash(fingerEls[codeFinger[code]], ok);
      }
    });
    playSound(ok);

    if (ok) {
      correctHits++;
      cursor++;
      if (cursor === text.length && mode === 'timed') appendText(' ' + nextTimedText());
      updateTarget();
    } else {
      mistakes[target] = (mistakes[target] || 0) + 1;
      saved.mistakes[target] = (saved.mistakes[target] || 0) + 1;
      persistLater();
      const el = $('passage').children[cursor];
      if (el) el.classList.add('wrong');
    }

    elapsed = getElapsed();
    updateStats();
    if (cursor === text.length) finish();
  });

  window.addEventListener('keyup', e => {
    if (keyEls[e.code]) keyEls[e.code].classList.remove('pressed');
  });
  window.addEventListener('blur', () => {
    Array.prototype.forEach.call(document.querySelectorAll('.pressed'), el => el.classList.remove('pressed'));
  });

  /* ======================= Дүн ======================= */

  function starsFor(lesson, accuracy, cpm) {
    if (!lesson || !lesson.target) return 0;
    if (accuracy < 90) return 0;
    if (accuracy >= 98 && cpm >= lesson.target * 1.25) return 3;
    if (accuracy >= 95 && cpm >= lesson.target) return 2;
    return 1;
  }

  const pad = n => String(n).padStart(2, '0');
  const dayKey = date => date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  const timeOf = date => pad(date.getHours()) + ':' + pad(date.getMinutes());
  const shortDate = date => date.getFullYear() + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getDate());
  const longDate = date => date.getFullYear() + ' оны ' + (date.getMonth() + 1) + ' сарын ' +
    date.getDate() + ', ' + timeOf(date);

  function bumpStreak() {
    const today = dayKey(new Date());
    if (saved.streak.last === today) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    saved.streak = {
      count: saved.streak.last === dayKey(y) ? saved.streak.count + 1 : 1,
      last: today
    };
  }

  function newId() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (err) { /* fallback */ }
    return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* Өгөгдлийн сангийн sessions мөртэй ижил бүтэц */
  function sessionRecord(cpm, wpm, accuracy, rawAccuracy, stars) {
    const avgMs = {};
    Object.keys(charMs).forEach(ch => { avgMs[ch] = Math.round(charMs[ch].sum / charMs[ch].n); });
    return {
      id: newId(),
      at: new Date().toISOString(),
      mode: mode,
      lessonKey: current ? current.key : null,
      lessonName: current ? current.name : '',
      cpm: cpm,
      wpm: wpm,
      accuracy: accuracy,
      rawAccuracy: rawAccuracy,
      chars: cursor,
      attempts: attempts,
      errors: attempts - correctHits,
      seconds: Math.round(elapsed * 10) / 10,
      stars: stars,
      mistakes: Object.assign({}, mistakes),
      charMs: avgMs,
      synced: false
    };
  }

  function finish() {
    if (finished) return;
    finished = true;
    stopTimer();
    updateStats();

    const cpm = getCpm(), wpm = getWpm();
    const accuracy = getAccuracy(), rawAccuracy = getRawAccuracy();
    const lesson = mode === 'course' ? current : null;
    const stars = starsFor(lesson, accuracy, cpm);
    const newRecord = cpm > saved.bestCpm;

    saved.bestCpm = Math.max(saved.bestCpm, cpm);
    saved.bestAccuracy = Math.max(saved.bestAccuracy, accuracy);
    saved.sessions++;

    if (lesson) {
      const prev = saved.lessons[lesson.key] || { stars: 0, bestCpm: 0, bestAccuracy: 0, passes: 0 };
      saved.lessons[lesson.key] = {
        stars: Math.max(prev.stars, stars),
        bestCpm: Math.max(prev.bestCpm, cpm),
        bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
        passes: prev.passes + (stars > 0 ? 1 : 0),
        last: new Date().toISOString()
      };
    }

    bumpStreak();
    saved.history.push(sessionRecord(cpm, wpm, accuracy, rawAccuracy, stars));
    saved.history = saved.history.slice(-MAX_HISTORY);
    persist();
    refreshLabels();
    showResult(cpm, wpm, accuracy, stars, newRecord);
  }

  function showResult(cpm, wpm, accuracy, stars, newRecord) {
    const course = mode === 'course';
    $('resultStars').textContent = course ? starText(stars) : '';
    $('resultStars').hidden = !course;
    $('resultCpm').textContent = cpm;
    $('resultAccuracy').textContent = accuracy + '%';
    $('resultTime').textContent = formatClock(elapsed);
    $('resultDate').textContent = longDate(new Date()) + ' · үр дүн хадгалагдлаа';

    const worst = Object.keys(mistakes).sort((a, b) => mistakes[b] - mistakes[a])[0];
    const advice = [];
    if (worst) {
      const fingerId = L.fingerOfChar(worst);
      advice.push((fingerId ? fingerMap[fingerId].name + 'гаар дардаг ' : '') +
        '[' + displayChar(worst) + '] тэмдэгт дээр хамгийн их алдлаа (' + mistakes[worst] +
        ' удаа). Энэ товчийг удаан, зөв дарж давтаарай.');
    } else {
      advice.push('Алдаагүй бичлээ! Зөв хэмнэлээ хадгалж, дараагийн дасгалаа хийгээрэй.');
    }
    if (course && current) {
      if (stars === 0) advice.push('Дараагийн дасгал онгойхын тулд 90%-иас дээш нарийвчлал хэрэгтэй.');
      else if (stars < 3) advice.push('Хүрэх хурд ' + current.target + ' тэмдэгт/мин. Та ' + cpm + ' хийлээ.');
    }
    $('advice').textContent = advice.join(' ');

    $('record').textContent = newRecord
      ? 'Шинэ дээд амжилт тогтоолоо!'
      : 'Үг/мин ' + wpm + ' · Дараалан ' + saved.streak.count + ' өдөр дасгал хийлээ.';

    const i = current ? C.curriculum.findIndex(lesson => lesson.key === current.key) : -1;
    const hasNext = course && i >= 0 && i + 1 < C.curriculum.length &&
      (saved.unlockAll || starsOf(C.curriculum[i]) > 0);
    $('nextLesson').hidden = !hasNext;
    $('again').className = hasNext ? '' : 'primary';

    $('instruction').textContent = 'Дасгал дууслаа. Дахин эхэлж болно.';
    $('result').showModal();
  }

  /* ======================= Ахицын хэсэг ======================= */

  function renderProgress() {
    $('best').textContent = saved.bestCpm;
    $('bestAccuracy').textContent = saved.bestAccuracy + '%';

    let done = 0, stars = 0;
    C.curriculum.forEach(lesson => {
      const s = starsOf(lesson);
      if (s > 0) done++;
      stars += s;
    });
    $('lessonsDone').textContent = done + ' / ' + C.curriculum.length;
    $('starCount').textContent = stars + ' / ' + C.maxStars;
    $('streak').textContent = saved.streak.count ? saved.streak.count + ' өдөр' : '0';
    $('savedStats').textContent = saved.sessions + ' дасгал дуусгасан.';
    $('storageStatus').textContent = storageAvailable
      ? 'Ахиц зөвхөн энэ хөтөч дээр хадгалагдана.'
      : 'Хадгалах боломжгүй байна. Энэ удаагийн дасгал хэвийн ажиллана.';
    renderWeakness();
  }

  function renderWeakness() {
    const box = $('weakness');
    box.replaceChildren();
    const top = Object.keys(saved.mistakes)
      .sort((a, b) => saved.mistakes[b] - saved.mistakes[a])
      .slice(0, 6);
    if (!top.length) {
      box.textContent = 'Алдааны түүх хараахан алга.';
      $('weakDrill').disabled = true;
      return;
    }
    $('weakDrill').disabled = false;
    top.forEach(ch => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = displayChar(ch) + ' · ' + saved.mistakes[ch];
      const fingerId = L.fingerOfChar(ch);
      if (fingerId) chip.title = fingerMap[fingerId].name;
      box.append(chip);
    });
  }

  /* ======================= Дасгалын түүх ======================= */

  const MODE_LABELS = {
    course: 'Замнал',
    fingers: 'Хуруу',
    literature: 'Уран зохиол',
    timed: 'Хугацаатай'
  };

  let historyExpanded = false;

  /* Хуучин (v1) бичлэгүүдийг ч уншиж чадна */
  function normalizeEntry(entry) {
    const at = typeof entry.at === 'string' ? entry.at
      : (typeof entry.date === 'string' ? entry.date : null);
    const cpm = Number.isFinite(entry.cpm) ? entry.cpm
      : (Number.isFinite(entry.wpm) ? entry.wpm * 5 : 0);
    const date = at ? new Date(at) : null;
    return {
      at: at,
      date: date && !isNaN(date.getTime()) ? date : null,
      mode: entry.mode || '',
      lessonName: entry.lessonName || entry.lesson || '—',
      cpm: Math.round(cpm),
      wpm: Number.isFinite(entry.wpm) ? entry.wpm : Math.round(cpm / 5),
      accuracy: Number.isFinite(entry.accuracy) ? entry.accuracy : 0,
      rawAccuracy: Number.isFinite(entry.rawAccuracy) ? entry.rawAccuracy
        : (Number.isFinite(entry.accuracy) ? entry.accuracy : 0),
      chars: positive(entry.chars),
      attempts: positive(entry.attempts),
      errors: positive(entry.errors),
      seconds: Number.isFinite(entry.seconds) ? entry.seconds : 0,
      stars: Math.min(3, positive(entry.stars))
    };
  }

  /* Шинэ нь эхэндээ. Нөөцөөс сэргээсэн бичлэг дарааллаа алдаж болох тул огноогоор эрэмбэлнэ. */
  function historyEntries() {
    return saved.history.map(normalizeEntry)
      .filter(entry => entry.date)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  function cell(row, value, className) {
    const td = document.createElement('td');
    if (className) td.className = className;
    td.textContent = value;
    row.append(td);
    return td;
  }

  function renderHistory() {
    const body = $('historyBody');
    body.replaceChildren();
    const all = historyEntries();

    if (!all.length) {
      const row = document.createElement('tr');
      const td = cell(row, 'Дасгал дуусгамагц үр дүн огноотойгоо энд хадгалагдана.', 'empty');
      td.colSpan = 7;
      body.append(row);
      $('historySummary').textContent = 'Хадгалсан үр дүн алга.';
      $('showAllHistory').hidden = true;
      $('exportCsv').disabled = true;
      $('clearHistory').disabled = true;
      return;
    }

    const shown = historyExpanded ? all : all.slice(0, 25);
    let lastDay = null;
    shown.forEach(entry => {
      const row = document.createElement('tr');
      const day = dayKey(entry.date);

      const dateCell = document.createElement('td');
      dateCell.title = longDate(entry.date);
      if (day !== lastDay) {
        const mark = document.createElement('span');
        mark.className = 'day-mark';
        mark.textContent = shortDate(entry.date);
        dateCell.append(mark);
        lastDay = day;
      }
      dateCell.append(document.createTextNode(timeOf(entry.date)));
      row.append(dateCell);

      cell(row, entry.lessonName, 'name');
      cell(row, MODE_LABELS[entry.mode] || entry.mode || '—');
      cell(row, entry.cpm, 'num');
      cell(row, entry.accuracy + '%', 'num');
      cell(row, formatClock(entry.seconds), 'num');
      cell(row, entry.stars ? '★'.repeat(entry.stars) : '—', 'num stars');
      body.append(row);
    });

    const today = dayKey(new Date());
    const todayCount = all.filter(entry => dayKey(entry.date) === today).length;
    const weekStart = Date.now() - 7 * 24 * 3600 * 1000;
    const week = all.filter(entry => entry.date.getTime() >= weekStart);
    const weekAverage = week.length
      ? Math.round(week.reduce((sum, entry) => sum + entry.cpm, 0) / week.length)
      : 0;
    const minutes = Math.round(all.reduce((sum, entry) => sum + entry.seconds, 0) / 60);

    $('historySummary').textContent = 'Нийт ' + all.length + ' үр дүн · Өнөөдөр ' + todayCount +
      ' · Сүүлийн 7 хоногийн дундаж ' + weekAverage + ' тэмдэгт/мин · Нийт ' + minutes + ' минут дасгал';
    $('showAllHistory').hidden = historyExpanded || all.length <= 25;
    $('showAllHistory').textContent = 'Бүгдийг харах (' + all.length + ')';
    $('exportCsv').disabled = false;
    $('clearHistory').disabled = false;
  }

  /* ======================= Татах, нөөцлөх ======================= */

  function downloadFile(name, content, type) {
    try {
      const blob = new Blob([content], { type: type + ';charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      window.alert('Файл татаж чадсангүй.');
    }
  }

  function exportCsv() {
    const rows = [['Огноо', 'Цаг', 'Горим', 'Дасгал', 'Тэмдэгт/мин', 'Үг/мин',
      'Нарийвчлал', 'Түүхий нарийвчлал', 'Тэмдэгт', 'Алдаа', 'Секунд', 'Од']];
    historyEntries().reverse().forEach(entry => {
      rows.push([
        dayKey(entry.date), timeOf(entry.date),
        MODE_LABELS[entry.mode] || entry.mode,
        entry.lessonName, entry.cpm, entry.wpm, entry.accuracy, entry.rawAccuracy,
        entry.chars, entry.errors, entry.seconds, entry.stars
      ]);
    });
    const csv = rows.map(row => row.map(value => {
      const text = String(value);
      return /[;"\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }).join(';')).join('\r\n');
    /* BOM ба sep=; — Excel кирилл үсгийг зөв нээхийн тулд */
    downloadFile('khuuruu-ur-dun-' + dayKey(new Date()) + '.csv', '﻿sep=;\r\n' + csv, 'text/csv');
  }

  function backup() {
    downloadFile('khuuruu-noots-' + dayKey(new Date()) + '.json', JSON.stringify(saved, null, 2), 'application/json');
  }

  function restoreFrom(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(String(reader.result)); }
      catch (err) { window.alert('Энэ файлыг уншиж чадсангүй.'); return; }
      const sessions = data && Array.isArray(data.history) ? data.history.length : 0;
      if (!window.confirm('Одоогийн ахиц нөөц өгөгдлөөр солигдоно (' + sessions + ' үр дүн). Үргэлжлүүлэх үү?')) return;
      if (!applyData(data, false)) { window.alert('Файлын агуулга тохирохгүй байна.'); return; }
      applyPreferences();
      persist();
      setMode(mode);
    };
    reader.onerror = () => window.alert('Файлыг уншиж чадсангүй.');
    reader.readAsText(file);
  }

  /* ======================= Үйл явдлууд ======================= */

  $('exportCsv').addEventListener('click', exportCsv);
  $('backup').addEventListener('click', backup);
  $('restore').addEventListener('click', () => $('restoreFile').click());
  $('restoreFile').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (file) restoreFrom(file);
    e.target.value = '';
  });
  $('showAllHistory').addEventListener('click', () => { historyExpanded = true; renderHistory(); });
  $('clearHistory').addEventListener('click', () => {
    if (!window.confirm('Дасгалын түүхийг бүрмөсөн устгах уу? Од болон дээд амжилт хэвээр үлдэнэ.')) return;
    saved.history = [];
    historyExpanded = false;
    persist();
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), button => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  $('lesson').addEventListener('change', () => { index = Number($('lesson').value) || 0; reset(); });
  $('duration').addEventListener('change', reset);
  $('restart').addEventListener('click', () => { reset(); focusPractice(); });
  $('start').addEventListener('click', focusPractice);
  $('practice').addEventListener('click', e => { if (e.target.tagName !== 'BUTTON') focusPractice(); });

  $('again').addEventListener('click', () => { $('result').close(); reset(); focusPractice(); });
  $('closeResult').addEventListener('click', () => $('result').close());
  $('nextLesson').addEventListener('click', () => {
    $('result').close();
    const i = current ? C.curriculum.findIndex(lesson => lesson.key === current.key) : -1;
    const next = C.curriculum[i + 1];
    if (next) { setMode('course', next.key); focusPractice(); }
  });

  $('weakDrill').addEventListener('click', () => { setMode('fingers', 'weak'); focusPractice(); });

  $('unlockAll').addEventListener('change', () => {
    saved.unlockAll = $('unlockAll').checked;
    writeNow();
    fillLessons(current ? current.key : null);
  });

  function applyPreferences() {
    document.documentElement.classList.toggle('light', saved.light);
    $('theme').textContent = saved.light ? 'Бараан горим' : 'Цайвар горим';
    $('theme').setAttribute('aria-pressed', String(saved.light));
    $('sound').textContent = 'Дуу: ' + (saved.sound ? 'асаалттай' : 'унтраалттай');
    $('sound').setAttribute('aria-pressed', String(saved.sound));
    $('unlockAll').checked = saved.unlockAll;
  }

  $('theme').addEventListener('click', () => { saved.light = !saved.light; applyPreferences(); writeNow(); });
  $('sound').addEventListener('click', () => {
    saved.sound = !saved.sound;
    applyPreferences();
    writeNow();
    playSound(true);
  });

  /* ======================= Эхлэл ======================= */

  loadSaved();
  applyPreferences();
  renderProgress();
  renderHistory();
  setMode('course');
})();
