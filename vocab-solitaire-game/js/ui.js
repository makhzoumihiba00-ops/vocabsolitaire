/* ==========================================================================
   VocabSolitaire — DOM rendering & UI helpers
   ========================================================================== */

const Ui = (() => {
  const $ = (sel) => document.querySelector(sel);

  const els = {};

  const HANDLE_SVG =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">' +
    '<circle cx="9" cy="6" r="1.7"></circle><circle cx="15" cy="6" r="1.7"></circle>' +
    '<circle cx="9" cy="12" r="1.7"></circle><circle cx="15" cy="12" r="1.7"></circle>' +
    '<circle cx="9" cy="18" r="1.7"></circle><circle cx="15" cy="18" r="1.7"></circle></svg>';

  function cache() {
    els.foundationsRow = $("#foundations-row");
    els.deckArea = $("#deck-area");
    els.cardsLeft = $("#cards-left");
    els.timeValue = $("#time-value");
    els.scoreValue = $("#score-value");
    els.errorsValue = $("#errors-value");
    els.statScore = $("#stat-score");
    els.statErrors = $("#stat-errors");
    els.toast = $("#toast");
    els.modalDecks = $("#modal-decks");
    els.modalWin = $("#modal-win");
    els.deckList = $("#deck-list");
    els.confettiLayer = $("#confetti-layer");
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  /* ---------- game board ---------- */

  function renderFoundations(state) {
    els.foundationsRow.innerHTML = "";
    state.categories.forEach((cat) => {
      const total = Store.categoryTotal(cat.id);
      const f = document.createElement("div");
      f.className = "foundation";
      f.dataset.category = cat.id;
      f.setAttribute("role", "button");
      f.setAttribute("tabindex", "0");
      f.setAttribute("aria-label", `Drop ${cat.name} words here`);
      f.innerHTML =
        `<div class="foundation-head">` +
        `<span class="foundation-icon" aria-hidden="true">${cat.icon}</span>` +
        `<span class="foundation-name">${cat.name}</span>` +
        `<span class="foundation-count" data-count>0/${total}</span>` +
        `</div>` +
        `<div class="pile-stack"></div>` +
        `<div class="pile-hint">Drop Here</div>`;
      els.foundationsRow.appendChild(f);
    });
  }

  function renderDeck(state) {
    els.deckArea.innerHTML = "";
    state.cards
      .filter((c) => !c.sorted)
      .forEach((card) => {
        const el = document.createElement("div");
        el.className = "word-card";
        el.dataset.id = card.id;
        el.innerHTML =
          `<span class="drag-handle">${HANDLE_SVG}</span>` +
          `<span class="word-text">${card.word}</span>`;
        els.deckArea.appendChild(el);
      });
  }

  function renderDeckEmpty() {
    els.deckArea.innerHTML =
      `<div class="deck-empty">🎉 All cards sorted — beautifully done!</div>`;
  }

  function foundationEl(categoryId) {
    return els.foundationsRow.querySelector(`.foundation[data-category="${categoryId}"]`);
  }

  function updateFoundation(categoryId) {
    const f = foundationEl(categoryId);
    if (!f) return;
    const sorted = Store.sortedIn(categoryId);
    const total = Store.categoryTotal(categoryId);
    const count = f.querySelector("[data-count]");
    count.textContent = `${sorted}/${total}`;
    f.classList.toggle("is-complete", sorted === total);
    Anim.pop(f.querySelector(".foundation-count"));
  }

  function updateStats(state) {
    els.scoreValue.textContent = `${state.score} / ${state.cards.length}`;
    els.errorsValue.textContent = String(state.errors);
  }

  function popScore() { Anim.pop(els.statScore); }
  function popErrors() { Anim.pop(els.statErrors); }

  function updateCardsLeft(state) {
    els.cardsLeft.textContent = `${Store.unsortedCount()} Left`;
  }

  function setTimer(seconds) {
    els.timeValue.textContent = formatTime(seconds);
  }

  function markSelected(selectedId) {
    els.deckArea.querySelectorAll(".word-card").forEach((el) => {
      el.classList.toggle("is-selected", el.dataset.id === selectedId);
    });
  }

  /* ---------- toast ---------- */

  let toastTimer = null;

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 1900);
  }

  /* ---------- modals ---------- */

  function openModal(overlay) {
    overlay.classList.add("is-open");
    document.body.classList.add("modal-open");
  }

  function closeModal(overlay) {
    overlay.classList.remove("is-open");
    if (!document.querySelector(".modal-overlay.is-open")) {
      document.body.classList.remove("modal-open");
    }
  }

  function renderDeckList(currentId, onPick) {
    els.deckList.innerHTML = "";
    VOCAB_CONFIG.decks.forEach((deck) => {
      const isCurrent = deck.id === currentId;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "deck-option" + (isCurrent ? " is-current" : "");
      btn.innerHTML =
        `<span class="deck-emoji" aria-hidden="true">${deck.emoji}</span>` +
        `<span class="deck-info">` +
        `<span class="deck-name">${deck.name}${isCurrent ? '<span class="current-tag">PLAYING</span>' : ""}</span>` +
        `<span class="deck-tagline">${deck.tagline}</span>` +
        `<span class="deck-cats">${deck.categories.map((c) => `<span>${c.icon} ${c.name}</span>`).join("")}</span>` +
        `</span>` +
        `<span class="deck-go">${isCurrent ? "↻" : "▶"}</span>`;
      btn.addEventListener("click", () => onPick(deck.id));
      els.deckList.appendChild(btn);
    });
  }

  function showWin(state) {
    const attempts = state.cards.length + state.errors;
    const accuracy = Math.round((state.cards.length / attempts) * 100);
    $("#win-time").textContent = formatTime(state.seconds);
    $("#win-errors").textContent = String(state.errors);
    $("#win-accuracy").textContent = `${accuracy}%`;
    openModal(els.modalWin);
  }

  return {
    cache,
    formatTime,
    renderFoundations,
    renderDeck,
    renderDeckEmpty,
    foundationEl,
    updateFoundation,
    updateStats,
    popScore,
    popErrors,
    updateCardsLeft,
    setTimer,
    markSelected,
    toast,
    openModal,
    closeModal,
    renderDeckList,
    showWin,
    els
  };
})();
