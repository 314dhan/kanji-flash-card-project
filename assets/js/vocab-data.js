'use strict';

const VocabData = (() => {

  const GROUP_SIZE = 10;

  const LEVELS = Object.freeze({
    n5: { url: 'assets/data/kanjin5.json', label: 'N5', color: '#4CAF50' },
    n4: { url: 'assets/data/kanjin4.json', label: 'N4', color: '#4db8ff' },
    n3: { url: 'assets/data/kanjin3.json', label: 'N3', color: '#667eea' },
    n2: { url: 'assets/data/kanjin2.json', label: 'N2', color: '#764ba2' },
  });

  const _raw    = {};
  const _groups = {};

  function _parseCards(item, level, groupId) {
    const wordsStr = item.contoh_kata;
    const readStr  = item.contoh_kata_huruf;

    if (!wordsStr || wordsStr.trim() === '-') return [];

    const words    = wordsStr.split(',').map(w => w.trim()).filter(Boolean);
    const readings = readStr ? readStr.split(',').map(r => r.trim()).filter(Boolean) : [];

    const artiRaw = item.arti_contoh_kata ?? item.arti_contoh;
    let meanings = [];
    if (Array.isArray(artiRaw)) {
      meanings = artiRaw.map(m => String(m).trim()).filter(Boolean);
    } else if (artiRaw) {
      meanings = String(artiRaw).split(',').map(m => m.trim()).filter(Boolean);
    }

    return words.map((word, idx) => ({
      id:            `${level}-${item.id}-${idx}`,
      word,
      reading:       readings[idx] ?? '',
      wordMeaning:   meanings[idx] ?? '',
      parentKanji:   item.kanji    ?? '',
      parentMeaning: item.arti     ?? '',
      parentOnyomi:  item.onyomi   ?? '',
      parentKunyomi: item.kunyomi  ?? '',
      parentId:      item.id,
      groupId,
      level,
    }));
  }

  function _buildGroups(rawData, level) {
    const groups = {};
    for (let i = 0; i < rawData.length; i += GROUP_SIZE) {
      const gid   = Math.floor(i / GROUP_SIZE) + 1;
      const cards = rawData.slice(i, i + GROUP_SIZE).flatMap(item => _parseCards(item, level, gid));
      if (cards.length > 0) groups[gid] = cards;
    }
    return groups;
  }

  async function load(level) {
    if (_raw[level]) return;
    const config = LEVELS[level];
    if (!config) throw new Error(`VocabData: unknown level "${level}"`);
    const res = await fetch(config.url);
    if (!res.ok) throw new Error(`VocabData: HTTP ${res.status} for ${config.url}`);
    _raw[level]    = await res.json();
    _groups[level] = _buildGroups(_raw[level], level);
  }

  function isLoaded(level) {
    return Boolean(_raw[level]);
  }

  function getGroupInfoList(level) {
    const raw    = _raw[level];
    const groups = _groups[level];
    if (!raw || !groups) return [];

    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .map(gid => {
        const startIdx   = (gid - 1) * GROUP_SIZE;
        const endIdx     = Math.min(gid * GROUP_SIZE - 1, raw.length - 1);
        const firstKanji = raw[startIdx]?.kanji ?? '';
        const lastKanji  = raw[endIdx]?.kanji   ?? '';
        return {
          id:        gid,
          label:     firstKanji === lastKanji ? firstKanji : `${firstKanji}〜${lastKanji}`,
          startNum:  startIdx + 1,
          endNum:    endIdx   + 1,
          cardCount: groups[gid].length,
        };
      });
  }

  function getTotalCards(level) {
    const groups = _groups[level];
    if (!groups) return 0;
    return Object.values(groups).reduce((sum, cards) => sum + cards.length, 0);
  }

  function getCards(level, groupId = 'all') {
    const groups = _groups[level];
    if (!groups) return [];
    if (groupId === 'all') {
      return Object.keys(groups).map(Number).sort((a, b) => a - b).flatMap(gid => groups[gid]);
    }
    return [...(groups[parseInt(groupId, 10)] ?? [])];
  }

  function getKanjiList(level, groupId = 'all') {
    const raw = _raw[level];
    if (!raw) return [];

    let sliceData, baseIndex;
    if (groupId === 'all') {
      sliceData = raw;
      baseIndex = 0;
    } else {
      const gid = parseInt(groupId, 10);
      baseIndex = (gid - 1) * GROUP_SIZE;
      sliceData = raw.slice(baseIndex, baseIndex + GROUP_SIZE);
    }

    const cardsByParentId = {};
    getCards(level, groupId).forEach(card => {
      if (!cardsByParentId[card.parentId]) cardsByParentId[card.parentId] = [];
      cardsByParentId[card.parentId].push(card);
    });

    return sliceData
      .filter(item => (cardsByParentId[item.id]?.length ?? 0) > 0)
      .map((item, localIdx) => ({
        id:      item.id,
        kanji:   item.kanji   ?? '',
        onyomi:  item.onyomi  ?? '',
        kunyomi: item.kunyomi ?? '',
        meaning: item.arti    ?? '',
        groupId: Math.floor((baseIndex + localIdx) / GROUP_SIZE) + 1,
        cards:   cardsByParentId[item.id] ?? [],
      }));
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  return Object.freeze({
    GROUP_SIZE,
    LEVELS,
    load,
    isLoaded,
    getGroupInfoList,
    getTotalCards,
    getCards,
    getKanjiList,
    shuffle,
  });

})();
