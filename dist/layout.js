'use strict';
/* Монгол кирилл гарын байрлал.
   Физик товчны код (event.code) дээр тулгуурласан тул
   компьютерийн хэлний тохиргооноос хамаарахгүй. */
window.KH_LAYOUT = (function () {

  const keyMap = {};

  function mapRow(codes, letters) {
    codes.split(' ').forEach((code, i) => {
      keyMap[code] = [letters[i], letters[i].toUpperCase()];
    });
  }

  mapRow('KeyQ KeyW KeyE KeyR KeyT KeyY KeyU KeyI KeyO KeyP BracketLeft BracketRight', 'фцужэнгшүзкъ');
  mapRow('KeyA KeyS KeyD KeyF KeyG KeyH KeyJ KeyK KeyL Semicolon Quote', 'йыбөахролдп');
  mapRow('KeyZ KeyX KeyC KeyV KeyB KeyN KeyM Comma Period Slash', 'ячёсмитьвю');

  Object.assign(keyMap, {
    Backquote: ['=', '+'],
    Digit1: ['№', '1'],
    Digit2: ['-', '2'],
    Digit3: ['"', '3'],
    Digit4: ['₮', '4'],
    Digit5: [':', '5'],
    Digit6: ['.', '6'],
    Digit7: ['_', '7'],
    Digit8: [',', '8'],
    Digit9: ['%', '9'],
    Digit0: ['?', '0'],
    Minus: ['е', 'Е'],
    Equal: ['щ', 'Щ'],
    Backslash: ['\\', '|'],
    Space: [' ', ' ']
  });

  const fingerMap = {
    LP: { name: 'Зүүн гарын чигчий хуруу', short: 'Чигчий', color: '#ed91b9', codes: 'Backquote Digit1 KeyQ KeyA KeyZ ShiftLeft' },
    LR: { name: 'Зүүн гарын ядам хуруу', short: 'Ядам', color: '#c5a1f2', codes: 'Digit2 KeyW KeyS KeyX' },
    LM: { name: 'Зүүн гарын дунд хуруу', short: 'Дунд', color: '#8cb7f3', codes: 'Digit3 KeyE KeyD KeyC' },
    LI: { name: 'Зүүн гарын долоовор хуруу', short: 'Долоовор', color: '#69d3da', codes: 'Digit4 Digit5 KeyR KeyT KeyF KeyG KeyV KeyB' },
    LT: { name: 'Зүүн гарын эрхий хуруу', short: 'Эрхий', color: '#b5c7d9', codes: 'Space' },
    RT: { name: 'Баруун гарын эрхий хуруу', short: 'Эрхий', color: '#d7c8aa', codes: 'Space' },
    RI: { name: 'Баруун гарын долоовор хуруу', short: 'Долоовор', color: '#92d99b', codes: 'Digit6 Digit7 KeyY KeyU KeyH KeyJ KeyN KeyM' },
    RM: { name: 'Баруун гарын дунд хуруу', short: 'Дунд', color: '#e5d17d', codes: 'Digit8 KeyI KeyK Comma' },
    RR: { name: 'Баруун гарын ядам хуруу', short: 'Ядам', color: '#efb078', codes: 'Digit9 KeyO KeyL Period' },
    RP: { name: 'Баруун гарын чигчий хуруу', short: 'Чигчий', color: '#ef9290', codes: 'Digit0 Minus Equal KeyP BracketLeft BracketRight Semicolon Quote Backslash Slash ShiftRight Backspace Enter' }
  };

  const codeFinger = {};
  Object.entries(fingerMap).forEach(([id, f]) => f.codes.split(' ').forEach(code => { codeFinger[code] = id; }));

  /* Тэмдэгт -> товч. Жижиг үсэг эхэлж бүртгэгдэнэ. */
  const reverseMap = {};
  Object.entries(keyMap).forEach(([code, pair]) => pair.forEach((char, i) => {
    if (!reverseMap[char]) reverseMap[char] = { code, shift: !!i };
  }));

  const rows = [
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
    ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
    ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
    ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
    ['Space']
  ];

  const specialLabels = {
    Backspace: 'Буцаах', Tab: 'Догол', CapsLock: 'Том үсэг', Enter: 'Оруулах',
    ShiftLeft: '⇧ Зүүн', ShiftRight: 'Баруун ⇧', Space: 'Зай авах'
  };

  const restKeys = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];

  /* Монгол кирилл үсгийн бүрэн дараалал */
  const alphabet = 'абвгдеёжзийклмноөпрстуүфхцчшщъыьэюя';

  /* Товчны кодуудаас монгол үсгүүдийг салгаж авна */
  function lettersOf(codes) {
    return codes.split(' ')
      .map(code => keyMap[code] && keyMap[code][0])
      .filter(ch => ch && alphabet.includes(ch));
  }

  function fingerOfChar(char) {
    const t = reverseMap[char];
    return t ? codeFinger[t.code] : null;
  }

  return { keyMap, fingerMap, codeFinger, reverseMap, rows, specialLabels, restKeys, alphabet, lettersOf, fingerOfChar };
})();
