/* Clever: guía interactiva de perfumes. Sin dependencias. */
const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, html = "") => {
  const n = document.createElement(tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  n.innerHTML = html;
  return n;
};

/* ---------- 1. Evolución en el tiempo ---------- */
const time = $("#time");
const curves = {
  // intensidad (0 a 1) de cada capa según los minutos transcurridos
  salida: (t) => Math.exp(-t / 22),
  corazon: (t) => Math.exp(-Math.pow((t - 95) / 85, 2)),
  fondo: (t) => (1 - Math.exp(-t / 110)) * Math.exp(-Math.max(0, t - 300) / 420),
};
const phases = [
  { until: 15, name: "Domina la salida", color: "var(--citrus)",
    text: "Es la primera impresión: fresca, brillante y con algo de alcohol todavía. Es lo que hueles en la tienda y lo que menos dura, así que no decidas con esto." },
  { until: 45, name: "Transición al corazón", color: "var(--rose)",
    text: "La salida se apaga y aparece el cuerpo del perfume. Si en este punto ya no te gusta, es buena señal para descartarlo." },
  { until: 200, name: "Domina el corazón", color: "var(--rose)",
    text: "Este es el carácter real de la fragancia y lo que la gente a tu alrededor va a percibir durante buena parte del día." },
  { until: 330, name: "Aparece el fondo", color: "var(--amber)",
    text: "Quedan las notas más pesadas, que se mezclan con el olor de tu piel. Por eso un mismo perfume huele distinto en cada persona." },
  { until: 481, name: "Queda el fondo", color: "var(--amber)",
    text: "Es el rastro que se queda en la piel y en la ropa. Si te sigue gustando a esta hora, el perfume es para ti." },
];
const clockText = (t) => {
  if (t === 0) return "Recién aplicado";
  const h = Math.floor(t / 60), m = t % 60;
  if (h === 0) return `${m} minutos después`;
  return `${h} h${m ? ` ${m} min` : ""} después`;
};
function renderTime() {
  const t = +time.value;
  for (const key in curves) {
    const v = curves[key](t);
    const row = document.querySelector(`.layer[data-layer="${key}"]`);
    row.querySelector(".fill").style.width = `${Math.round(v * 100)}%`;
    row.classList.toggle("faint", v < 0.25);
  }
  const p = phases.find((x) => t < x.until);
  $("#clock").textContent = clockText(t);
  $("#phase").textContent = p.name;
  $("#phase").style.color = p.color;
  $("#advice").textContent = p.text;
  time.setAttribute("aria-valuetext", `${clockText(t)}. ${p.name}`);
}
time.addEventListener("input", renderTime);
renderTime();

/* ---------- 2. Familias olfativas ---------- */
const families = [
  { id: "citrica", name: "Cítrica", color: "#d2b42a",
    desc: "Fresca, ligera y limpia. Huele a cáscara de fruta recién cortada. Es la familia más fácil de llevar y también la que menos dura en la piel.",
    notes: ["bergamota", "limón", "mandarina", "toronja", "neroli"],
    when: "Calor, día, oficina, gimnasio", feel: "Energía y limpieza" },
  { id: "floral", name: "Floral", color: "#c2507a",
    desc: "La familia más amplia. Va desde una sola flor hasta ramos complejos, y puede sentirse fresca, empolvada o muy intensa según las flores que use.",
    notes: ["rosa", "jazmín", "azahar", "nardo", "peonía"],
    when: "Primavera, día, ocasiones especiales", feel: "Romántica y elegante" },
  { id: "amaderada", name: "Amaderada", color: "#8a5a3c",
    desc: "Seca, cálida y serena. Huele a madera recién cortada, a lápiz o a bosque. Suele durar bastante y funciona bien en cualquier género.",
    notes: ["sándalo", "cedro", "vetiver", "pachulí", "oud"],
    when: "Otoño, invierno, noche, trabajo formal", feel: "Sobria y segura" },
  { id: "ambarada", name: "Ambarada", color: "#b9791a",
    desc: "También llamada oriental. Es cálida, dulce y envolvente, con resinas y especias. Tiene mucha presencia, así que conviene aplicarla con moderación.",
    notes: ["vainilla", "ámbar", "incienso", "canela", "benjuí"],
    when: "Frío, noche, citas", feel: "Sensual e intensa" },
  { id: "fougere", name: "Fougère", color: "#4f8a6b",
    desc: "El olor clásico de barbería: lavanda sobre un fondo de musgo y haba tonka. Es aromática, limpia y muy común en la perfumería masculina.",
    notes: ["lavanda", "geranio", "musgo de roble", "haba tonka", "romero"],
    when: "Todo el año, día, oficina", feel: "Clásica y pulcra" },
  { id: "chipre", name: "Chipre", color: "#5d6b3a",
    desc: "Contraste entre una salida cítrica y un fondo oscuro de musgo y pachulí. Es sofisticada y algo seria, y suele gustar más a quien ya ha probado varias familias.",
    notes: ["bergamota", "musgo de roble", "pachulí", "ládano", "rosa"],
    when: "Otoño, eventos formales", feel: "Sofisticada y con carácter" },
  { id: "gourmand", name: "Gourmand", color: "#a3522f",
    desc: "Huele a algo que se podría comer: postres, café, caramelo. Es dulce, reconfortante y muy notoria. Si no te gustan los aromas dulces, evítala.",
    notes: ["caramelo", "chocolate", "café", "almendra", "praliné"],
    when: "Invierno, noche, plan casual", feel: "Dulce y acogedora" },
  { id: "acuatica", name: "Acuática", color: "#3f86b0",
    desc: "Recuerda a brisa marina, lluvia o ropa recién lavada. Es discreta y fresca, ideal si buscas oler bien sin que el perfume llame la atención.",
    notes: ["notas marinas", "pepino", "melón", "menta", "almizcle blanco"],
    when: "Verano, día, deporte", feel: "Fresca y discreta" },
];
const familyList = $("#familyList");
const familyPanel = $("#familyPanel");
function showFamily(id, focus) {
  const f = families.find((x) => x.id === id);
  familyList.querySelectorAll("button").forEach((b) => {
    const on = b.dataset.id === id;
    b.setAttribute("aria-selected", on);
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
  });
  familyPanel.style.setProperty("--c", f.color);
  familyPanel.setAttribute("aria-label", `Familia ${f.name}`);
  familyPanel.classList.remove("swap"); void familyPanel.offsetWidth; familyPanel.classList.add("swap");
  familyPanel.innerHTML = `
    <h3>${f.name}</h3>
    <p class="desc">${f.desc}</p>
    <div class="facts">
      <div><h4>Notas típicas</h4><div class="chips">${f.notes.map((n, i) => `<span class="chip" style="--i:${i}">${n}</span>`).join("")}</div></div>
      <div><h4>Cuándo usarla</h4><p>${f.when}</p></div>
      <div><h4>Qué transmite</h4><p>${f.feel}</p></div>
    </div>`;
  if (window.tiendaFamilia) window.tiendaFamilia(f, familyPanel);
}
families.forEach((f) => {
  const b = el("button", { role: "tab", type: "button", "data-id": f.id, style: `--c:${f.color}` },
    f.name);
  b.addEventListener("click", () => showFamily(f.id));
  familyList.append(b);
});
familyList.addEventListener("keydown", (e) => {
  const i = families.findIndex((f) => f.id === document.activeElement.dataset.id);
  if (i < 0) return;
  let j = i;
  if (e.key === "ArrowDown" || e.key === "ArrowRight") j = (i + 1) % families.length;
  else if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = (i - 1 + families.length) % families.length;
  else return;
  e.preventDefault();
  showFamily(families[j].id, true);
});
showFamily("citrica");

/* ---------- 3. Concentración ---------- */
const concs = [
  { id: "edc", abbr: "EDC", full: "Eau de Cologne", pct: "2 a 5 %", hours: "1 a 2 h", level: 12,
    title: "Ligera y pasajera",
    desc: "Refresca más de lo que perfuma. Sirve para después del baño o para reaplicar varias veces en un día caluroso." },
  { id: "edt", abbr: "EDT", full: "Eau de Toilette", pct: "5 a 15 %", hours: "3 a 5 h", level: 32,
    title: "La opción de diario",
    desc: "Buena proyección al inicio y precio más accesible. Es la mejor forma de empezar si es tu primer perfume o lo quieres para el trabajo." },
  { id: "edp", abbr: "EDP", full: "Eau de Parfum", pct: "15 a 20 %", hours: "5 a 8 h", level: 55,
    title: "El equilibrio entre duración y precio",
    desc: "Aguanta una jornada completa con una sola aplicación. Suele sentirse más redonda y menos chispeante que la versión EDT del mismo perfume." },
  { id: "parfum", abbr: "Parfum", full: "Parfum", pct: "20 a 30 %", hours: "8 a 12 h", level: 76,
    title: "Intenso y cercano a la piel",
    desc: "Dura mucho, pero no necesariamente se proyecta más lejos. Bastan una o dos aplicaciones, por lo que el frasco rinde más de lo que parece." },
  { id: "extrait", abbr: "Extrait", full: "Extrait de Parfum", pct: "30 % o más", hours: "12 h o más", level: 94,
    title: "La versión más concentrada",
    desc: "Es densa, costosa y pensada para quien ya conoce bien la fragancia. Pruébala siempre en piel antes de pagar la diferencia." },
];
const concOptions = $("#concOptions");
function showConc(id) {
  const c = concs.find((x) => x.id === id);
  concOptions.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", b.dataset.id === id));
  const cd = $("#concDetail"); cd.classList.remove("swap"); void cd.offsetWidth; cd.classList.add("swap");
  cd.innerHTML = `
    <div><h3>${c.title}</h3><p class="desc">${c.desc}</p></div>
    <div class="stat"><b>${c.pct}</b><span>de aceite perfumado</span></div>
    <div class="stat"><b>${c.hours}</b><span>de duración aproximada en piel</span></div>`;
}
concs.forEach((c) => {
  const b = el("button", { role: "radio", type: "button", "data-id": c.id },
    `<span class="flask" data-level="${c.level / 100}"><img src="img/frasco.png" data-remote="https://d8j0ntlcm91z4.cloudfront.net/user_3MB0KpIVwk9E9CQiXsiAcTypWLk/hf_20261116_060239_d9e37215-f7c4-4661-a974-cf26d92568fe.png" alt="" draggable="false"><span class="liquid"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d=""/></svg></span></span><span class="abbr">${c.abbr}</span><span class="full">${c.full}</span>`);
  b.addEventListener("click", () => showConc(c.id));
  concOptions.append(b);
});
showConc("edp");

/* ---------- 4. Perfil ---------- */
const questions = [
  { q: "¿Qué tipo de perfume buscas?", a: [
    { t: "Masculino", g: "hombre", s: {}, c: 0 },
    { t: "Femenino", g: "mujer", s: {}, c: 0 },
    { t: "Unisex, me da igual", g: "unisex", s: {}, c: 0 },
  ]},
  { q: "¿Para qué momento lo quieres principalmente?", a: [
    { t: "Para el trabajo o la escuela", s: { citrica: 2, fougere: 2, acuatica: 2, floral: 1 }, c: -1 },
    { t: "Para salir de noche", s: { ambarada: 2, gourmand: 2, amaderada: 1, chipre: 1 }, c: 1 },
    { t: "Para hacer deporte o días de calor", s: { acuatica: 3, citrica: 2 }, c: -2 },
    { t: "Para ocasiones especiales", s: { floral: 2, chipre: 2, amaderada: 1, ambarada: 1 }, c: 1 },
  ]},
  { q: "¿Cuál de estos olores te gusta más?", a: [
    { t: "Una naranja recién pelada", s: { citrica: 3, chipre: 1 }, c: 0 },
    { t: "Un ramo de flores frescas", s: { floral: 3 }, c: 0 },
    { t: "Una panadería o una cafetería", s: { gourmand: 3, ambarada: 1 }, c: 0 },
    { t: "Un bosque después de la lluvia", s: { amaderada: 3, chipre: 1, fougere: 1 }, c: 0 },
    { t: "El mar o la ropa limpia", s: { acuatica: 3, fougere: 1 }, c: 0 },
  ]},
  { q: "¿Qué tanto quieres que se note?", a: [
    { t: "Solo quien se acerque a mí", s: { acuatica: 1, citrica: 1 }, c: -1 },
    { t: "Que se perciba sin invadir", s: { floral: 1, fougere: 1, amaderada: 1 }, c: 0 },
    { t: "Que deje rastro al pasar", s: { ambarada: 2, gourmand: 1, chipre: 1 }, c: 2 },
  ]},
  { q: "¿En qué clima lo vas a usar más?", a: [
    { t: "Calor casi todo el año", s: { citrica: 2, acuatica: 2 }, c: -1 },
    { t: "Templado, con algo de todo", s: { floral: 1, fougere: 1, amaderada: 1, chipre: 1 }, c: 0 },
    { t: "Frío buena parte del año", s: { ambarada: 2, gourmand: 2, amaderada: 1 }, c: 1 },
  ]},
];
const quiz = $("#quiz");
let picks = [];
function renderQuiz() {
  const i = picks.length;
  if (i === questions.length) return renderResult();
  const q = questions[i];
  quiz.innerHTML = `
    <div class="quiz-card swap">
      <p class="quiz-step">Pregunta ${i + 1} de ${questions.length}</p>
      <div class="quiz-bar"><i style="width:${(i / questions.length) * 100}%"></i></div>
      <h3>${q.q}</h3>
      <div class="answers">${q.a.map((a, k) => `<button type="button" data-k="${k}">${a.t}</button>`).join("")}</div>
      ${i ? '<button type="button" class="back" id="back">Volver a la pregunta anterior</button>' : ""}
    </div>`;
  quiz.querySelectorAll(".answers button").forEach((b) =>
    b.addEventListener("click", () => { picks.push(+b.dataset.k); renderQuiz(); focusQuiz(); }));
  const back = $("#back");
  if (back) back.addEventListener("click", () => { picks.pop(); renderQuiz(); focusQuiz(); });
}
function focusQuiz() {
  const h = quiz.querySelector("h3");
  h.tabIndex = -1;
  h.focus({ preventScroll: true });
}
function renderResult() {
  const score = {};
  let c = 0;
  picks.forEach((k, i) => {
    const a = questions[i].a[k];
    for (const f in a.s) score[f] = (score[f] || 0) + a.s[f];
    c += a.c;
  });
  const ranked = Object.keys(score).sort((x, y) => score[y] - score[x]);
  const perfil = questions[0].a[picks[0]];
  const main = families.find((f) => f.id === ranked[0]);
  const second = families.find((f) => f.id === ranked[1]);
  const conc = concs.find((x) => x.id === (c <= -3 ? "edc" : c <= 0 ? "edt" : c <= 2 ? "edp" : "parfum"));
  quiz.innerHTML = `
    <div class="quiz-card result swap" style="--c:${main.color}">
      <p class="quiz-step">Tu punto de partida, perfil ${perfil.t.split(",")[0].toLowerCase()}</p>
      <div class="quiz-bar"><i style="width:100%"></i></div>
      <h3>Familia ${main.name.toLowerCase()}</h3>
      <p class="desc">${main.desc}</p>
      <div class="ask">
        <strong>Qué pedir en la tienda</strong>
        Algo de la familia ${main.name.toLowerCase()} en ${conc.full} (${conc.abbr}), con notas como ${main.notes.slice(0, 3).join(", ")}.${second ? ` Si nada te convence, prueba después la familia ${second.name.toLowerCase()}.` : ""}
      </div>
      <div class="actions">
        <button type="button" class="btn" id="seeFamily">Ver la familia ${main.name.toLowerCase()}</button>
        <button type="button" class="btn ghost" id="restart">Repetir el cuestionario</button>
      </div>
    </div>`;
  $("#seeFamily").addEventListener("click", () => {
    showFamily(main.id);
    $("#familias").scrollIntoView();
    familyPanel.focus({ preventScroll: true });
  });
  $("#restart").addEventListener("click", () => { picks = []; renderQuiz(); focusQuiz(); });
  if (window.tiendaSugerir) window.tiendaSugerir(main.id, quiz.querySelector(".quiz-card"), perfil.g);
}
renderQuiz();

/* ---------- 6. Glosario ---------- */
const terms = [
  ["Acorde", "Mezcla de varias notas que juntas se perciben como un solo olor nuevo."],
  ["Nota", "Cada olor identificable dentro de un perfume, como la rosa o la vainilla."],
  ["Pirámide olfativa", "Forma de describir un perfume en tres capas: salida, corazón y fondo."],
  ["Sillage", "La estela que deja el perfume en el aire cuando pasas. Se pronuncia «siyash»."],
  ["Proyección", "Qué tan lejos de tu cuerpo se alcanza a oler el perfume."],
  ["Longevidad", "Cuántas horas permanece el perfume en la piel."],
  ["Fijación", "Capacidad de las notas de fondo para sostener el perfume en la piel."],
  ["Diseñador", "Perfume de una casa de moda o marca comercial, de venta en tiendas departamentales."],
  ["Nicho", "Perfume de una casa dedicada solo a la perfumería, con distribución limitada y precio más alto."],
  ["Flanker", "Variación de un perfume ya existente que conserva el nombre y cambia parte de la fórmula."],
  ["Dupe", "Perfume que imita el olor de otro más caro. La duración y la calidad pueden variar mucho."],
  ["Decant", "Pequeña cantidad de perfume original trasvasada a otro frasco para probarlo sin comprar la botella."],
  ["Tester", "Frasco de prueba de la tienda. A veces se vende sin caja a menor precio."],
  ["Mouillette", "Tira de papel secante para oler un perfume antes de aplicarlo en la piel."],
  ["Maceración", "Tiempo de reposo de la mezcla para que sus ingredientes se integren."],
  ["Reformulación", "Cambio en la fórmula de un perfume ya a la venta. Puede alterar su olor o su duración."],
  ["Unisex", "Perfume que no se dirige a un género. En la práctica, cualquier perfume puede usarlo quien quiera."],
  ["Fatiga olfativa", "Cuando la nariz deja de percibir un olor tras exponerse mucho a él. Por eso dejas de notar tu propio perfume."],
];
const termsEl = $("#terms");
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function renderTerms() {
  const q = norm($("#search").value.trim());
  const hits = terms.filter(([t, d]) => norm(t + " " + d).includes(q));
  termsEl.innerHTML = hits.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("");
  $("#empty").hidden = hits.length > 0;
}
$("#search").addEventListener("input", renderTerms);
renderTerms();

/* ---------- 7. Movimiento ---------- */
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Titular: cada palabra entra por separado
const h1 = document.querySelector(".intro h1");
h1.setAttribute("aria-label", h1.textContent);
h1.innerHTML = h1.textContent.split(" ")
  .map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}">${w}</span>`).join(" ");

