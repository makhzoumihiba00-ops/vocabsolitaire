/* ==========================================================================
   VocabSolitaire — Animation engine
   Prefers GSAP when the CDN script loaded; every call also has a
   Web Animations API (WAAPI) fallback so the game is fully functional
   offline. GSAP presence is checked lazily because the CDN tag is deferred.
   ========================================================================== */

const Anim = (() => {
  const REDUCED = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hasGsap = () => typeof window.gsap !== "undefined";

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* Pin a floating element to its current rendered box so its position
     can be animated with plain left/top/width/height keyframes. */
  function pinBox(el) {
    const r = el.getBoundingClientRect();
    el.style.left = r.left + "px";
    el.style.top = r.top + "px";
    el.style.width = r.width + "px";
    el.style.height = r.height + "px";
    el.style.transform = "none";
    return r;
  }

  /** Staggered deal-in of the freshly rendered word cards. */
  function deal(cards) {
    if (REDUCED) return;
    cards.forEach((el, i) => {
      if (hasGsap()) {
        window.gsap.fromTo(el,
          { y: 46, opacity: 0, rotate: -3 },
          { y: 0, opacity: 1, rotate: 0, duration: 0.5, delay: i * 0.045, ease: "back.out(1.6)", clearProps: "transform" }
        );
      } else {
        el.animate(
          [
            { transform: "translateY(46px) rotate(-3deg)", opacity: 0 },
            { transform: "none", opacity: 1 }
          ],
          { duration: 480, delay: i * 45, easing: "cubic-bezier(0.34,1.56,0.64,1)", fill: "backwards" }
        );
      }
    });
  }

  /** Fly the drag ghost onto the foundation stack and shrink it to chip size. */
  function fly(ghost, targetRect, rotateDeg, done) {
    pinBox(ghost);
    const dur = REDUCED ? 0 : 0.4;

    if (hasGsap()) {
      window.gsap.to(ghost, {
        left: targetRect.left,
        top: targetRect.top,
        width: targetRect.width,
        height: targetRect.height,
        rotate: rotateDeg || 0,
        duration: dur,
        ease: "power3.inOut",
        onComplete: done
      });
    } else {
      const anim = ghost.animate(
        [
          { left: ghost.style.left, top: ghost.style.top, width: ghost.style.width, height: ghost.style.height, transform: "none" },
          { left: targetRect.left + "px", top: targetRect.top + "px", width: targetRect.width + "px", height: targetRect.height + "px", transform: `rotate(${rotateDeg || 0}deg)` }
        ],
        { duration: dur * 1000, easing: "cubic-bezier(0.55,0,0.3,1)", fill: "forwards" }
      );
      anim.onfinish = done;
    }
  }

  /** Elastic spring-back to the card's original position (wrong drop). */
  function springBack(ghost, originRect, done) {
    pinBox(ghost);
    const dur = REDUCED ? 0 : 0.46;

    if (hasGsap()) {
      window.gsap.to(ghost, {
        left: originRect.left,
        top: originRect.top,
        width: originRect.width,
        rotate: 0,
        scale: 1,
        duration: dur,
        ease: "elastic.out(1, 0.55)",
        onComplete: done
      });
    } else {
      const anim = ghost.animate(
        [
          { left: ghost.style.left, top: ghost.style.top, width: ghost.style.width, transform: "rotate(2deg) scale(1.05)" },
          { left: originRect.left + "px", top: originRect.top + "px", width: originRect.width + "px", transform: "none" }
        ],
        { duration: dur * 1000, easing: "cubic-bezier(0.34,1.4,0.5,1)", fill: "forwards" }
      );
      anim.onfinish = done;
    }
  }

  /** Green/red flash on a foundation pile. kind: 'correct' | 'wrong'. */
  function glow(el, kind) {
    const cls = kind === "correct" ? "glow-correct" : "glow-wrong";
    el.classList.remove("glow-correct", "glow-wrong");
    void el.offsetWidth; /* restart the keyframe animation */
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), kind === "correct" ? 760 : 680);
  }

  /** Pop a stat badge or counter (retriggerable). */
  function pop(el) {
    if (!el) return;
    el.classList.remove("stat-pop");
    void el.offsetWidth;
    el.classList.add("stat-pop");
    setTimeout(() => el.classList.remove("stat-pop"), 380);
  }

  /** Remove a card and FLIP-animate its siblings into the gap. */
  function flipRemove(cardEl) {
    const siblings = Array.from(
      cardEl.parentElement.querySelectorAll(".word-card")
    ).filter((c) => c !== cardEl);
    const before = new Map(siblings.map((c) => [c, c.getBoundingClientRect()]));
    cardEl.remove();

    if (REDUCED) return;
    requestAnimationFrame(() => {
      siblings.forEach((c) => {
        const prev = before.get(c);
        const now = c.getBoundingClientRect();
        const dx = prev.left - now.left;
        const dy = prev.top - now.top;
        if (!dx && !dy) return;
        if (hasGsap()) {
          window.gsap.fromTo(c,
            { x: dx, y: dy },
            { x: 0, y: 0, duration: 0.34, ease: "power3.out", clearProps: "transform" }
          );
        } else {
          c.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
            { duration: 340, easing: "cubic-bezier(0.22,0.61,0.36,1)" }
          );
        }
      });
    });
  }

  /** Celebration confetti rain inside the fixed #confetti-layer. */
  function confetti(layer) {
    if (!layer || REDUCED) return;
    const colors = ["#6ee7b7", "#34d399", "#fbbf24", "#f87171", "#f3faf6", "#a78bfa"];
    const total = 90;
    const pieces = [];

    for (let i = 0; i < total; i++) {
      const p = document.createElement("div");
      const size = 6 + Math.random() * 7;
      p.style.cssText = [
        "position:absolute",
        `left:${Math.random() * 100}vw`,
        `top:-4vh`,
        `width:${size}px`,
        `height:${size * (0.5 + Math.random() * 1.1)}px`,
        `background:${colors[i % colors.length]}`,
        "border-radius:2px",
        "opacity:0.9"
      ].join(";");
      layer.appendChild(p);
      pieces.push(p);
    }

    const cleanup = () => pieces.forEach((p) => p.remove());
    setTimeout(cleanup, 5200);

    pieces.forEach((p, i) => {
      const drift = (Math.random() - 0.5) * 260;
      const spin = (Math.random() > 0.5 ? 1 : -1) * (540 + Math.random() * 540);
      const dur = 2400 + Math.random() * 1900;
      const delay = Math.random() * 650;

      if (hasGsap()) {
        window.gsap.fromTo(p,
          { y: 0, x: 0, rotation: 0 },
          { y: "110vh", x: drift, rotation: spin, duration: dur / 1000, delay: delay / 1000, ease: "power1.in", opacity: 0.6, onComplete: () => p.remove() }
        );
      } else if (typeof p.animate === "function") {
        const anim = p.animate(
          [
            { transform: "translate(0, 0) rotate(0deg)", opacity: 0.95 },
            { transform: `translate(${drift}px, 110vh) rotate(${spin}deg)`, opacity: 0.55 }
          ],
          { duration: dur, delay, easing: "cubic-bezier(0.5,0,1,1)" }
        );
        anim.onfinish = () => p.remove();
      } else {
        p.style.animation = `confetti-fall ${dur}ms linear ${delay}ms forwards`;
      }
    });
  }

  return { deal, fly, springBack, glow, pop, flipRemove, confetti };
})();
