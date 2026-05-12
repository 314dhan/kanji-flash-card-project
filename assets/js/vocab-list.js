'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const Dom = {
    levelTabs:      document.querySelectorAll('.level-tab'),
    groupContainer: document.getElementById('group-container'),
    practiceLink:   document.getElementById('practice-link'),
    listContent:    document.getElementById('list-content'),
    totalBadge:     document.getElementById('total-badge'),
  };

  const State = {
    level:         'n5',
    selectedGroup: 'all',
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
          Renderer.renderGroupChips();
          Renderer.renderList();
          Renderer.updatePracticeLink();
        });
      });
    },

    updatePracticeLink() {
      if (!Dom.practiceLink) return;
      const params = new URLSearchParams({ level: State.level });
      if (State.selectedGroup !== 'all') params.set('group', State.selectedGroup);
      Dom.practiceLink.href = `vocab-flashcard.html?${params.toString()}`;
    },

    renderList() {
      const entries = VocabData.getKanjiList(State.level, State.selectedGroup);

      if (entries.length === 0) {
        Dom.listContent.innerHTML = '<p class="vl-empty">No vocabulary found for this selection.</p>';
        return;
      }

      Dom.listContent.innerHTML = entries
        .map(entry => Renderer._kanjiBlockHTML(entry))
        .join('');
    },

    _kanjiBlockHTML(entry) {
      const onyomiLabel  = Renderer._readingLabel(entry.onyomi,  'ON');
      const kunyomiLabel = Renderer._readingLabel(entry.kunyomi, 'KUN');

      const wordCards = entry.cards.map(card => `
        <div class="vl-word-card">
          <div class="vl-word-kanji">${card.word}</div>
          <div class="vl-word-reading">${card.reading}</div>
        </div>`).join('');

      return `
        <div class="vl-kanji-block">
          <div class="vl-kanji-header">
            <div class="vl-kanji-char-wrap">
              <span class="vl-kanji-char">${entry.kanji}</span>
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
  };

  function bindEvents() {
    Dom.levelTabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        Dom.levelTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        State.level         = tab.dataset.level;
        State.selectedGroup = 'all';

        Dom.groupContainer.innerHTML = '<span class="loading-chips">Loading…</span>';
        Dom.listContent.innerHTML    = '<p class="vl-loading">Loading vocabulary…</p>';

        try {
          await VocabData.load(State.level);
        } catch {
          Dom.listContent.innerHTML = '<p class="vl-empty">Failed to load data.</p>';
          return;
        }

        Renderer.renderGroupChips();
        Renderer.renderList();
        Renderer.updatePracticeLink();
      });
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

    bindEvents();

    Dom.groupContainer.innerHTML = '<span class="loading-chips">Loading…</span>';
    Dom.listContent.innerHTML    = '<p class="vl-loading">Loading vocabulary…</p>';

    try {
      await VocabData.load(State.level);
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
