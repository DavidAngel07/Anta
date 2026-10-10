const LOGIN_URL = "https://anta-eight.vercel.app/login";
const T = {
  es: {
    n1: "Módulos",
    n2: "Procesos",
    n3: "Funciones",
    login: "Iniciar sesión",
    h1: "Controla toda tu curtiembre desde <mark>un solo sistema</mark>",
    sub: "¡Lotes, insumos y costos, claros y fáciles de <u>usar</u>!",
    seeF: "Conoce las funciones",
    note: "Costos por lote y por proceso, al instante",
    mT: "Módulos pensados para tu curtiembre",
    mP: "Cada área de tu operación en un menú claro y ordenado.",
    m2: "Inventario",
    m3: "Calculadora",
    m4: "Lotes",
    m5: "Costos",
    m6: "Productos",
    pT: "Sigue cada lote, etapa por etapa",
    pP: "Desde que llega el cuero hasta que queda en almacén, sabes en qué proceso está cada lote.",
    s1: "Llegada",
    s2: "Sulfurada",
    s3: "Descarnada y dividida",
    s4: "Piquelada",
    s5: "Teñida",
    s6: "En almacén",
    bT: "Gestiónalo desde un solo lugar",
    b1t: "Trazabilidad de lotes",
    b1p: "Consulta proceso, peso, cueros, productos y costo total de cada lote en una sola tabla.",
    b2t: "Costos claros",
    b2p: "Calcula y guarda el costo de cada lote y de cada proceso para decidir con datos.",
    b3t: "Inventario al día",
    b3p: "Insumos, lotes en proceso y cueros terminados en almacén, siempre actualizados.",
    b4t: "Calculadora",
    b4p: "Calcula procesos y costos antes de producir.",
    b5t: "Productos e insumos",
    b5p: "Registra proveedor, cantidad y precio. Edita en segundos.",
    fT: "¿Listo para ordenar tu producción?",
    fP: "Entra a ANTA y ten el control de tus lotes y costos.",
    rights: "Todos los derechos reservados.",
  },
  en: {
    n1: "Modules",
    n2: "Process",
    n3: "Features",
    login: "Log in",
    h1: "Run your entire tannery from <mark>one single system</mark>",
    sub: "Batches, supplies and costs, clear and easy to <u>use</u>!",
    seeF: "See features",
    note: "Batch and process costs, instantly",
    mT: "Modules built for your tannery",
    mP: "Every area of your operation in one clear, organized menu.",
    m2: "Inventory",
    m3: "Calculator",
    m4: "Batches",
    m5: "Costs",
    m6: "Products",
    pT: "Follow every batch, stage by stage",
    pP: "From the moment hides arrive until they reach storage, you know which stage each batch is in.",
    s1: "Arrival",
    s2: "Sulfided",
    s3: "Fleshed & split",
    s4: "Pickled",
    s5: "Dyed",
    s6: "In storage",
    bT: "Manage it all from one place",
    b1t: "Batch traceability",
    b1p: "See process, weight, hides, products and total cost for every batch in a single table.",
    b2t: "Clear costs",
    b2p: "Calculate and save the cost of each batch and each process to decide with data.",
    b3t: "Up-to-date inventory",
    b3p: "Supplies, batches in process and finished hides in storage, always current.",
    b4t: "Calculator",
    b4p: "Calculate processes and costs before you produce.",
    b5t: "Products and supplies",
    b5p: "Record supplier, quantity and price. Edit in seconds.",
    fT: "Ready to organize your production?",
    fP: "Log in to ANTA and take control of your batches and costs.",
    rights: "All rights reserved.",
  },
};
const btn = document.getElementById("lang");
function setLang(l) {
  document.documentElement.lang = l;
  document.querySelectorAll("[data-i]").forEach((e) => {
    e.innerHTML = T[l][e.dataset.i];
  });
  btn.textContent = "🌐 " + (l === "es" ? "EN" : "ES");
  btn.dataset.l = l;
  try {
    localStorage.setItem("anta-lang", l);
  } catch (e) {}
}
btn.onclick = () => setLang(btn.dataset.l === "es" ? "en" : "es");
document.querySelectorAll(".login").forEach((a) => (a.href = LOGIN_URL));
let init = "es";
try {
  init = localStorage.getItem("anta-lang") || "es";
} catch (e) {}
setLang(init);
