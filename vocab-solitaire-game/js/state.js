/* ==========================================================================
   VocabSolitaire — Game state store (tiny pub/sub)
   ========================================================================== */

const Store = (() => {
  const listeners = {};
  let state = null;
  let uid = 0;

  function on(event, cb) {
    (listeners[event] = listeners[event] || []).push(cb);
  }

  function emit(event, payload) {
    (listeners[event] || []).forEach((cb) => {
      try { cb(payload); } catch (e) { console.error(`[store] listener for "${event}" failed`, e); }
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

  function newGame(deckId) {
    const deck = VOCAB_CONFIG.decks.find((d) => d.id === deckId) || VOCAB_CONFIG.decks[0];

    state = {
      deckId: deck.id,
      deckName: deck.name,
      categories: deck.categories.map((c) => ({ ...c })),
      cards: shuffle(deck.words.map((w) => ({
        id: `card-${++uid}`,
        word: w.word,
        categoryId: w.category,
        sorted: false,
        rotation: rand(-7, 7)
      }))),
      score: 0,
      errors: 0,
      seconds: 0,
      started: false,
      finished: false,
      selectedId: null
    };

    emit("game-started", state);
    return state;
  }

  return {
    on,
    newGame,

    get() { return state; },

    card(id) {
      return state ? state.cards.find((c) => c.id === id) : null;
    },

    category(id) {
      return state.categories.find((c) => c.id === id);
    },

    categoryTotal(id) {
      return state.cards.filter((c) => c.categoryId === id).length;
    },

    sortedIn(id) {
      return state.cards.filter((c) => c.categoryId === id && c.sorted).length;
    },

    sortedCount(id) {
      return state.cards.filter((c) => c.id === id && c.sorted).length;
    },

    unsortedCount() {
      return state.cards.filter((c) => !c.sorted).length;
    },

    markSorted(id) {
      const card = this.card(id);
      if (!card || card.sorted) return;
      card.sorted = true;
      state.score++;
      state.selectedId = null;
      emit("card-sorted", { card, score: state.score });
      if (state.score === state.cards.length) {
        state.finished = true;
        emit("game-won", { ...state });
      }
    },

    addError() {
      state.errors++;
      emit("card-error", { errors: state.errors });
    },

    tick() {
      if (!state || !state.started || state.finished) return;
      state.seconds++;
      emit("tick", state.seconds);
    },

    startClock() {
      if (state && !state.started) state.started = true;
    },

    setSelected(id) {
      state.selectedId = state.selectedId === id ? null : id;
      emit("select", state.selectedId);
      return state.selectedId;
    },

    clearSelection() {
      if (state && state.selectedId !== null) {
        state.selectedId = null;
        emit("select", null);
      }
    }
  };
})();