// Scroll: barra de avance y desplazamiento del fondo
const root = document.documentElement;
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
    if (!calm) root.style.setProperty("--sy", scrollY.toFixed(0));
    ticking = false;
  });
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Aparición escalonada de cada bloque al entrar en pantalla
const stagger = (sel, kind) => document.querySelectorAll(sel).forEach((n, i) => { n.classList.add("reveal", kind); n.style.setProperty("--i", i); });
const mark = (sel, kind) => document.querySelectorAll(sel).forEach((n) => n.classList.add("reveal", kind));
mark(".block-head", "blur");
mark(".hero-text", "from-left");
mark(".strip", "from-right");
stagger("#familyList button", "from-left");
mark(".family-panel", "from-right");
stagger("#concOptions button", "pop");
mark(".conc-detail", "flip");
mark(".quiz", "zoom");
mark(".search", "from-left");
mark("#terms", "blur");

// Posición de cada sección respecto al centro de la pantalla (de -1 a 1)
const scrubbed = [...document.querySelectorAll(".hero, .block")];
function scrub() {
  if (calm) return;
  const vh = innerHeight;
  scrubbed.forEach((s) => {
    const r = s.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const v = Math.max(-1, Math.min(1, (r.top + Math.min(r.height, vh) / 2 - vh / 2) / vh));
    s.style.setProperty("--v", v.toFixed(3));
  });
}
addEventListener("scroll", () => requestAnimationFrame(scrub), { passive: true });
scrub();
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  document.querySelectorAll(".reveal").forEach((n) => io.observe(n));

  // Resalta en el menú la sección que se está leyendo
  const links = [...document.querySelectorAll(".top nav a")];
  const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("here", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));
} else {
  document.querySelectorAll(".reveal").forEach((n) => n.classList.add("in"));
}

