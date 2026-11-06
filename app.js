"use strict";
(() => {
  const LITIR = ["var(--l1)", "var(--n)", "var(--pe-g)", "var(--l2)", "var(--l3)", "var(--aherslu)"];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Íkonar fyrir reitina ("takn" í data/kennarar.js)
  const TAKN = {
    rafmagn: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    suda: '<path d="M3 21l8-8"/><path d="m9.5 11.5 3 3 4-4-3-3z"/><path d="M19 3v2.5M21.5 6H19M20.5 3.5l-1.5 1.5M16 3l.6 1.6M21 9l-1.6-.6"/>',
    mur: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
    kayak: '<path d="M2 15.5c4.5 2.7 15.5 2.7 20 0-4.5-2.2-15.5-2.2-20 0z"/><path d="M6.5 6.5l11 11"/><path d="M3.5 4.8 5 3.3l3 3-1.5 1.5zM16 17.7l1.5-1.5 3 3-1.5 1.5z"/>',
    myndband: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  };
  const takn = (nafn) => `<svg viewBox="0 0 24 24" aria-hidden="true">${TAKN[nafn] || TAKN.myndband}</svg>`;
  const hvert = (slod) => (/youtube\.com|youtu\.be/.test(slod) ? "Spilunarlistar á YouTube ↗" : "Horfa á myndband ▶");

  let i = 0;
  document.getElementById("reitir").innerHTML = window.STRAUMUR.reitir.map((r) => {
    const innihald = `
      <span class="reit-takn">${takn(r.takn)}</span>
      <b>${esc(r.fag)}</b>
      ${r.nafn ? `<span class="reit-nafn">${esc(r.nafn)}</span>` : ""}`;
    if (!r.slod) return `<div class="reitur vaent">${innihald}<span class="merki-vaent">Væntanlegt</span></div>`;
    return `<a class="reitur" href="${esc(r.slod)}" style="--litur:${LITIR[i++ % LITIR.length]}">${innihald}<span class="fj">${hvert(r.slod)}</span></a>`;
  }).join("");
})();
