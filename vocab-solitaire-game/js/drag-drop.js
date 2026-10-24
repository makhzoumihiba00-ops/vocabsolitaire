/* ==========================================================================
   VocabSolitaire — Pointer-based drag & drop (mouse, touch and pen)
   Also powers tap-to-select: a pointerup without movement is treated
   as a tap, letting players pick a card then tap a foundation.
   ========================================================================== */

const DragDrop = (() => {
  let cfg = null;
  /* cfg = {
       root,                                  // element containing .word-card
       onDragStart(cardEl),                   // drag begins (after threshold)
       onDrop({cardEl, ghost, originRect, foundationEl}),
       onTap(cardEl, originRect)              // tap-to-select
     } */
  let drag = null;

  function init(config) {
    cfg = config;
    cfg.root.addEventListener("pointerdown", onPointerDown);
  }

  /** Create the floating clone used by both dragging and tap-placement.
      `visible` shows the ghost immediately (tap-placement); during a real
      drag it stays hidden until the movement threshold is crossed. */
  function spawnGhost(cardEl, visible) {
    const originRect = cardEl.getBoundingClientRect();
    const ghost = cardEl.cloneNode(true);
    ghost.classList.add("drag-ghost");
    ghost.classList.remove("is-selected", "is-lifting");
    if (visible) ghost.classList.add("is-active");
    ghost.style.width = originRect.width + "px";
    ghost.style.left = originRect.left + "px";
    ghost.style.top = originRect.top + "px";
    document.body.appendChild(ghost);
    cardEl.classList.add("is-lifting");
    return { ghost, originRect };
  }

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const state = typeof Store !== "undefined" ? Store.get() : null;
    if (state && state.finished) return;

    const cardEl = e.target.closest(".word-card");
    if (!cardEl || cardEl.classList.contains("is-lifting")) return;
    e.preventDefault();

    const { ghost, originRect } = spawnGhost(cardEl);

    drag = {
      cardEl,
      ghost,
      originRect,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      moved: false,
      hoverEl: null
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag.dx = e.clientX - drag.startX;
    drag.dy = e.clientY - drag.startY;

    if (!drag.moved && Math.hypot(drag.dx, drag.dy) > 7) {
      drag.moved = true;
      /* only suppress card hit-testing once this is a real drag — adding
         it on pointerdown would retarget the following click to the deck
         area and instantly clear a tap-selection */
      document.body.classList.add("is-dragging");
      drag.ghost.classList.add("is-active");
      if (typeof Sfx !== "undefined") Sfx.pickup();
      if (cfg.onDragStart) cfg.onDragStart(drag.cardEl);
    }

    if (drag.moved) {
      const tilt = clamp(drag.dx * 0.08, -9, 9);
      drag.ghost.style.transform =
        `translate(${drag.dx}px, ${drag.dy}px) scale(1.07) rotate(${tilt}deg)`;
      updateHover(e.clientX, e.clientY);
    }
  }

  function updateHover(x, y) {
    let hit = null;
    document.querySelectorAll(".foundation").forEach((f) => {
      const r = f.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) hit = f;
    });
    if (hit !== drag.hoverEl) {
      if (drag.hoverEl) drag.hoverEl.classList.remove("drop-hover");
      drag.hoverEl = hit;
      if (hit) hit.classList.add("drop-hover");
    }
  }

  function releaseListeners() {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerCancel);
    document.body.classList.remove("is-dragging");
  }

  function restoreCard(d) {
    d.ghost.remove();
    d.cardEl.classList.remove("is-lifting");
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    releaseListeners();
    const d = drag;
    drag = null;

    if (!d.moved) {
      /* no movement → tap-to-select */
      d.ghost.remove();
      d.cardEl.classList.remove("is-lifting");
      if (cfg.onTap) cfg.onTap(d.cardEl, d.originRect);
      return;
    }

    if (d.hoverEl) {
      d.hoverEl.classList.remove("drop-hover");
      if (cfg.onDrop) {
        cfg.onDrop({
          cardEl: d.cardEl,
          ghost: d.ghost,
          originRect: d.originRect,
          foundationEl: d.hoverEl
        });
      } else {
        restoreCard(d);
      }
    } else {
      /* dropped in the void → spring back home */
      Anim.springBack(d.ghost, d.originRect, () => restoreCard(d));
    }
  }

  function onPointerCancel(e) {
    if (!drag || (e && e.pointerId !== drag.pointerId)) return;
    releaseListeners();
    const d = drag;
    drag = null;
    if (d.hoverEl) d.hoverEl.classList.remove("drop-hover");
    restoreCard(d);
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  return { init, spawnGhost };
})();