// Demostración opcional del simulador (desactivada: la tabla se queda quieta hasta que la persona mueve el control)
function playDemo() {
  let stop = false;
  ["pointerdown", "keydown", "input"].forEach((ev) => time.addEventListener(ev, () => (stop = true), { once: true }));
  const t0 = performance.now() + 500, dur = 5200;
  (function play(now) {
    if (stop) return;
    const k = Math.min(1, Math.max(0, (now - t0) / dur));
    const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const v = k < 0.7 ? eased / 0.82 : (1 - k) / 0.3;
    time.value = Math.round((Math.min(1, v) * 480) / 5) * 5;
    renderTime();
    if (k < 1) requestAnimationFrame(play); else { time.value = 0; renderTime(); }
  })(performance.now());
}

/* ---------- 8. Entrada: la mano, el frasco y sus notas ---------- */
const layerInfo = {
  salida: { label: "Nota de salida", color: "var(--citrus)" },
  corazon: { label: "Nota de corazón", color: "var(--rose)" },
  fondo: { label: "Nota de fondo", color: "var(--amber)" },
};
const noteData = [
  { id: "bergamota", name: "Bergamota", layer: "salida", x: -152, y: -116,
    desc: "Cítrica y luminosa, con un punto floral y ligeramente amargo. Es el aroma que distingue al té Earl Grey.",
    origin: "Cáscara de un cítrico cultivado sobre todo en Calabria, Italia. Se obtiene por prensado en frío.",
    lasts: "15 a 30 minutos, aprox.", pairs: "Lavanda, jazmín y maderas" },
  { id: "pimienta", name: "Pimienta rosa", layer: "salida", x: 158, y: -116,
    desc: "Especiada pero fresca, con un toque rosado y afrutado. Da chispa sin picar como la pimienta negra.",
    origin: "Bayas del pirul, un árbol originario de Sudamérica y muy común en México.",
    lasts: "20 a 40 minutos, aprox.", pairs: "Rosa, cítricos e incienso" },
  { id: "jazmin", name: "Jazmín", layer: "corazon", x: -146, y: 13,
    desc: "Floral intensa, dulce y envolvente, con un fondo cálido que recuerda a la piel.",
    origin: "Flores recogidas a mano en India, Egipto y Grasse, Francia. Su aroma se extrae con solventes porque no resiste la destilación.",
    lasts: "2 a 4 horas, aprox.", pairs: "Rosa, sándalo y vainilla" },
  { id: "lavanda", name: "Lavanda", layer: "corazon", x: 148, y: 13,
    desc: "Aromática, herbal y limpia, con un matiz dulce. Es la base del olor clásico de barbería.",
    origin: "Espigas en flor destiladas al vapor. La más apreciada proviene de la Provenza, Francia.",
    lasts: "1 a 3 horas, aprox.", pairs: "Bergamota, haba tonka y vainilla" },
  { id: "sandalo", name: "Sándalo", layer: "fondo", x: -148, y: 141,
    desc: "Madera cremosa, suave y casi lechosa. Aporta calidez sin resultar seca.",
    origin: "Madera de un árbol originario de la India. Hoy gran parte se cultiva en Australia.",
    lasts: "6 horas o más", pairs: "Jazmín, rosa y vainilla" },
  { id: "vainilla", name: "Vainilla", layer: "fondo", x: 148, y: 141,
    desc: "Dulce, cálida y reconfortante, con matices de caramelo y un leve toque ahumado.",
    origin: "Vaina curada de una orquídea originaria de México. Hoy Madagascar es el mayor productor.",
    lasts: "6 horas o más", pairs: "Sándalo, lavanda y ámbar" },
];
const rowY = { salida: 0.02, corazon: 0.21, fondo: 0.4 };
const intro = $("#inicio"), stage = $("#stage"), notesEl = $("#notes"), noteInfo = $("#noteInfo");
function showNote(id) {
  const n = noteData.find((x) => x.id === id), L = layerInfo[n.layer];
  notesEl.querySelectorAll(".note").forEach((b) => b.setAttribute("aria-pressed", b.dataset.id === id));
  stage.dataset.layer = n.layer;
  noteInfo.classList.remove("swap"); void noteInfo.offsetWidth; noteInfo.classList.add("swap");
  noteInfo.innerHTML = `
    <p class="layer"><span class="dot" style="--c:${L.color}"></span>${L.label}</p>
    <h3>${n.name}</h3>
    <p class="desc">${n.desc}</p>
    <dl>
      <div><dt>De dónde viene</dt><dd>${n.origin}</dd></div>
      <div><dt>Cuánto dura</dt><dd>${n.lasts}</dd></div>
      <div><dt>Combina con</dt><dd>${n.pairs}</dd></div>
    </dl>`;
}
noteData.forEach((n) => {
  const b = el("button", { type: "button", class: "note", "data-id": n.id, style: `--sx:${n.x < 0 ? -1 : 1};--fy:${rowY[n.layer]}` },
    `<span class="dot" style="--c:${layerInfo[n.layer].color}"></span>${n.name}`);
  b.addEventListener("click", () => showNote(n.id));
  notesEl.append(b);
});
showNote("bergamota");

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
function setScene(p) {
  const e1 = smooth(seg(p, 0, 0.4)), e3 = smooth(seg(p, 0.7, 0.92));
  const s = stage.style;
  s.setProperty("--d", ((1 - e1) * d0).toFixed(1));                 // la mano baja con el frasco y se queda
  s.setProperty("--fo", 1);
  s.setProperty("--s", (1 - seg(p, 0.2, 0.36)).toFixed(3));          // portada: eslogan y marca
  s.setProperty("--k", smooth(seg(p, 0.04, 0.34)).toFixed(4));       // giro de salida de la estrella
  s.setProperty("--a", (seg(p, 0.38, 0.48) * (1 - seg(p, 0.6, 0.7))).toFixed(3)); // "Conoce tu perfume"
  s.setProperty("--e", e3.toFixed(4));                               // aparecen las notas
  s.setProperty("--b", seg(p, 0.74, 0.9).toFixed(3));
  const open = e3 > 0.9;
  stage.classList.toggle("open", open);
  stage.classList.toggle("s-gone", p >= 0.36);
  stage.classList.toggle("gone", p < 0.37 || p >= 0.7);
  notesEl.inert = !open;
}
// Punto de partida: la mano asoma desde arriba, con la base del frasco a un cuarto de la pantalla
let d0 = -400;
function measure() {
  const rig = stage.querySelector(".rig");
  d0 = Math.min(0, innerHeight * 0.3 - (rig.offsetTop + rig.offsetHeight / 2));
}
function introScroll() {
  const r = intro.getBoundingClientRect();
  setScene(clamp01(-r.top / (r.height - innerHeight)));
}
// Las fotos se cargan de la carpeta img/; si aún no están ahí, se usan las originales en línea
document.querySelectorAll("img[data-remote]").forEach((im) => {
  im.addEventListener("error", () => { if (im.src !== im.dataset.remote) im.src = im.dataset.remote; }, { once: true });
  if (im.complete && im.naturalWidth === 0) im.src = im.dataset.remote;
});
if (calm) {
  intro.classList.add("static");
  setScene(1);
  stage.style.setProperty("--s", 1); stage.classList.remove("s-gone");
} else {
  let busy = false;
  const tick = () => { if (busy) return; busy = true; requestAnimationFrame(() => { introScroll(); busy = false; }); };
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", () => { measure(); tick(); });
  measure();
  introScroll();
}
$("#hint").addEventListener("click", () => {
  const top = intro.offsetTop + (intro.offsetHeight - innerHeight) * 0.97;
  scrollTo({ top, behavior: calm ? "auto" : "smooth" });
});

