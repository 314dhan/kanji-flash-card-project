'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const Dom = {
    levelTabs:        document.querySelectorAll('.level-tab'),
    groupContainer:   document.getElementById('group-container'),
    practiceLink:     document.getElementById('practice-link'),
    listContent:      document.getElementById('list-content'),
    totalBadge:       document.getElementById('total-badge'),
    searchInput:      document.getElementById('search-input'),
    searchClear:      document.getElementById('search-clear'),
    chipsToggle:      document.getElementById('chips-toggle'),
    chipsToggleLabel: document.getElementById('chips-toggle-label'),
    chipsPanel:       document.getElementById('chips-panel'),
  };

  const State = {
    level:         'n5',
    selectedGroup: 'all',
    searchQuery:   '',
    chipsOpen:     false,
  };

  const Renderer = {
    renderGroupChips() {
      const groups = VocabData.getGroupInfoList(State.level);
      const total  = VocabData.getTotalCards(State.level);

      if (Dom.totalBadge) Dom.totalBadge.textContent = total;

      let html = `
        <button class="group-chip ${State.selectedGroup === 'all' ? 'active' : ''}" data-group="all">
          All <span class="chip-count">${total}</span>
        </button>`;

      groups.forEach(g => {
        const active = String(State.selectedGroup) === String(g.id) ? 'active' : '';
        html += `
          <button class="group-chip ${active}" data-group="${g.id}"
                  title="Kanji #${g.startNum}–${g.endNum}">
            ${g.label} <span class="chip-count">${g.cardCount}</span>
          </button>`;
      });

      Dom.groupContainer.innerHTML = html;
      Dom.groupContainer.querySelectorAll('.group-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          State.selectedGroup = chip.dataset.group;
          State.chipsOpen = false;
          Renderer._applyChipsPanelState();
          Renderer.renderGroupChips();
          Renderer.renderList();
          Renderer.updatePracticeLink();
        });
      });

      Renderer._updateToggleLabel();
    },

    _updateToggleLabel() {
      if (!Dom.chipsToggleLabel) return;
      if (State.selectedGroup === 'all') {
        Dom.chipsToggleLabel.textContent = 'Semua Grup';
        return;
      }
      const groups = VocabData.getGroupInfoList(State.level);
      const g = groups.find(g => String(g.id) === String(State.selectedGroup));
      Dom.chipsToggleLabel.textContent = g ? g.label : 'Grup';
    },

    _applyChipsPanelState() {
      if (!Dom.chipsPanel || !Dom.chipsToggle) return;
      Dom.chipsPanel.classList.toggle('open', State.chipsOpen);
      Dom.chipsToggle.classList.toggle('expanded', State.chipsOpen);
      Dom.chipsToggle.setAttribute('aria-expanded', String(State.chipsOpen));
    },

    updatePracticeLink() {
      if (!Dom.practiceLink) return;
      const params = new URLSearchParams({ level: State.level });
      if (State.selectedGroup !== 'all') params.set('group', State.selectedGroup);
      Dom.practiceLink.href = `vocab-flashcard.html?${params.toString()}`;
    },

    renderList() {
      const q = State.searchQuery.trim();

      let entries;
      if (q) {
        entries = Renderer._searchEntries(q);
      } else {
        entries = VocabData.getKanjiList(State.level, State.selectedGroup);
      }

      if (entries.length === 0) {
        Dom.listContent.innerHTML = q
          ? `<p class="vl-empty">Tidak ada hasil untuk "<strong>${q}</strong>"</p>`
          : '<p class="vl-empty">No vocabulary found for this selection.</p>';
        return;
      }

      Dom.listContent.innerHTML = entries
        .map(entry => Renderer._kanjiBlockHTML(entry))
        .join('');
    },

    _searchEntries(q) {
      const allEntries = VocabData.getKanjiList(State.level, 'all');
      const ql = q.toLowerCase();

      return allEntries.reduce((acc, entry) => {
        const kanjiMatch   = entry.kanji.includes(q);
        const meaningMatch = entry.meaning.toLowerCase().includes(ql);

        const matchedCardIds = new Set(
          entry.cards
            .filter(c =>
              c.word.includes(q) ||
              c.reading.includes(q) ||
              (c.wordMeaning && c.wordMeaning.toLowerCase().includes(ql))
            )
            .map(c => c.id)
        );

        if (!kanjiMatch && !meaningMatch && matchedCardIds.size === 0) return acc;

        const cards = entry.cards.map(c => ({
          ...c,
          _match: kanjiMatch || meaningMatch || matchedCardIds.has(c.id),
        }));

        acc.push({ ...entry, cards });
        return acc;
      }, []);
    },

    _kanjiBlockHTML(entry) {
      const onyomiLabel  = Renderer._readingLabel(entry.onyomi,  'ON');
      const kunyomiLabel = Renderer._readingLabel(entry.kunyomi, 'KUN');

      const isInN3 = State.level === 'n2' && VocabData.getKanjiSet('n3').has(entry.kanji);

      const wordCards = entry.cards.map(card => `
        <div class="vl-word-card${card._match ? ' match' : ''}">
          <div class="vl-word-kanji">${card.word}</div>
          <div class="vl-word-reading">${card.reading}</div>
          ${card.wordMeaning ? `<div class="vl-word-meaning">${card.wordMeaning}</div>` : ''}
        </div>`).join('');

      return `
        <div class="vl-kanji-block">
          <div class="vl-kanji-header">
            <div class="vl-kanji-char-wrap">
              <span class="vl-kanji-char">${entry.kanji}</span>
              ${isInN3 ? '<span class="vl-level-badge vl-n3-badge" title="Kanji ini juga ada di N3">N3</span>' : ''}
            </div>
            <div class="vl-kanji-meta">
              <span class="vl-kanji-meaning">${entry.meaning}</span>
              <div class="vl-kanji-readings">
                ${onyomiLabel}
                ${kunyomiLabel}
              </div>
            </div>
            <a class="vl-practice-this"
               href="vocab-flashcard.html?level=${entry.level ?? State.level}&group=${entry.groupId}"
               title="Practice this group">
              Practice →
            </a>
          </div>
          <div class="vl-word-grid">${wordCards}</div>
        </div>`;
    },

    _readingLabel(value, type) {
      if (!value || value === '-' || value.toLowerCase() === 'none') return '';
      return `<span class="vl-reading-pill">
                <span class="vl-reading-type">${type}</span>
                ${value}
              </span>`;
    },

    _updateSearchClear() {
      if (!Dom.searchClear) return;
      Dom.searchClear.style.display = State.searchQuery ? 'flex' : 'none';
    },
  };

  function bindEvents() {
    Dom.levelTabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        Dom.levelTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        State.level         = tab.dataset.level;
        State.selectedGroup = 'all';
        State.searchQuery   = '';
        State.chipsOpen     = false;
        if (Dom.searchInput) Dom.searchInput.value = '';
        Renderer._updateSearchClear();
        Renderer._applyChipsPanelState();

        Dom.groupContainer.innerHTML = '<span class="loading-chips">Loading…</span>';
        Dom.listContent.innerHTML    = '<p class="vl-loading">Loading vocabulary…</p>';

        try {
          await VocabData.load(State.level);
          if (State.level === 'n2') await VocabData.load('n3').catch(() => {});
        } catch {
          Dom.listContent.innerHTML = '<p class="vl-empty">Failed to load data.</p>';
          return;
        }

        Renderer.renderGroupChips();
        Renderer.renderList();
        Renderer.updatePracticeLink();
      });
    });

    if (Dom.searchInput) {
      let debounceTimer;
      Dom.searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          State.searchQuery = Dom.searchInput.value;
          Renderer._updateSearchClear();
          Renderer.renderList();
        }, 200);
      });
    }

    if (Dom.searchClear) {
      Dom.searchClear.addEventListener('click', () => {
        Dom.searchInput.value = '';
        State.searchQuery = '';
        Renderer._updateSearchClear();
        Renderer.renderList();
        Dom.searchInput.focus();
      });
    }

    if (Dom.chipsToggle) {
      Dom.chipsToggle.addEventListener('click', () => {
        State.chipsOpen = !State.chipsOpen;
        Renderer._applyChipsPanelState();
      });
    }

    document.addEventListener('click', e => {
      if (!State.chipsOpen) return;
      if (Dom.chipsToggle?.contains(e.target)) return;
      if (Dom.chipsPanel?.contains(e.target)) return;
      State.chipsOpen = false;
      Renderer._applyChipsPanelState();
    });
  }

  async function init() {
    const params     = new URLSearchParams(window.location.search);
    const levelParam = params.get('level');
    const groupParam = params.get('group');

    if (levelParam && VocabData.LEVELS[levelParam.toLowerCase()]) {
      State.level = levelParam.toLowerCase();
    }
    if (groupParam) State.selectedGroup = groupParam;

    document.querySelector(`.level-tab[data-level="${State.level}"]`)?.classList.add('active');

    Renderer._updateSearchClear();
    Renderer._applyChipsPanelState();
    bindEvents();

    Dom.groupContainer.innerHTML = '<span class="loading-chips">Loading…</span>';
    Dom.listContent.innerHTML    = '<p class="vl-loading">Loading vocabulary…</p>';

    try {
      await VocabData.load(State.level);
      if (State.level === 'n2') await VocabData.load('n3').catch(() => {});
    } catch {
      Dom.listContent.innerHTML = '<p class="vl-empty">Failed to load data.</p>';
      return;
    }

    Renderer.renderGroupChips();
    Renderer.renderList();
    Renderer.updatePracticeLink();
  }

  init();
});
