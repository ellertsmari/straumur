"use strict";
(() => {
  const D = window.STRAUMUR;
  const FLOKKAR = D.flokkar;
  const FLOKKA_ROD = Object.keys(FLOKKAR);
  const LITIR = ["var(--l1)", "var(--n)", "var(--pe-g)", "var(--l2)", "var(--l3)", "var(--aherslu)"];
  const $ = (s) => document.querySelector(s);

  /* ---------- gögn ---------- */
  // Leit án kommu/broddstafa: „Þéttir“ finnst með „thettir“, „díóða“ með „dioda“.
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ð/g, "d").replace(/þ/g, "th").replace(/æ/g, "ae").replace(/ø/g, "o");

  const kennarar = D.kennarar;
  const listar = [];
  const myndbond = [];
  kennarar.forEach((k, i) => {
    k.litur = LITIR[i % LITIR.length];
    k.upph = k.nafn.split(/\s+/).filter(Boolean).map((o) => o[0]).filter((_, j, a) => j === 0 || j === a.length - 1).join("");
    k.listar.forEach((l) => {
      l.kennari = k;
      l.lykill = k.id + "~" + l.id;
      listar.push(l);
      l.myndbond.forEach((m, j) => {
        m.listi = l;
        m.kennari = k;
        m.j = j;
        m.lykill = m.id || m.skra;
        m.leit = norm([m.title, l.titill, l.lysing, FLOKKAR[l.flokkur], k.nafn].join(" "));
        m.titilLeit = norm(m.title);
        myndbond.push(m);
      });
    });
  });
  const listiEftirLykli = new Map(listar.map((l) => [l.lykill, l]));

  /* ---------- hjálparföll ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const timi = (sek) => {
    const h = Math.floor(sek / 3600), m = Math.floor((sek % 3600) / 60), s = sek % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0");
  };
  const minutur = (sek) => {
    const m = Math.round(sek / 60);
    return m >= 60 ? Math.floor(m / 60) + " klst " + (m % 60) + " mín" : m + " mín";
  };
  // Íslensk eintala/fleirtala: 1, 21, 31 … myndband; annars myndbönd (nema 11)
  const fj = (n, et, ft) => n + " " + (n % 10 === 1 && n % 100 !== 11 ? et : ft);
  const smamynd = (m) => m.mynd || `https://i.ytimg.com/vi/${m.id}/mqdefault.jpg`;
  const lengdOk = (m, f) => !f || (f === "stutt" ? m.sek < 300 : f === "mid" ? m.sek >= 300 && m.sek <= 900 : m.sek > 900);

  // Stutt stofnleit: ef orðið finnst ekki, prófa að skera 1–2 stafi af endanum (díóða → díóð-ur)
  const passar = (texti, ord) => texti.includes(ord) ||
    (ord.length >= 5 && texti.includes(ord.slice(0, -1))) ||
    (ord.length >= 6 && texti.includes(ord.slice(0, -2)));

  /* ---------- skoðað (geymt í vafra nemandans) ---------- */
  const GEYMSLA = "straumur-skodad";
  let skodad = new Map();
  try { skodad = new Map(JSON.parse(localStorage.getItem(GEYMSLA) || "[]")); } catch { /* engin geymsla */ }
  const merkjaSkodad = (m) => {
    skodad.delete(m.lykill);
    skodad.set(m.lykill, Date.now());
    try { localStorage.setItem(GEYMSLA, JSON.stringify([...skodad].slice(-400))); } catch { /* ekkert */ }
  };

  /* ---------- staða (geymd í slóð svo hægt sé að deila og nota „til baka“) ---------- */
  const TOM = { k: "", l: "", q: "", f: "", len: "", rod: "", v: "", fela: "" };
  let st = { ...TOM };
  const lesaSlod = () => {
    const p = new URLSearchParams(location.hash.slice(1));
    st = { ...TOM };
    for (const k of Object.keys(TOM)) st[k] = p.get(k) || "";
  };
  const slodFra = (s) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(s)) if (v) p.set(k, v);
    const t = p.toString();
    return t ? "#" + t : location.pathname + location.search;
  };
  let opnadMedPush = false;
  const fara = (breyt, { ytt = true } = {}) => {
    const nytt = { ...st, ...breyt };
    const varOpid = !!st.v;
    st = nytt;
    if (ytt) history.pushState(null, "", slodFra(st));
    else history.replaceState(null, "", slodFra(st));
    if (st.v && !varOpid) opnadMedPush = ytt;
    teikna();
  };

  /* ---------- síun ---------- */
  const ordIleit = () => norm(st.q).split(/[\s,.;:-]+/).filter(Boolean);
  const valdirKennarar = () => (st.k ? kennarar.filter((k) => k.id === st.k) : kennarar);

  function siadMyndbond({ hunsaFlokk = false } = {}) {
    const ord = ordIleit();
    return myndbond.filter((m) =>
      (!st.k || m.kennari.id === st.k) &&
      (hunsaFlokk || !st.f || m.listi.flokkur === st.f) &&
      lengdOk(m, st.len) &&
      (!st.fela || !skodad.has(m.lykill)) &&
      ord.every((o) => passar(m.leit, o)));
  }

  function radad(listi) {
    const ord = ordIleit();
    const stig = (m) => ord.reduce((s, o) => s + (passar(m.titilLeit, o) ? 2 : 0), 0);
    const efni = (m) => FLOKKA_ROD.indexOf(m.listi.flokkur) * 1e6 + kennarar.indexOf(m.kennari) * 1e5 + listar.indexOf(m.listi) * 1e3 + m.j;
    const r = [...listi];
    if (st.rod === "styst") r.sort((a, b) => a.sek - b.sek);
    else if (st.rod === "lengst") r.sort((a, b) => b.sek - a.sek);
    else if (st.rod === "abc") r.sort((a, b) => a.title.localeCompare(b.title, "is"));
    else if (ord.length) r.sort((a, b) => stig(b) - stig(a) || efni(a) - efni(b));
    else r.sort((a, b) => efni(a) - efni(b));
    return r;
  }

  /* ---------- teikning ---------- */
  function teiknaKennara() {
    const heild = myndbond.length;
    const mappa = (id, nafn, lysing, fjoldi, litur, upph, texti = "#fff") => `
      <button class="mappa" data-k="${esc(id)}" aria-pressed="${st.k === id}" style="--litur:${litur};--upph-texti:${texti}">
        <span class="upph" aria-hidden="true">${esc(upph)}</span>
        <span><b>${esc(nafn)}</b><small>${esc(lysing)}</small><span class="fj">${fj(fjoldi, "myndband", "myndbönd")}</span></span>
      </button>`;
    $("#kennarar").innerHTML =
      mappa("", "Allir kennarar", fj(kennarar.length, "kennari", "kennarar") + " í safninu", heild, "var(--blek)", "∑", "var(--blad)") +
      kennarar.map((k) => mappa(k.id, k.nafn, k.lysing, k.listar.reduce((s, l) => s + l.myndbond.length, 0), k.litur, k.upph)).join("");
  }

  function teiknaFlokka() {
    const grunnur = siadMyndbond({ hunsaFlokk: true });
    const telja = (f) => grunnur.filter((m) => m.listi.flokkur === f).length;
    const til = FLOKKA_ROD.filter((f) => myndbond.some((m) => m.listi.flokkur === f && (!st.k || m.kennari.id === st.k)));
    $("#flokkar").innerHTML =
      `<button class="flogi" data-f="" aria-pressed="${!st.f}">Allt efni <span>${grunnur.length}</span></button>` +
      til.map((f) => {
        const n = telja(f);
        return `<button class="flogi" data-f="${f}" aria-pressed="${st.f === f}" ${n || st.f === f ? "" : "disabled"}>${esc(FLOKKAR[f])} <span>${n}</span></button>`;
      }).join("");
  }

  const spjaldMyndbands = (m, synaKennara) => `
    <button class="spjald" data-v="${esc(m.lykill)}" data-l="${esc(m.listi.lykill)}">
      <span class="smamynd"><img loading="lazy" src="${esc(smamynd(m))}" alt="">
        <span class="lengd">${timi(m.sek)}</span>${skodad.has(m.lykill) ? '<span class="merkt">✓ Skoðað</span>' : ""}</span>
      <span class="spjald-texti"><b>${esc(m.title)}</b>
        <small>${esc(m.listi.titill)}</small>
        ${synaKennara ? `<small class="kenn" style="--litur:${m.kennari.litur}">${esc(m.kennari.nafn)}</small>` : ""}</span>
    </button>`;

  const spjaldLista = (l, synaKennara) => {
    const heild = l.myndbond.reduce((s, m) => s + m.sek, 0);
    const buid = l.myndbond.filter((m) => skodad.has(m.lykill)).length;
    return `
    <button class="spjald" data-listi="${esc(l.lykill)}">
      <span class="smamynd"><img loading="lazy" src="${esc(smamynd(l.myndbond[0]))}" alt="">
        <span class="stafli"><b>${l.myndbond.length}</b><small>${l.myndbond.length % 10 === 1 && l.myndbond.length % 100 !== 11 ? "myndband" : "myndbönd"}</small></span>
        ${buid ? `<span class="merkt">✓ ${buid}/${l.myndbond.length}</span>` : ""}</span>
      <span class="spjald-texti"><b>${esc(l.titill)}</b>
        ${l.lysing ? `<small class="lys">${esc(l.lysing)}</small>` : ""}
        <small class="mono">${minutur(heild)}</small>
        ${synaKennara ? `<small class="kenn" style="--litur:${l.kennari.litur}">${esc(l.kennari.nafn)}</small>` : ""}</span>
    </button>`;
  };

  function teiknaMoppur() {
    const fleiri = !st.k && kennarar.length > 1;
    let html = "";
    // Nýlega skoðað
    const nylegt = [...skodad.keys()].reverse()
      .map((k) => myndbond.find((m) => m.lykill === k && (!st.k || m.kennari.id === st.k)))
      .filter(Boolean).slice(0, 4);
    if (nylegt.length && !st.f) {
      html += `<section class="hluti"><h2 class="hluti-h">Nýlega skoðað <small>Halda áfram</small></h2>
        <div class="net">${nylegt.map((m) => spjaldMyndbands(m, fleiri)).join("")}</div></section>`;
    }
    for (const f of FLOKKA_ROD) {
      if (st.f && st.f !== f) continue;
      const ls = listar.filter((l) => l.flokkur === f && (!st.k || l.kennari.id === st.k));
      if (!ls.length) continue;
      const n = ls.reduce((s, l) => s + l.myndbond.length, 0);
      html += `<section class="hluti"><h2 class="hluti-h">${esc(FLOKKAR[f])} <small>${fj(ls.length, "listi", "listar")} · ${fj(n, "myndband", "myndbönd")}</small></h2>
        <div class="net">${ls.map((l) => spjaldLista(l, fleiri)).join("")}</div></section>`;
    }
    $("#svaedi").innerHTML = html || tomt();
  }

  function teiknaNidurstodur() {
    const r = radad(siadMyndbond());
    const fleiri = !st.k && kennarar.length > 1;
    if (!r.length) { $("#svaedi").innerHTML = tomt(); return; }
    // Spilunarlistar sem passa við leitina
    const ord = ordIleit();
    const ls = ord.length ? listar.filter((l) => (!st.k || l.kennari.id === st.k) && (!st.f || l.flokkur === st.f) &&
      ord.every((o) => passar(norm(l.titill + " " + l.lysing), o))) : [];
    let html = leitarstika(r.length);
    if (ls.length) {
      html += `<section class="hluti"><h2 class="hluti-h">Spilunarlistar <small>${ls.length}</small></h2>
        <div class="net">${ls.map((l) => spjaldLista(l, fleiri)).join("")}</div></section>
        <section class="hluti"><h2 class="hluti-h">Stök myndbönd <small>${r.length}</small></h2>`;
    } else html += `<section class="hluti" style="margin-top:12px">`;
    html += `<div class="net">${r.slice(0, 300).map((m) => spjaldMyndbands(m, fleiri)).join("")}</div></section>`;
    $("#svaedi").innerHTML = html;
  }

  function teiknaLista(l) {
    const heild = l.myndbond.reduce((s, m) => s + m.sek, 0);
    const naestaOskodad = l.myndbond.find((m) => !skodad.has(m.lykill)) || l.myndbond[0];
    const byrjad = l.myndbond.some((m) => skodad.has(m.lykill));
    $("#svaedi").innerHTML = `
      <div class="listahaus">
        <div>
          <button class="hnappur" data-til-baka>‹ Allir listar</button>
        </div>
        <div style="flex:1 1 320px">
          <small class="kenn" style="--litur:${l.kennari.litur}">${esc(l.kennari.nafn)} · ${esc(FLOKKAR[l.flokkur])}</small>
          <h2>${esc(l.titill)}</h2>
          ${l.lysing ? `<p>${esc(l.lysing)}</p>` : ""}
          <p class="mono" style="margin-top:6px">${fj(l.myndbond.length, "myndband", "myndbönd")} · ${minutur(heild)}</p>
        </div>
        <button class="hnappur adal" data-v="${esc(naestaOskodad.lykill)}" data-l="${esc(l.lykill)}">▶ ${byrjad ? "Halda áfram" : "Spila frá byrjun"}</button>
      </div>
      <ol class="rodlisti">${l.myndbond.map((m, i) => `
        <li><button class="rod-atr" data-v="${esc(m.lykill)}" data-l="${esc(l.lykill)}">
          <span class="nr">${i + 1}</span>
          <span class="smamynd"><img loading="lazy" src="${esc(smamynd(m))}" alt="">${skodad.has(m.lykill) ? '<span class="merkt">✓</span>' : ""}<span class="lengd">${timi(m.sek)}</span></span>
          <b>${esc(m.title)}</b>
          <span class="mono lengd-txt">${timi(m.sek)}</span>
        </button></li>`).join("")}</ol>`;
  }

  // Stika efst í niðurstöðum: hvað er verið að leita að/sía eftir og hvernig á að hætta því
  const LENGDIR = { stutt: "Styttri en 5 mín", mid: "5–15 mín", long: "Lengri en 15 mín" };
  const RADANIR = { styst: "Styst fyrst", lengst: "Lengst fyrst", abc: "Stafrófsröð" };
  function leitarstika(n) {
    const siur = [
      st.q && ["q", `Leit: „${st.q}“`],
      st.f && ["f", FLOKKAR[st.f]],
      st.len && ["len", LENGDIR[st.len]],
      st.rod && ["rod", RADANIR[st.rod]],
      st.fela && ["fela", "Skoðuð falin"],
    ].filter(Boolean);
    return `<div class="leitarstika" role="status">
      <div class="ls-texti"><b>${fj(n, "myndband fannst", "myndbönd fundust")}</b>
        <span class="ls-siur">${siur.map(([k, t]) => `<button class="sia" data-af="${k}" aria-label="Fjarlægja: ${esc(t)}">${esc(t)} <span aria-hidden="true">✕</span></button>`).join("")}</span></div>
      <button class="hnappur adal" data-hreinsa>✕ ${st.q ? "Hætta leit" : "Hreinsa síur"} – sýna allt</button>
    </div>`;
  }

  const tomt = () => `${leitarstika(0)}<div class="tomt"><p>Ekkert fannst${st.q ? ` fyrir „${esc(st.q)}“` : ""}. Prófaðu annað orð eða færri síur.</p>
    <button class="hnappur adal" data-hreinsa>Hreinsa leit og síur</button></div>`;

  function teiknaTillogur() {
    const t = $("#tillogur");
    if (st.l && !st.q) { t.innerHTML = ""; return; }
    const ord = ["Ohm", "Díóður", "Þéttir", "Fasvik", "Transistor", "Mótor", "Segulliði", "Síur"];
    const virk = norm(st.q.trim());
    t.innerHTML = `<span class="tl-h">Vinsælar leitir:</span>` + ord.map((o) => {
      const valin = norm(o) === virk;
      return `<button class="tillaga" data-q="${esc(o)}" aria-pressed="${valin}" title="${valin ? "Hætta að leita að" : "Leita að"} „${esc(o)}“">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>${esc(o)}${valin ? ' <span aria-hidden="true">✕</span>' : ""}</button>`;
    }).join("");
  }

  /* ---------- spilari ---------- */
  const dlg = $("#spilari");
  let spilarListi = null, spilarMynd = null;

  function opnaSpilara() {
    const l = listiEftirLykli.get(st.l) || null;
    const m = (l && l.myndbond.find((x) => x.lykill === st.v)) || myndbond.find((x) => x.lykill === st.v);
    if (!m) { lokaSpilaraBeint(); return; }
    const listi = l && l.myndbond.includes(m) ? l : m.listi;
    if (spilarMynd === m && dlg.open) return;
    spilarListi = listi; spilarMynd = m;
    merkjaSkodad(m);
    $("#sp-slod").innerHTML = `<span class="kenn" style="--litur:${m.kennari.litur}">${esc(m.kennari.nafn)}</span> · ${esc(listi.titill)}`;
    $("#sp-titill").textContent = m.title;
    $("#sp-mynd").innerHTML = m.id
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(m.id)}?autoplay=1&rel=0" title="${esc(m.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : `<video src="${esc(m.skra)}" controls autoplay playsinline preload="metadata" poster="${esc(m.mynd || "")}"></video>`;
    const i = listi.myndbond.indexOf(m);
    $("#sp-nr").textContent = `${i + 1} / ${listi.myndbond.length}`;
    $("#sp-fyrra").disabled = i === 0;
    $("#sp-naesta").disabled = i === listi.myndbond.length - 1;
    const yt = $("#sp-yt");
    yt.hidden = !m.id;
    if (m.id) yt.href = `https://www.youtube.com/watch?v=${encodeURIComponent(m.id)}`;
    $("#sp-listi-h").textContent = `${listi.titill} (${listi.myndbond.length})`;
    $("#sp-listi").innerHTML = listi.myndbond.map((x, j) => `
      <li><button data-sp="${esc(x.lykill)}" aria-current="${x === m}">
        <span class="nr">${skodad.has(x.lykill) && x !== m ? '<span class="ok">✓</span>' : j + 1}</span>
        <span>${esc(x.title)}</span><span class="mono">${timi(x.sek)}</span></button></li>`).join("");
    if (!dlg.open) dlg.showModal();
    dlg.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
    // Gögn um skoðað hafa breyst – uppfæra bakgrunn
    teiknaEfni();
  }
  function lokaSpilaraBeint() {
    $("#sp-mynd").innerHTML = "";
    spilarMynd = null;
    if (dlg.open) dlg.close();
  }
  function lokaSpilara() {
    if (opnadMedPush) { opnadMedPush = false; history.back(); }
    else fara({ v: "" }, { ytt: false });
  }
  const skipta = (d) => {
    const i = spilarListi.myndbond.indexOf(spilarMynd) + d;
    const m = spilarListi.myndbond[i];
    if (m) fara({ v: m.lykill, l: spilarListi.lykill }, { ytt: false });
  };

  /* ---------- aðalteikning ---------- */
  function teiknaEfni() {
    const l = st.l && listiEftirLykli.get(st.l);
    const virkarSiur = st.q || st.len || st.rod || st.fela;
    if (l && !st.q) teiknaLista(l);
    else if (virkarSiur) teiknaNidurstodur();
    else teiknaMoppur();
  }
  function teikna() {
    const leit = $("#leit");
    if (document.activeElement !== leit) leit.value = st.q;
    $("#leit-hreinsa").hidden = !leit.value;
    $("#lengd").value = st.len;
    $("#rod").value = st.rod;
    $("#oskodad").checked = !!st.fela;
    teiknaKennara();
    teiknaFlokka();
    teiknaTillogur();
    if (st.v) opnaSpilara(); else { lokaSpilaraBeint(); teiknaEfni(); }
  }

  /* ---------- atburðir ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a[data-heim]");
    if (!t) return;
    if (t.matches("[data-heim]")) { e.preventDefault(); fara({ ...TOM }); scrollTo({ top: 0 }); return; }
    if (t.dataset.k !== undefined) return fara({ k: t.dataset.k, l: "", f: "" });
    if (t.dataset.f !== undefined) return fara({ f: t.dataset.f, l: "" });
    if (t.dataset.listi) { fara({ l: t.dataset.listi, q: "" }); scrollTo({ top: 0 }); return; }
    if (t.dataset.v) return fara({ v: t.dataset.v, l: t.dataset.l || "" });
    if (t.dataset.sp) return fara({ v: t.dataset.sp }, { ytt: false });
    if (t.dataset.q) { fara({ q: norm(t.dataset.q) === norm(st.q.trim()) ? "" : t.dataset.q, l: "" }); return; }
    if (t.dataset.af) return fara({ [t.dataset.af]: "" });
    if (t.id === "leit-hreinsa") { fara({ q: "" }); $("#leit").focus(); return; }
    if (t.hasAttribute("data-til-baka")) return fara({ l: "" });
    if (t.hasAttribute("data-hreinsa")) return fara({ q: "", f: "", len: "", rod: "", fela: "" });
  });

  let bidTimi;
  $("#leit").addEventListener("input", (e) => {
    clearTimeout(bidTimi);
    const q = e.target.value;
    $("#leit-hreinsa").hidden = !q;
    bidTimi = setTimeout(() => fara({ q: q.trim() ? q : "", l: q.trim() ? "" : st.l }, { ytt: false }), 120);
  });
  $("#leit").addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.target.value = ""; fara({ q: "" }, { ytt: false }); }
    if (e.key === "Enter") $("#svaedi").querySelector(".spjald")?.focus();
  });
  $("#lengd").addEventListener("change", (e) => fara({ len: e.target.value }, { ytt: false }));
  $("#rod").addEventListener("change", (e) => fara({ rod: e.target.value }, { ytt: false }));
  $("#oskodad").addEventListener("change", (e) => fara({ fela: e.target.checked ? "1" : "" }, { ytt: false }));

  $("#sp-loka").addEventListener("click", lokaSpilara);
  dlg.addEventListener("cancel", (e) => { e.preventDefault(); lokaSpilara(); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) lokaSpilara(); });
  $("#sp-fyrra").addEventListener("click", () => skipta(-1));
  $("#sp-naesta").addEventListener("click", () => skipta(1));
  $("#sp-afrita").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    const slod = location.origin + location.pathname + slodFra({ ...TOM, v: st.v, l: st.l });
    try { await navigator.clipboard.writeText(slod); b.textContent = "Afritað ✓"; }
    catch { prompt("Afritaðu tengilinn:", slod); }
    setTimeout(() => (b.textContent = "Afrita tengil"), 1800);
  });

  document.addEventListener("keydown", (e) => {
    const iReit = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName);
    if (e.key === "/" && !iReit && !dlg.open) { e.preventDefault(); $("#leit").focus(); }
  });

  addEventListener("popstate", () => { lesaSlod(); opnadMedPush = false; teikna(); });

  lesaSlod();
  teikna();
})();
