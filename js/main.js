// ============================================================
//  ARRANQUE
// ============================================================
//  Catalogo infantil. Se ejecuta cuando la pagina termina de cargar
//  y conecta todo.
// ============================================================

// ============================================================
//  CINTA DE COLORES (arriba del catalogo)
// ============================================================
//  Cinta animada con las lineas del catalogo infantil (CINTA_NINOS en
//  config.js). Se duplica una vez para que el loop no tenga corte.
// ============================================================
const CINTA_COLORES = ['#38BDF8', '#FB923C', '#F472B6', '#2DD4BF', '#A78BFA', '#FBBF24'];

function renderBrandMarquee() {
  const track = document.getElementById('brandMarqueeTrack');
  if (!track || typeof CINTA_NINOS === 'undefined') return;
  track.textContent = '';
  const items = CINTA_NINOS.map((texto, i) => {
    const el = document.createElement('span');
    el.className = 'cinta-item';
    el.style.setProperty('--dot', CINTA_COLORES[i % CINTA_COLORES.length]);
    el.textContent = texto;
    return el;
  });
  items.forEach(el => track.appendChild(el));
  items.forEach(el => track.appendChild(el.cloneNode(true)));
}

// ============================================================
//  ENCABEZADO AL HACER SCROLL
// ============================================================
//  Cuando la pagina baja un poco, el encabezado fijo muestra una
//  linea inferior y una sombra suave para separarse del contenido.
// ============================================================
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

// Tecla Escape: cierra la ventana que este abierta (pedido, datos,
// calculadora o historial). No toca los avisos de "gracias" para no
// saltarse los pasos despues de generar un pedido.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const abiertos = {
    orderModal: typeof closeOrderReview === 'function' ? closeOrderReview : null,
    customerModal: typeof closeCustomerModal === 'function' ? closeCustomerModal : null,
    calcModal: typeof closeCalculator === 'function' ? closeCalculator : null,
    historyModal: typeof closeOrderHistory === 'function' ? closeOrderHistory : null
  };
  Object.keys(abiertos).forEach(id => {
    const el = document.getElementById(id);
    if (el && el.classList.contains('open') && abiertos[id]) abiertos[id]();
  });
  const fb = document.getElementById('fbModal');
  if (fb && fb.classList.contains('open') && typeof closeFeedback === 'function') closeFeedback();
});

// ============================================================
//  ARRANQUE DEL CATALOGO (espera productos)
// ============================================================
//  Los productos ahora se traen de Supabase de forma asincrona
//  (js/products-loader.js). El catalogo no puede pintarse hasta que
//  esos datos esten listos, asi que este bloque espera a que se
//  cumplan DOS cosas -- el DOM cargo Y los productos llegaron -- sin
//  importar el orden en que sucedan, antes de armar la pagina.
// ============================================================
let _domReady = false;
let _productsReady = false;

document.addEventListener('DOMContentLoaded', () => {
  _domReady = true;
  tryInitCatalog();
});

window.addEventListener('productos:listos', () => {
  _productsReady = true;
  tryInitCatalog();
});

window.addEventListener('productos:error', (e) => {
  const count = document.getElementById('count');
  if (count) {
    count.textContent = 'No se pudieron cargar los productos. Intenta recargar la página.';
  }
  console.error('Error cargando productos', e.detail);
});

function tryInitCatalog() {
  if (!_domReady || !_productsReady) return;
  initCatalogUI();
}

function initCatalogUI() {
  try {
    initTheme();
    renderBrandFilter();
    renderTipoGeneroFilter();
    restoreCartFromStorage();
    filteredProducts = VISIBLE_PRODUCTS;
    renderPage(true, true);   // al abrir: sin saltar, se ve la portada
    document.getElementById('genBtn').textContent = 'Generar pedido (Excel + fotos)';
    renderBrandMarquee();
    renderHeroNuevos();
    renderKidsHero();
    document.getElementById('search').addEventListener('input', () => applyFilters());
    document.getElementById('brandFilter').addEventListener('change', () => applyFilters());
    document.getElementById('loadMoreBtn').addEventListener('click', () => renderPage(false));
    document.getElementById('genBtn').addEventListener('click', openCustomerModal);
    if (typeof ExcelJS === 'undefined') {
      setStatus('Aviso: librería Excel no cargó.', true);
    }
    const lbImg = document.getElementById('lightboxImg');
    lbImg.addEventListener('click', toggleZoom);
    lbImg.addEventListener('wheel', wheelZoom, { passive: false });
    lbImg.addEventListener('touchstart', touchZoomStart, { passive: false });
    lbImg.addEventListener('touchmove', touchZoomMove, { passive: false });
    lbImg.addEventListener('touchend', touchZoomEnd);
    initHeaderScroll();
  } catch (err) {
    console.error(err);
    document.getElementById('count').textContent = 'No se pudo cargar el catálogo. Intenta recargar la página.';
  }
}