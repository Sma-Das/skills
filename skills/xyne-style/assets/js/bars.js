// Comparison bars linked to a floating stat card. Bars grow in when scrolled into
// view; hovering, focusing or pressing a bar shows its numbers in the stat card.
//
// Markup (see specimen.html):
//   <div class="xs-bars" data-pending> … <button class="xs-bar" style="--v:88.3"
//        data-label="Field model · accuracy" data-value="88.3" data-unit="%"
//        data-sub="+2.2 pts vs baseline">…</button> … </div>
//   <div class="xs-stat"> <[data-stat=label]> <[data-stat=value]> <[data-stat=sub]> </div>

export function bars(root, stat) {
  const buttons = [...root.querySelectorAll(".xs-bar")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const field = name => stat?.querySelector(`[data-stat="${name}"]`);
  let pinned = buttons.find(b => b.getAttribute("aria-pressed") === "true") || null;
  let counter = 0;

  const io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { root.removeAttribute("data-pending"); io.disconnect(); }
  }, { threshold: 0.35 });
  io.observe(root);

  function countTo(el, to, unit, decimals) {
    cancelAnimationFrame(counter);
    const from = parseFloat(el.textContent) || 0;
    if (reduce.matches || from === to) { el.textContent = to.toFixed(decimals) + unit; return; }
    const start = performance.now(), dur = 420;
    const step = now => {
      const t = Math.min(1, (now - start) / dur), e = 1 - (1 - t) ** 3;
      el.textContent = (from + (to - from) * e).toFixed(decimals) + unit;
      if (t < 1) counter = requestAnimationFrame(step);
    };
    counter = requestAnimationFrame(step);
  }

  function show(button) {
    if (!stat || !button) return;
    const value = Number(button.dataset.value);
    const decimals = (button.dataset.value.split(".")[1] || "").length;
    field("label") && (field("label").textContent = button.dataset.label);
    field("value") && countTo(field("value"), value, button.dataset.unit || "", decimals);
    field("sub") && (field("sub").textContent = button.dataset.sub || "");
  }

  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button === pinned));
    button.addEventListener("pointerenter", () => show(button));
    button.addEventListener("focus", () => show(button));
    button.addEventListener("pointerleave", () => show(pinned));
    button.addEventListener("blur", () => show(pinned));
    button.addEventListener("click", () => {
      pinned = pinned === button ? null : button;
      for (const b of buttons) b.setAttribute("aria-pressed", String(b === pinned));
      show(pinned || button);
    });
  }
  if (pinned) show(pinned);
  return () => io.disconnect();
}
