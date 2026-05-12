'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const Dom = {
    screens: {
      setup:     document.getElementById('setup-screen'),
      flashcard: document.getElementById('flashcard-screen'),
      result:    document.getElementById('result-screen'),
    },
    setup: {
      levelTabs:      document.querySelectorAll('.level-tab'),
      groupContainer: document.getElementById('group-container'),
      cardCountBadge: document.getElementById('card-count-badge'),
      startBtn:       document.getElementById('start-btn'),
      viewListLink:   document.getElementById('view-list-link'),
    },
    flashcard: {
      progressFill:    document.getElementById('progress-fill'),
      progressText:    document.getElementById('progress-text'),
      knownCount:      document.getElementById('known-count'),
      learningCount:   document.getElementById('learning-count'),
      card:            document.getElementById('flashcard'),
      cardInner:       document.getElementById('card-inner'),
      wordDisplay:     document.getElementById('word-display'),
      readingDisplay:  document.getElementById('reading-display'),
      parentKanji:     document.getElementById('parent-kanji'),
      parentMeaning:   document.getElementById('parent-meaning'),
      wordMeaning:     document.getElementById('word-meaning'),
      tapHint:         document.getElementById('tap-hint'),
      actionButtons:   document.getElementById('action-buttons'),
      knownBtn:        document.getElementById('known-btn'),
      learningBtn:     document.getElementById('learning-btn'),
      practicePrevBtn: document.getElementById('practice-prev-btn'),
      practiceNextBtn: document.getElementById('practice-next-btn'),
      exitBtn:         document.getElementById('exit-btn'),
    },
    result: {
      emoji:         document.getElementById('result-emoji'),
      percent:       document.getElementById('score-percent'),
      subtitle:      document.getElementById('result-subtitle'),
      known:         document.getElementById('score-known'),
      learning:      document.getElementById('score-learning'),
      weakList:      document.getElementById('weak-list'),
      replayWeakBtn: document.getElementById('replay-weak-btn'),
      replayAllBtn:  document.getElementById('replay-all-btn'),
      newSessionBtn: document.getElementById('new-session-btn'),
    },
  };

  const State = {
    level:         'n5',
    selectedGroup: 'all',
    isPractice:    true,
    deck:         [],
    originalDeck: [],
    index:        0,
    knownIds:     new Set(),
    learningIds:  new Set(),
    isFlipped:    false,
  };

  function showScreen(name) {
    Object.values(Dom.screens).forEach(el => el.classList.remove('active'));
    Dom.screens[name].classList.add('active');
  }

  const Renderer = {
    renderSetup() {
      const groups = VocabData.getGroupInfoList(State.level);
      const total  = VocabData.getTotalCards(State.level);

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

      Dom.setup.groupContainer.innerHTML = html;
      Dom.setup.groupContainer.querySelectorAll('.group-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          State.selectedGroup = chip.dataset.group;
          Renderer.renderSetup();
          Renderer.updateStartBadge();
          Renderer.updateViewListLink();
        });
      });

      Renderer.updateStartBadge();
      Renderer.updateViewListLink();
    },

    updateStartBadge() {
      const count = VocabData.getCards(State.level, State.selectedGroup).length;
      Dom.setup.cardCountBadge.textContent = count > 0 ? `(${count} cards)` : '';
    },

    updateViewListLink() {
      if (!Dom.setup.viewListLink) return;
      const params = new URLSearchParams({ level: State.level });
      if (State.selectedGroup !== 'all') params.set('group', State.selectedGroup);
      Dom.setup.viewListLink.href = `vocab-list.html?${params.toString()}`;
    },

    renderCard(card) {
      Dom.flashcard.wordDisplay.textContent    = card.word;
      Dom.flashcard.readingDisplay.textContent = card.reading;
      Dom.flashcard.wordMeaning.textContent    = card.wordMeaning ?? '';
      Dom.flashcard.parentKanji.textContent    = card.parentKanji;
      Dom.flashcard.parentMeaning.textContent  = card.parentMeaning;
    },

    renderHeader() {
      const { index, deck, knownIds, learningIds } = State;
      const total = deck.length;
      const pct   = total > 0 ? (index / total) * 100 : 0;
      Dom.flashcard.progressFill.style.width  = `${pct}%`;
      Dom.flashcard.progressText.textContent  = `${Math.min(index + 1, total)} / ${total}`;
      Dom.flashcard.knownCount.textContent    = knownIds.size;
      Dom.flashcard.learningCount.textContent = learningIds.size;
    },

    resetCardUI() {
      Dom.flashcard.cardInner.classList.remove('flipped');
      if (State.isPractice) {
        Dom.flashcard.tapHint.style.opacity = '0';
        Dom.flashcard.practicePrevBtn.classList.toggle('inactive', State.index === 0);
      } else {
        Dom.flashcard.tapHint.style.opacity = '1';
      }
      Dom.flashcard.actionButtons.classList.add('visible');
    },

    renderResults() {
      const { originalDeck, knownIds, learningIds, isPractice } = State;
      const total = originalDeck.length;

      Dom.flashcard.progressFill.style.width = '100%';

      if (isPractice) {
        Dom.screens.result.classList.add('practice-mode');
        Dom.result.emoji.textContent    = '✨';
        Dom.result.subtitle.textContent = `All ${total} cards reviewed!`;
        return;
      }

      Dom.screens.result.classList.remove('practice-mode');
      const known = knownIds.size;
      const pct   = total > 0 ? Math.round((known / total) * 100) : 0;

      Dom.result.emoji.textContent    = pct >= 80 ? '🎉' : pct >= 50 ? '📚' : '💪';
      Dom.result.percent.textContent  = `${pct}%`;
      Dom.result.subtitle.textContent = 'Session Complete!';
      Dom.result.known.textContent    = known;
      Dom.result.learning.textContent = learningIds.size;

      const weakCards = originalDeck.filter(c => learningIds.has(c.id));
      if (weakCards.length > 0) {
        Dom.result.weakList.innerHTML = weakCards.map(c => `
          <div class="weak-item">
            <span class="weak-word">${c.word}</span>
            <span class="weak-arrow">→</span>
            <span class="weak-reading">${c.reading}</span>
            <span class="weak-parent">${c.parentKanji}</span>
          </div>`).join('');
        Dom.result.replayWeakBtn.style.display = '';
      } else {
        Dom.result.weakList.innerHTML = '<p class="all-clear">✨ All cards mastered this session!</p>';
        Dom.result.replayWeakBtn.style.display = 'none';
      }
    },
  };

  const Session = {
    start(deck) {
      if (deck.length === 0) return;

      const modeInput = document.querySelector('input[name="session-mode"]:checked');
      State.isPractice = modeInput?.value !== 'scored';

      if (State.isPractice) {
        Dom.screens.flashcard.classList.add('practice-mode');
      } else {
        Dom.screens.flashcard.classList.remove('practice-mode');
      }

      State.deck         = deck;
      State.originalDeck = deck;
      State.index        = 0;
      State.knownIds     = new Set();
      State.learningIds  = new Set();
      State.isFlipped    = false;

      showScreen('flashcard');
      window.scrollTo(0, 0);
      this._loadCard(0);
    },

    _loadCard(index) {
      if (index >= State.deck.length) {
        this.end();
        return;
      }
      State.isFlipped = false;
      Renderer.renderHeader();
      Renderer.renderCard(State.deck[index]);
      Renderer.resetCardUI();
    },

    flip() {
      State.isFlipped = !State.isFlipped;
      Dom.flashcard.cardInner.classList.toggle('flipped', State.isFlipped);

      if (State.isPractice) return;

      Dom.flashcard.tapHint.style.opacity = State.isFlipped ? '0' : '1';
    },

    mark(known) {
      const card = State.deck[State.index];
      if (!card) return;
      if (known) {
        State.knownIds.add(card.id);
        State.learningIds.delete(card.id);
      } else {
        State.learningIds.add(card.id);
        State.knownIds.delete(card.id);
      }
      State.index++;
      Renderer.renderHeader();
      this._loadCard(State.index);
    },

    next() {
      State.index++;
      Renderer.renderHeader();
      this._loadCard(State.index);
    },

    prev() {
      if (State.index <= 0) return;
      State.index--;
      Renderer.renderHeader();
      this._loadCard(State.index);
    },

    end() {
      Renderer.renderResults();
      showScreen('result');
      window.scrollTo(0, 0);
    },

    replayWeak() {
      const weak = State.originalDeck.filter(c => State.learningIds.has(c.id));
      if (weak.length > 0) this.start(weak);
    },

    replayAll() {
      this.start([...State.originalDeck]);
    },
  };

  function bindEvents() {
    Dom.setup.levelTabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        Dom.setup.levelTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        State.level         = tab.dataset.level;
        State.selectedGroup = 'all';
        Dom.setup.groupContainer.innerHTML = '<span class="loading-chips">Loading…</span>';
        try {
          await VocabData.load(State.level);
        } catch {
          Dom.setup.groupContainer.innerHTML = '<span class="loading-chips">Failed to load.</span>';
          return;
        }
        Renderer.renderSetup();
      });
    });

    Dom.setup.startBtn.addEventListener('click', () => {
      let cards = VocabData.getCards(State.level, State.selectedGroup);
      if (cards.length === 0) return;
      const mode = document.querySelector('input[name="card-mode"]:checked')?.value;
      if (mode === 'shuffle') cards = VocabData.shuffle(cards);
      Session.start(cards);
    });

    Dom.flashcard.card.addEventListener('click', () => Session.flip());

    Dom.flashcard.knownBtn.addEventListener('click', e => {
      e.stopPropagation();
      Session.mark(true);
    });

    Dom.flashcard.learningBtn.addEventListener('click', e => {
      e.stopPropagation();
      Session.mark(false);
    });

    Dom.flashcard.practicePrevBtn.addEventListener('click', e => {
      e.stopPropagation();
      Session.prev();
    });

    Dom.flashcard.practiceNextBtn.addEventListener('click', e => {
      e.stopPropagation();
      Session.next();
    });

    Dom.flashcard.exitBtn.addEventListener('click', () => showScreen('setup'));

    Dom.result.replayWeakBtn.addEventListener('click', () => Session.replayWeak());
    Dom.result.replayAllBtn.addEventListener('click',  () => Session.replayAll());
    Dom.result.newSessionBtn.addEventListener('click', () => showScreen('setup'));

    document.addEventListener('keydown', e => {
      if (!Dom.screens.flashcard.classList.contains('active')) return;
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (State.isPractice) {
            Session.next();
          } else if (!State.isFlipped) {
            Session.flip();
          } else {
            Session.mark(true);
          }
          break;
        case 'ArrowRight':
          if (State.isPractice) Session.next();
          else Session.mark(true);
          break;
        case 'ArrowLeft':
          if (State.isPractice) Session.prev();
          else Session.mark(false);
          break;
        case 'Escape':
          showScreen('setup');
          break;
      }
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

    Dom.setup.groupContainer.innerHTML = '<span class="loading-chips">Loading…</span>';
    try {
      await VocabData.load(State.level);
    } catch {
      Dom.setup.groupContainer.innerHTML = '<span class="loading-chips">Failed to load data.</span>';
      return;
    }

    Renderer.renderSetup();
  }

  init();
});
