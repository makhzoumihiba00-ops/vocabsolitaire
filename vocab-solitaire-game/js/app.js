/* ==========================================================================
   VocabSolitaire — Application bootstrap & game flow
   ========================================================================== */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const App = (() => {
    function escapeAttr(v) {
      return String(v).replace(/"/g, '\\"');
    }

    function cardElById(id) {
      return Ui.els.deckArea.querySelector(`.word-card[data-id="${escapeAttr(id)}"]`);
    }

    /* ------------------------------------------------------------------ */
    /* Game lifecycle                                                      */
    /* ------------------------------------------------------------------ */

    function startGame(deckId) {
      Store.newGame(deckId);
      try {
        localStorage.setItem(GAME_CONFIG.storageKeys.deck, deckId);
      } catch (e) { /* ignore */ }
    }

    Store.on("game-started", (state) => {
      Ui.renderFoundations(state);
      Ui.renderDeck(state);
      Ui.updateStats(state);
      Ui.updateCardsLeft(state);
      Ui.setTimer(0);
      Ui.markSelected(null);
      Anim.deal(Array.from(document.querySelectorAll(".word-card")));
    });

    Store.on("card-sorted", () => {
      Ui.updateStats(Store.get());
      Ui.popScore();
    });

    Store.on("card-error", () => {
      Ui.updateStats(Store.get());
      Ui.popErrors();
    });

    Store.on("tick", (seconds) => Ui.setTimer(seconds));

    Store.on("select", (selectedId) => Ui.markSelected(selectedId));

    Store.on("game-won", (state) => {
      setTimeout(() => {
        Sfx.win();
        Anim.confetti(Ui.els.confettiLayer);
        setTimeout(() => Ui.showWin(state), 900);
      }, 650);
    });

    /* ------------------------------------------------------------------ */
    /* Card placement (shared by drag-drop, tap-to-select and keyboard)    */
    /* ------------------------------------------------------------------ */

    function attemptPlace(card, foundationEl, ghost, originRect) {
      Store.startClock();

      if (card.categoryId === foundationEl.dataset.category) {
        Sfx.correct();
        Anim.glow(foundationEl, "correct");
        Store.markSorted(card.id);
        commitSort(card, foundationEl, ghost);
      } else {
        Sfx.wrong();
        Anim.glow(foundationEl, "wrong");
        Store.addError();
        Anim.springBack(ghost, originRect, () => {
          ghost.remove();
          const original = cardElById(card.id);
          if (original) original.classList.remove("is-lifting");
        });
      }
    }

    function commitSort(card, foundationEl, ghost) {
      const stack = foundationEl.querySelector(".pile-stack");
      const hint = foundationEl.querySelector(".pile-hint");
      const index = Store.sortedIn(card.categoryId) - 1;

      /* build the resting chip hidden, so we can measure its final box */
      const chip = document.createElement("div");
      chip.className = "pile-chip";
      chip.textContent = card.word;
      chip.style.setProperty("--i", index);
      chip.style.setProperty("--rot", `${card.rotation}deg`);
      chip.style.setProperty("--z", index + 1);
      chip.style.visibility = "hidden";
      stack.appendChild(chip);
      if (hint) hint.style.display = "none";

      Anim.fly(ghost, chip.getBoundingClientRect(), card.rotation, () => {
        ghost.remove();
        chip.style.visibility = "";
        chip.classList.add("pop-in");

        const cardEl = cardElById(card.id);
        if (cardEl) Anim.flipRemove(cardEl);

        Ui.updateFoundation(card.categoryId);
        Ui.updateCardsLeft(Store.get());

        if (Store.unsortedCount() === 0) {
          setTimeout(() => Ui.renderDeckEmpty(), 500);
        }
      });
    }

    function onFoundationActivate(foundationEl) {
      const state = Store.get();
      if (!state || !state.selectedId || state.finished) return;

      const card = Store.card(state.selectedId);
      const cardEl = cardElById(card.id);
      if (!cardEl) return;

      const spawned = DragDrop.spawnGhost(cardEl, true);
      Store.clearSelection();
      attemptPlace(card, foundationEl, spawned.ghost, spawned.originRect);
    }

    /* ------------------------------------------------------------------ */
    /* Boot: cache elements, bind events, start                            */
    /* ------------------------------------------------------------------ */

    function init() {
      Ui.cache(); /* all elements cached before any render */
      updateSoundIcon();

      /* drag & drop + tap-to-select */
      DragDrop.init({
        root: Ui.els.deckArea,

        onDragStart() {
          Store.startClock();
          Store.clearSelection();
        },

        onDrop({ cardEl, ghost, originRect, foundationEl }) {
          const card = Store.card(cardEl.dataset.id);
          if (!card) {
            Anim.springBack(ghost, originRect, () => ghost.remove());
            return;
          }
          attemptPlace(card, foundationEl, ghost, originRect);
        },

        onTap(cardEl) {
          Store.startClock();
          Store.setSelected(cardEl.dataset.id);
        }
      });

      /* tap a foundation while a card is selected → place it there */
      Ui.els.foundationsRow.addEventListener("click", (e) => {
        const f = e.target.closest(".foundation");
        if (f) onFoundationActivate(f);
      });

      Ui.els.foundationsRow.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const f = e.target.closest(".foundation");
        if (f) { e.preventDefault(); onFoundationActivate(f); }
      });

      Ui.els.deckArea.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const cardEl = e.target.closest(".word-card");
        if (cardEl) { e.preventDefault(); Store.startClock(); Store.setSelected(cardEl.dataset.id); }
      });

      /* clicking anywhere else drops the selection */
      document.addEventListener("click", (e) => {
        if (e.target.closest(".word-card") || e.target.closest(".foundation")) return;
        Store.clearSelection();
      });

      /* top bar controls */
      $("#btn-sound").addEventListener("click", () => {
        Sfx.setEnabled(!Sfx.enabled);
        updateSoundIcon();
        Ui.toast(Sfx.enabled ? "🔊 Sound on" : "🔇 Sound off");
      });

      $("#btn-restart").addEventListener("click", () => {
        Sfx.shuffle();
        startGame(Store.get().deckId);
        Ui.toast("🔄 Deck reshuffled — good luck!");
      });

      /* decks modal */
      const decksModal = Ui.els.modalDecks;

      const openDecksModal = () => {
        Ui.renderDeckList(Store.get().deckId, (deckId) => {
          Ui.closeModal(decksModal);
          Sfx.shuffle();
          const isNew = deckId !== Store.get().deckId;
          startGame(deckId);
          const deck = VOCAB_CONFIG.decks.find((d) => d.id === deckId);
          Ui.toast(isNew ? `${deck.emoji} Switched to “${deck.name}”` : "🔄 Deck reshuffled — good luck!");
        });
        Ui.openModal(decksModal);
      };

      $("#btn-decks").addEventListener("click", openDecksModal);

      /* victory modal */
      $("#btn-play-again").addEventListener("click", () => {
        Ui.closeModal(Ui.els.modalWin);
        Sfx.shuffle();
        startGame(Store.get().deckId);
      });

      $("#btn-change-deck").addEventListener("click", () => {
        Ui.closeModal(Ui.els.modalWin);
        openDecksModal();
      });

      /* modal dismissal (overlay click + Escape) */
      document.querySelectorAll(".modal-overlay").forEach((overlay) => {
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) Ui.closeModal(overlay);
        });
        overlay.querySelectorAll("[data-close]").forEach((btn) => {
          btn.addEventListener("click", () => Ui.closeModal(overlay));
        });
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          document.querySelectorAll(".modal-overlay.is-open").forEach(Ui.closeModal);
        }
      });

      /* footer scroll cue */
      const scrollBtn = $("#btn-scroll-down");
      const chevron = $("#icon-chevron");
      const nearBottom = () =>
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 140;

      scrollBtn.addEventListener("click", () => {
        if (nearBottom()) window.scrollTo({ top: 0, behavior: "smooth" });
        else Ui.els.deckArea.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      window.addEventListener(
        "scroll",
        () => { chevron.style.transform = nearBottom() ? "rotate(180deg)" : ""; },
        { passive: true }
      );

      /* unlock WebAudio on the first gesture (autoplay policy) */
      const unlock = () => {
        Sfx.unlock();
        document.removeEventListener("pointerdown", unlock);
        document.removeEventListener("keydown", unlock);
      };
      document.addEventListener("pointerdown", unlock);
      document.addEventListener("keydown", unlock);

      /* clock ticks are cheap; Store.tick no-ops until the game starts */
      setInterval(() => Store.tick(), 1000);

      /* restore last deck */
      let savedDeck = null;
      try {
        savedDeck = localStorage.getItem(GAME_CONFIG.storageKeys.deck);
      } catch (e) { /* ignore */ }
      startGame(savedDeck || VOCAB_CONFIG.decks[0].id);
    }

    function updateSoundIcon() {
      $("#icon-sound-on").style.display = Sfx.enabled ? "" : "none";
      $("#icon-sound-off").style.display = Sfx.enabled ? "none" : "";
      $("#btn-sound").title = Sfx.enabled ? "Mute sound" : "Unmute sound";
    }

    return { init };
  })();

  /* -------------------------------------------------------------------- */
  /* BOOT SAFETY — wait for the deferred GSAP script via DOMContentLoaded, */
  /* but never block on a slow CDN: a timeout boots with WAAPI fallback.   */
  /* -------------------------------------------------------------------- */
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    App.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
    setTimeout(boot, 1600);
  } else {
    boot();
  }
})();
