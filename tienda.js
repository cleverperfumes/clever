/* Clever: catálogo y pedido por WhatsApp. Depende de catalogo.js y app.js. */
(() => {
  const items = window.CATALOGO || [];
  const money = (n) => "$" + new Intl.NumberFormat("es-MX").format(n);
  const byId = (id) => items.find((p) => p.id === id);
  const pct = (p) => (p.ref && p.ref > p.precio ? Math.round(((p.ref - p.precio) / p.ref) * 100) : 0);
  // Precio con el descuento frente al precio aproximado en tiendas
  const priceBlock = (p) => {
    const d = pct(p);
    return `<span class="pp"><span class="pp-row">${d ? `<em class="off">-${d}%</em>` : ""}<b class="pprice">${money(p.precio)}</b></span>${d ? `<small class="pref">En tiendas: <s>${money(p.ref)}</s></small>` : ""}</span>`;
  };
  const full = (p) => `${p.marca} ${p.nombre}${p.conc ? " " + p.conc : ""}`;
  const famName = (id) => (families.find((f) => f.id === id) || {}).name || id;
  const famColor = (id) => (families.find((f) => f.id === id) || {}).color || "#888";

  /* ----- Pedido (se guarda en este navegador) ----- */
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem("clever-pedido") || "{}") || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach((id) => { if (!byId(id) || byId(id).agotado) delete cart[id]; });
  const save = () => { try { localStorage.setItem("clever-pedido", JSON.stringify(cart)); } catch (e) {} };
  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const total = () => Object.entries(cart).reduce((a, [id, q]) => a + byId(id).precio * q, 0);
  function setQty(id, q) {
    if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, 9);
    save(); renderAll();
  }

  /* ----- Estado de filtros ----- */
  // En teléfono el catálogo se muestra por partes para no cargar todas las fotos de golpe
  const PAGE = (typeof lite !== "undefined" && lite) ? 8 : 999;
  const state = { g: "mujer", fam: "todas", marca: "todas", orden: "rel", limit: PAGE };
  const grid = $("#pgrid"), famBar = $("#pfams"), marcaSel = $("#pmarca"), ordenSel = $("#porden");

  const addControl = (p) => {
    if (p.agotado) return `<span class="soldout">Agotado</span>`;
    const q = cart[p.id] || 0;
    return q
      ? `<span class="stepper" data-id="${p.id}"><button type="button" data-d="-1" aria-label="Quitar uno de ${full(p)}">−</button><b aria-live="polite">${q}</b><button type="button" data-d="1" aria-label="Agregar otro de ${full(p)}">+</button></span>`
      : `<button type="button" class="btn add" data-add="${p.id}">Agregar al pedido</button>`;
  };

  function visible() {
    let list = items.filter((p) => p.g === state.g);
    if (state.fam !== "todas") list = list.filter((p) => p.familias.includes(state.fam));
    if (state.marca !== "todas") list = list.filter((p) => p.marca === state.marca);
    if (state.orden === "menor") list = [...list].sort((a, b) => a.precio - b.precio);
    if (state.orden === "mayor") list = [...list].sort((a, b) => b.precio - a.precio);
    if (state.orden === "desc") list = [...list].sort((a, b) => pct(b) - pct(a));
    return list;
  }

  function renderFilters() {
    document.querySelectorAll("#pgender button").forEach((b) => {
      const on = b.dataset.g === state.g;
      b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1;
      b.querySelector("small").textContent = items.filter((p) => p.g === b.dataset.g).length;
    });
    const pool = items.filter((p) => p.g === state.g);
    const fams = families.filter((f) => pool.some((p) => p.familias.includes(f.id)));
    if (state.fam !== "todas" && !fams.some((f) => f.id === state.fam)) state.fam = "todas";
    famBar.innerHTML = [{ id: "todas", name: "Todas", color: "#9aa0b8" }, ...fams].map((f) =>
      `<button type="button" class="fchip" style="--c:${f.color}" data-fam="${f.id}" aria-pressed="${state.fam === f.id}">${f.name}</button>`).join("");
    const marcas = [...new Set(pool.map((p) => p.marca))].sort((a, b) => a.localeCompare(b, "es"));
    if (state.marca !== "todas" && !marcas.includes(state.marca)) state.marca = "todas";
    marcaSel.innerHTML = `<option value="todas">Todas las marcas</option>` + marcas.map((m) => `<option${m === state.marca ? " selected" : ""}>${m}</option>`).join("");
    ordenSel.value = state.orden;
  }

  function renderGrid() {
    const all = visible();
    const list = all.slice(0, state.limit);
    const more = $("#pmore"), rest = all.length - list.length;
    more.hidden = rest <= 0;
    more.textContent = `Ver más perfumes (${rest})`;
    $("#pcount").textContent = all.length === 1 ? "1 perfume" : `${all.length} perfumes`;
    $("#pempty").hidden = all.length > 0;
    grid.innerHTML = list.map((p, i) => `
      <article class="pcard${p.agotado ? " out" : ""}" style="--i:${Math.min(i, 11)}">
        <button type="button" class="pcard-open" data-open="${p.id}" aria-label="Ver detalles de ${full(p)}">
          <span class="pimg"><img src="${p.img}" alt="" loading="lazy"></span>
          <span class="pbrand">${p.marca}</span>
          <span class="pname">${p.nombre}${p.conc ? ` <i>${p.conc}</i>` : ""}</span>
          <span class="ptype">${p.tipo}${p.ml ? `, ${p.ml} ml` : ""}</span>
        </button>
        <div class="pfoot">${priceBlock(p)}${addControl(p)}</div>
      </article>`).join("");
  }

  /* ----- Detalle ----- */
  const dlg = $("#pdetail");
  let openId = null;
  function renderDetail() {
    if (!openId) return;
    const p = byId(openId);
    $("#pdetailBody").innerHTML = `
      <div class="dimg"><img src="${p.img}" alt="Frasco de ${full(p)}"></div>
      <div class="dinfo">
        <p class="pbrand">${p.marca}</p>
        <h3>${p.nombre}${p.conc ? ` <i>${p.conc}</i>` : ""}</h3>
        <p class="ptype">${p.tipo}${p.ml ? `, ${p.ml} ml` : ""}</p>
        <p class="dphrase">${p.frase}</p>
        <h4>Notas</h4>
        <div class="chips">${p.notas.map((n) => `<span class="chip">${n}</span>`).join("")}</div>
        ${p.ocasion ? `<h4>Cuándo usarlo</h4><p>${p.ocasion}</p>` : ""}
        <h4>Familia olfativa</h4>
        <div class="chips">${p.familias.map((f) => `<button type="button" class="fchip" style="--c:${famColor(f)}" data-goto-fam="${f}">${famName(f)}</button>`).join("")}</div>
        <div class="dbuy">${priceBlock(p)}${addControl(p)}</div>
      </div>`;
  }
  function openDetail(id) { openId = id; renderDetail(); dlg.showModal(); }

  /* ----- Pedido ----- */
  const cartDlg = $("#pcart"), fab = $("#cartFab");
  function waLink() {
    const lines = Object.entries(cart).map(([id, q]) => `• ${q} × ${full(byId(id))}, ${money(byId(id).precio * q)}`);
    const text = `Hola, quiero hacer este pedido en clever:\n\n${lines.join("\n")}\n\nTotal: ${money(total())} MXN`;
    return `https://wa.me/${window.WHATSAPP}?text=${encodeURIComponent(text)}`;
  }
  function renderCart() {
    const n = count();
    fab.hidden = n === 0;
    fab.querySelector("b").textContent = n;
    fab.querySelector("span").textContent = money(total());
    const ids = Object.keys(cart);
    $("#pcartBody").innerHTML = ids.length ? `
      <ul class="clist">${ids.map((id) => { const p = byId(id); return `
        <li><img src="${p.img}" alt=""><span class="cname"><b>${p.nombre}${p.conc ? " " + p.conc : ""}</b><small>${p.marca}, ${money(p.precio)}</small></span>${addControl(p)}<b class="cline">${money(p.precio * cart[id])}</b></li>`; }).join("")}</ul>
      <p class="ctotal"><span>Total</span><b>${money(total())} MXN</b></p>
      <p class="cnote">El pago y la entrega se acuerdan por WhatsApp. Enviar el pedido abre el chat con el mensaje ya escrito.</p>
      <div class="actions"><a class="btn send" href="${waLink()}" target="_blank" rel="noopener">Enviar pedido por WhatsApp</a><button type="button" class="btn ghost" id="cartClear">Vaciar pedido</button></div>`
      : `<p class="cnote">Tu pedido está vacío. Agrega perfumes desde el catálogo.</p>`;
  }

  function renderAll() { renderGrid(); renderDetail(); renderCart(); refreshSuggest(); }

  /* ----- Eventos (delegados) ----- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-add],[data-open],.stepper button,[data-fam],[data-goto-fam],[data-shop-fam],#cartClear,[data-close]");
    if (!t) return;
    if (t.dataset.add) return setQty(t.dataset.add, 1);
    if (t.dataset.open) return openDetail(t.dataset.open);
    if (t.closest(".stepper")) { const id = t.closest(".stepper").dataset.id; return setQty(id, (cart[id] || 0) + +t.dataset.d); }
    if (t.dataset.fam) { state.fam = t.dataset.fam; state.limit = PAGE; renderFilters(); return renderGrid(); }
    if (t.dataset.gotoFam) { dlg.close(); showFamily(t.dataset.gotoFam); return $("#familias").scrollIntoView(); }
    if (t.dataset.shopFam) return goShop(t.dataset.shopFam, t.dataset.shopG);
    if (t.id === "cartClear") { cart = {}; save(); return renderAll(); }
    if (t.dataset.close !== undefined) t.closest("dialog").close();
  });
  document.querySelectorAll("#pgender button").forEach((b) => b.addEventListener("click", () => { state.g = b.dataset.g; state.limit = PAGE; renderFilters(); renderGrid(); }));
  marcaSel.addEventListener("change", () => { state.marca = marcaSel.value; state.limit = PAGE; renderGrid(); });
  $("#pmore").addEventListener("click", () => { state.limit += PAGE; renderGrid(); });
  ordenSel.addEventListener("change", () => { state.orden = ordenSel.value; renderGrid(); });
  fab.addEventListener("click", () => { renderCart(); cartDlg.showModal(); });
  [dlg, cartDlg].forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
  dlg.addEventListener("close", () => { openId = null; });

  /* ----- Puentes con la guía ----- */
  function goShop(fam, g) {
    const pool = (x) => items.some((p) => p.g === x && p.familias.includes(fam));
    if (g === "hombre" || g === "mujer") state.g = g;
    if (!pool(state.g)) state.g = state.g === "mujer" ? "hombre" : "mujer";
    state.fam = fam; state.marca = "todas"; state.limit = PAGE;
    renderFilters(); renderGrid();
    $("#catalogo").scrollIntoView();
  }
  // En el panel de cada familia: acceso a sus perfumes
  window.tiendaFamilia = (f, panel) => {
    const n = items.filter((p) => p.familias.includes(f.id)).length;
    if (!n) return;
    panel.insertAdjacentHTML("beforeend", `<div class="actions"><button type="button" class="btn" data-shop-fam="${f.id}">Ver ${n === 1 ? "el perfume" : `los ${n} perfumes`} de esta familia</button></div>`);
  };
  // En el resultado del cuestionario: perfumes del catálogo que coinciden
  let suggest = null;
  function refreshSuggest() {
    if (!suggest || !document.body.contains(suggest.box)) return;
    const { fam, box, g } = suggest;
    const rank = (p) => p.familias.indexOf(fam);
    const m = items.filter((p) => !p.agotado && p.familias.includes(fam)).sort((a, b) => rank(a) - rank(b));
    const of = (x, n) => m.filter((p) => p.g === x).slice(0, n);
    let pick = g === "hombre" ? of("hombre", 4) : g === "mujer" ? of("mujer", 4) : [...of("mujer", 2), ...of("hombre", 2)];
    const label = g === "hombre" ? "para hombre" : g === "mujer" ? "para mujer" : "";
    let title = `Perfumes ${label} de esta familia en el catálogo`.replace("  ", " ");
    if (!pick.length && m.length) { pick = m.slice(0, 4); title = `Por ahora no hay perfumes ${label} de esta familia. Estos son los que sí tenemos`; }
    box.innerHTML = pick.length ? `
      <h4>${title}</h4>
      <div class="mini">${pick.map((p) => `
        <div class="minicard"><button type="button" class="pcard-open" data-open="${p.id}" aria-label="Ver detalles de ${full(p)}"><img src="${p.img}" alt=""><span><b>${p.nombre}</b><small>${p.marca}, ${money(p.precio)}${pct(p) ? `, -${pct(p)}%` : ""}</small></span></button>${addControl(p)}</div>`).join("")}</div>
      <div class="actions"><button type="button" class="btn ghost" data-shop-fam="${fam}" data-shop-g="${g || ""}">Ver todos en el catálogo</button></div>` : "";
  }
  window.tiendaSugerir = (fam, card, g) => {
    const box = document.createElement("div"); box.className = "suggest";
    card.querySelector(".ask").after(box);
    suggest = { fam, box, g }; refreshSuggest();
  };

  renderFilters(); renderAll();
  const cur = document.querySelector('#familyList button[aria-selected="true"]');
  if (cur) showFamily(cur.dataset.id);
})();