/* ---------- 9. Líquido que se mueve dentro de los frascos al hacer scroll ---------- */
const flasks = [...document.querySelectorAll(".flask")].map((f, i) => ({
  btn: f.closest("button"), path: f.querySelector("path"),
  target: +f.dataset.level, level: 0, phase: i * 1.3,
}));
const slosh = { tilt: 0, vel: 0, lastY: scrollY, lastT: 0, running: false };
function drawLiquid(f, t) {
  const y0 = 100 * (1 - f.level);
  const ripple = Math.min(1.1, Math.abs(slosh.vel) * 1.2 + Math.abs(slosh.tilt) * 5);
  let d = "M0,100";
  for (let x = 0; x <= 100; x += 10) {
    const y = y0 + slosh.tilt * (x - 50) * 0.4 + ripple * Math.sin(x * 0.13 + t * 0.009 + f.phase);
    d += ` L${x},${Math.max(0, Math.min(100, y)).toFixed(2)}`;
  }
  f.path.setAttribute("d", d + " L100,100 Z");
}
function sloshFrame(t) {
  const dt = Math.min(0.033, (t - (slosh.lastT || t)) / 1000) || 0.016;
  slosh.lastT = t;
  // resorte amortiguado: el líquido se inclina con el scroll y vuelve a nivelarse
  slosh.vel += (-55 * slosh.tilt - 7 * slosh.vel) * dt;
  slosh.tilt = Math.max(-0.16, Math.min(0.16, slosh.tilt + slosh.vel * dt));
  let moving = Math.abs(slosh.tilt) > 0.002 || Math.abs(slosh.vel) > 0.01;
  flasks.forEach((f) => {
    const goal = f.btn.classList.contains("in") ? f.target : 0;
    if (Math.abs(goal - f.level) > 0.002) { f.level += (goal - f.level) * 0.07; moving = true; } else f.level = goal;
    drawLiquid(f, t);
  });
  if (moving) requestAnimationFrame(sloshFrame); else { slosh.running = false; slosh.lastT = 0; }
}
function wakeSlosh() { if (!slosh.running) { slosh.running = true; requestAnimationFrame(sloshFrame); } }
if (calm) {
  flasks.forEach((f) => { f.level = f.target; drawLiquid(f, 0); });
} else {
  addEventListener("scroll", () => {
    const dy = scrollY - slosh.lastY; slosh.lastY = scrollY;
    slosh.vel += Math.max(-40, Math.min(40, dy)) * 0.004;
    wakeSlosh();
  }, { passive: true });
  // al aparecer cada frasco se llena hasta su nivel
  new MutationObserver(wakeSlosh).observe($("#concOptions"), { attributes: true, subtree: true, attributeFilter: ["class"] });
  wakeSlosh();
}

/* ---------- 10. Pasos para comprar: avanzan con el scroll ---------- */
const howEl = document.querySelector(".how");
if (howEl) {
  const steps3 = [...howEl.children];
  const howScroll = () => {
    const r = howEl.getBoundingClientRect(), vh = innerHeight;
    const t = calm ? 1 : clamp01((vh * 0.82 - r.top) / (vh * 0.42));
    howEl.style.setProperty("--t", t.toFixed(3));
    steps3.forEach((li, i) => li.classList.toggle("on", t >= (i + 0.5) / steps3.length));
  };
  addEventListener("scroll", () => requestAnimationFrame(howScroll), { passive: true });
  addEventListener("resize", howScroll);
  howScroll();
}
