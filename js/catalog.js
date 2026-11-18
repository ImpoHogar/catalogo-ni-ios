// ============================================================
//  CUADRICULA DEL CATALOGO
// ============================================================
//  Catalogo infantil: tarjetas, categorias, paginacion y la vista
//  "Nuevos Ingresos".
// ============================================================

let nuevosIngresosMode = false;

let filteredProducts = [];

let renderedCount = 0;

function isProductNew(p) {
  if (!MOSTRAR_ETIQUETA_NUEVO) return false;
  if (!p.dateAdded) return false;
  const added = new Date(p.dateAdded + 'T00:00:00');
  if (isNaN(added.getTime())) return false;
  const diffDays = (Date.now() - added.getTime()) / 86400000;
  return diffDays >= 0 && diffDays <= NEW_PRODUCT_DAYS;
}

// Un producto entra en \"Nuevos Ingresos\" si su fecha de ingreso es reciente.
function isInNuevosIngresosView(p) {
  return isProductNew(p);
}

// Foto del producto (misma regla que antes: webp versionado o marcador)
function productImgSrc(p) {
  return p.img ? `${IMG_BASE}p${p.id}.webp?v=${IMG_VERSION}` : placeholderImg(p.brand);
}

// ============================================================
//  BANNER PRINCIPAL DE NUEVOS INGRESOS
// ============================================================
//  Muestra hasta 10 productos de Nuevos Ingresos, rotando cada pocos segundos. A la izquierda
//  va el texto, a la derecha la foto. El boton activa el mismo modo
//  "Nuevos Ingresos" que ya existia (nuevosIngresosMode).
//  La barra de progreso se puede tocar para saltar a un producto
//  y la rotacion se pausa mientras el mouse esta encima.
// ============================================================
const HERO_INTERVAL_MS = 5000;
let heroNuevosIndex = 0;
let heroNuevosTimer = null;
let heroNuevosTotal = 0;

function pad2(n) { return String(n).padStart(2, '0'); }

function renderHeroNuevos() {
  const hero = document.getElementById('heroNuevos');
  if (!hero) return;

  const nuevos = VISIBLE_PRODUCTS.filter(isInNuevosIngresosView).slice(0, 10);

  stopHeroNuevosTimer();

  if (!nuevos.length) {
    hero.style.display = 'none';
    return;
  }

  hero.style.display = 'grid';
  hero.style.setProperty('--hero-interval', HERO_INTERVAL_MS + 'ms');
  heroNuevosTotal = nuevos.length;

  const track = document.getElementById('heroNuevosTrack');
  const media = document.getElementById('heroNuevosMedia');
  const dots = document.getElementById('heroNuevosDots');

  track.innerHTML = nuevos.map((p, i) => `
    <div class="hero-nuevos-slide${i === 0 ? ' active' : ''}" data-i="${i}" aria-hidden="${i !== 0}">
      <div class="hero-nuevos-brand">${escapeHtml(p.brand)}</div>
      <div class="hero-nuevos-name">${escapeHtml(p.name)}</div>
      ${p.notes && p.notes.length ? `<div class="hero-nuevos-notes">${escapeHtml(p.notes.slice(0, 5).join(' · '))}</div>` : ''}
    </div>`).join('');

  if (media) {
    media.innerHTML = nuevos.map((p, i) => `
      <button type="button" class="hero-media-slide${i === 0 ? ' active' : ''}" data-i="${i}" tabindex="${i === 0 ? 0 : -1}"
              onclick="openLightbox(${p.id}, 0)" aria-label="Ver ficha de ${escapeHtml(p.name)}">
        <img src="${productImgSrc(p)}" alt="${escapeHtml(p.name)}" ${i < 2 ? '' : 'loading="lazy"'}>
      </button>`).join('') + `<span class="hero-media-caption">Clic para ver la ficha</span>`;
  }

  dots.innerHTML = nuevos.length > 1 ? nuevos.map((p, i) =>
    `<button type="button" class="hero-nuevos-dot" data-i="${i}" onclick="goToHeroNuevos(${i})" aria-label="Ver producto ${i + 1} de ${nuevos.length}"></button>`
  ).join('') : '';

  const progress = hero.querySelector('.hero-progress');
  if (progress) progress.style.display = nuevos.length > 1 ? '' : 'none';

  if (!hero.dataset.bound) {
    hero.addEventListener('mouseenter', pauseHeroNuevos);
    hero.addEventListener('mouseleave', resumeHeroNuevos);
    hero.dataset.bound = '1';
  }

  setHeroNuevosSlide(0);
  startHeroNuevosTimer();
}

function setHeroNuevosSlide(i) {
  heroNuevosIndex = i;
  document.querySelectorAll('#heroNuevosTrack .hero-nuevos-slide').forEach((s, k) => {
    s.classList.toggle('active', k === i);
    s.setAttribute('aria-hidden', k !== i);
  });
  document.querySelectorAll('#heroNuevosMedia .hero-media-slide').forEach((s, k) => {
    s.classList.toggle('active', k === i);
    s.tabIndex = k === i ? 0 : -1;
  });
  const dots = document.querySelectorAll('#heroNuevosDots .hero-nuevos-dot');
  dots.forEach((d, k) => {
    d.classList.remove('active');
    d.classList.toggle('done', k < i);
  });
  if (dots[i]) {
    void dots[i].offsetWidth; // reinicia la animacion de la barra
    dots[i].classList.add('active');
  }
  const counter = document.getElementById('heroNuevosCounter');
  if (counter) counter.innerHTML = `<b>${pad2(i + 1)}</b> / ${pad2(heroNuevosTotal)}`;
}

function advanceHeroNuevos(total) {
  if (!total) return;
  setHeroNuevosSlide((heroNuevosIndex + 1) % total);
}

function goToHeroNuevos(i) {
  setHeroNuevosSlide(i);
  startHeroNuevosTimer();
}

function startHeroNuevosTimer() {
  stopHeroNuevosTimer();
  if (heroNuevosTotal > 1) {
    heroNuevosTimer = setInterval(() => advanceHeroNuevos(heroNuevosTotal), HERO_INTERVAL_MS);
  }
}

function stopHeroNuevosTimer() {
  if (heroNuevosTimer) { clearInterval(heroNuevosTimer); heroNuevosTimer = null; }
}

function pauseHeroNuevos() {
  stopHeroNuevosTimer();
  const hero = document.getElementById('heroNuevos');
  if (hero) hero.classList.add('is-paused');
}

function resumeHeroNuevos() {
  const hero = document.getElementById('heroNuevos');
  if (hero) hero.classList.remove('is-paused');
  goToHeroNuevos(heroNuevosIndex);
}

function renderBrandFilter() {
  const sel = document.getElementById('brandFilter');
  BRANDS.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    sel.appendChild(opt);
  });
}

// ============================================================
//  CATEGORIAS DEL CATALOGO INFANTIL
// ============================================================
//  Tarjetas de categoria con su icono y color (ver CATEGORIAS_NINOS
//  en config.js). Seleccion UNICA: tocar otra reemplaza la anterior y
//  tocar la activa la quita. Solo se muestran las categorias que hoy
//  tienen productos disponibles.
// ============================================================
let selectedTipoGenero = new Set();

// Mismo nombre que en perfumeria para que la ficha y la vitrina lo usen.
function getTipoGeneroBucket(p) {
  return categoriaNinos(p);
}

function renderTipoGeneroFilter() {
  const wrap = document.getElementById('categoryTiles');
  if (!wrap) return;
  const counts = {};
  CATEGORIAS_NINOS.forEach(c => counts[c.nombre] = 0);
  VISIBLE_PRODUCTS.forEach(p => { const b = categoriaNinos(p); if (b in counts) counts[b]++; });
  wrap.innerHTML = CATEGORIAS_NINOS.filter(c => counts[c.nombre] > 0).map((c, i) => {
    const activa = selectedTipoGenero.has(c.nombre);
    return `
    <button type="button" class="category-tile${activa ? ' active' : ''}" style="--cat:${c.color}" data-i="${i}" onclick="toggleTipoGenero(this.dataset.cat)" data-cat="${escapeHtml(c.nombre)}" aria-pressed="${activa}"${activa ? ' title="Tocar de nuevo para quitar el filtro"' : ''}>
      <span class="category-tile-media"><img src="img/categorias/${c.icono}?v=${NINOS_VERSION}" alt="" class="category-tile-icon"></span>
      <span class="category-tile-label">${escapeHtml(c.nombre)}</span>
      <span class="category-tile-count">${activa ? '✕' : counts[c.nombre]}</span>
    </button>`;
  }).join('');
}

function toggleTipoGenero(opt) {
  if (selectedTipoGenero.has(opt)) {
    selectedTipoGenero.delete(opt);
  } else {
    selectedTipoGenero.clear();
    selectedTipoGenero.add(opt);
  }
  nuevosIngresosMode = false;
  document.getElementById('nuevosIngresosBanner').style.display = 'none';
  renderTipoGeneroFilter();
  applyFilters();
}

function clearTipoGenero() {
  selectedTipoGenero.clear();
  renderTipoGeneroFilter();
  applyFilters();
}

// ============================================================
//  TARJETA DE PRODUCTO
// ============================================================
//  Orden visual: foto -> marca + stock -> nombre -> notas ->
//  dupe/inspiracion -> codigo de barras -> cantidad a pedir.
// ============================================================
// Precio de la tarjeta (ver js/precios.js).
function precioHTML(p) {
  const pr = precioDe(p);
  return pr
    ? `<div class="price"><b>${colones(pr)}</b><small>c/u</small></div>`
    : `<div class="price is-ask"><b>Precio: consultar</b></div>`;
}

function cardHTML(p) {
  const safeName = escapeHtml(p.name);
  const safeCode = escapeHtml(p.code);
  const safeBrand = escapeHtml(p.brand);
  const imgSrc = productImgSrc(p);
  const esNuevo = isProductNew(p);
  const newBadge = esNuevo ? '<span class="new-badge">NUEVO</span>' : '';
  const stockNum = parseInt(p.stock) || 0;
  const agotado = stockNum <= 0;
  const agotadoBadge = agotado ? '<span class="agotado-badge">AGOTADO</span>' : '';
  const stockLabel = agotado ? 'Agotado' : `${escapeHtml(p.stock)} uds`;
  const initialQty = qtyMap[p.id] || 0;
  const cardClasses = 'card' + (initialQty > 0 ? ' has-qty' : '') + (agotado ? ' agotado' : '') + (esNuevo ? ' new-arrival' : '');
  const qtyControls = agotado
    ? `<span class="lbl">Sin stock disponible</span>`
    : `<span class="lbl">Pedir</span>
          <div class="stepper">
            <button type="button" onclick="changeQty(${p.id},-1)" aria-label="Quitar una unidad">−</button>
            <input type="number" min="0" inputmode="numeric" pattern="[0-9]*" value="${initialQty}" id="qty-${p.id}" onchange="setQty(${p.id}, this.value)" onfocus="this.select()" title="Escribe la cantidad que necesitas" aria-label="Cantidad a pedir de ${safeName}">
            <button type="button" onclick="changeQty(${p.id},1)" aria-label="Agregar una unidad">+</button>
          </div>`;
  const notas = p.notes && p.notes.length
    ? `<p class="notes-line" title="${escapeHtml(p.notes.join(', '))}">${escapeHtml(p.notes.join(' · '))}</p>`
    : '';
  return `
    <article class="${cardClasses}" style="--cat:${colorCategoria(p)}" id="card-${p.id}" data-name="${safeName.toLowerCase()}" data-code="${safeCode}" data-brand="${safeBrand}">
      <div class="photo-wrap" onclick="openLightbox(${p.id}, 0)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLightbox(${p.id}, 0);}" role="button" tabindex="0" aria-label="Ver ficha de ${safeName}">
        ${newBadge}
        ${agotadoBadge}
        <img src="${imgSrc}" alt="${safeName}" loading="lazy" decoding="async">
        <span class="zoom-hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"/></svg></span>
      </div>
      <div class="info">
        <div class="meta"><span class="brand-tag">${escapeHtml(categoriaNinos(p))}</span><span class="stock${agotado ? ' is-out' : ''}">${stockLabel}</span></div>
        <h3 class="name" title="${safeName}">${escapeHtml(nombreBonito(p))}</h3>
        ${precioHTML(p)}
        ${notas}
        ${dupePanelHTML(p.id)}
        <div class="barcode-strip" onclick="openLightbox(${p.id}, 1)" title="Ver código de barras en grande"><svg class="bc-svg" id="bc-${p.id}" data-code="${safeCode}" role="img" aria-label="Código de barras ${safeCode}"></svg></div>
        <div class="qty-row">
          ${qtyControls}
        </div>
      </div>
    </article>`;
}

function renderBarcodes(ids) {
  ids.forEach(id => {
    const el = document.getElementById('bc-' + id);
    if (!el) return;
    const p = PRODUCTS_BY_ID[id];
    try {
      JsBarcode(el, p.code, { format: 'CODE128', displayValue: true, fontSize: 15, textMargin: 2, width: 1.6, height: 44, margin: 4, font: 'monospace' });
    } catch (e) {
      const fallback = document.createElement('div');
      fallback.className = 'barcode-fallback';
      fallback.textContent = p.code;
      if (el.parentNode) el.parentNode.replaceChild(fallback, el);
    }
  });
}

function computeFiltered() {
  const q = document.getElementById('search').value.toLowerCase().trim();
  const brand = document.getElementById('brandFilter').value;
  return VISIBLE_PRODUCTS.filter(p => {
    const matchText = !q || p.name.toLowerCase().includes(q) || p.code.includes(q);
    if (nuevosIngresosMode) {
      return matchText && isInNuevosIngresosView(p);
    }
    const matchBrand = !brand || p.brand === brand;
    const matchCategoria = selectedTipoGenero.size === 0 || selectedTipoGenero.has(categoriaNinos(p));
    return matchText && matchBrand && matchCategoria;
  });
}


// ============================================================
//  ANIMACION DE ENTRADA AL SCROLLEAR (scroll reveal)
// ============================================================
//  Cada tarjeta nueva empieza invisible y se desliza suavemente
//  hacia arriba la primera vez que entra en pantalla al scrollear.
//  Respeta la preferencia de "reducir movimiento" del sistema.
// ============================================================
let revealObserver = null;
function observeRevealCards(elementos) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
  }
  elementos.forEach(el => {
    if (!el.classList.contains('card')) return;
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
}

// Sin busqueda ni filtros, la grilla se muestra agrupada por categoria
// con un titulo de color para cada grupo.
let _ultimaSeccion = null;
function vistaAgrupada() {
  return !nuevosIngresosMode && selectedTipoGenero.size === 0 &&
    !document.getElementById('search').value.trim() && !document.getElementById('brandFilter').value;
}
function seccionHTML(cat) {
  const c = CATEGORIAS_NINOS.find(x => x.nombre === cat) || { color: '#38BDF8', icono: '' };
  const total = filteredProducts.filter(p => categoriaNinos(p) === cat).length;
  return `
    <div class="grid-section" style="--cat:${c.color}">
      ${c.icono ? `<span class="gs-icon"><img src="img/categorias/${c.icono}?v=${NINOS_VERSION}" alt=""></span>` : ''}
      <h3 class="gs-title">${escapeHtml(cat)}</h3>
      <span class="gs-count">${total} ${total === 1 ? 'artículo' : 'artículos'}</span>
      <button type="button" class="gs-filter" data-cat="${escapeHtml(cat)}" onclick="toggleTipoGenero(this.dataset.cat)">Ver solo esta</button>
    </div>`;
}

// ============================================================
//  PORTADA: collage con un producto destacado de cada categoria
//  (el de mas existencia), con el color de su categoria.
// ============================================================
function renderKidsHero() {
  const wrap = document.getElementById('khCollage');
  if (!wrap) return;
  const elegidos = [];
  CATEGORIAS_NINOS.forEach(c => {
    const lista = VISIBLE_PRODUCTS.filter(p => categoriaNinos(p) === c.nombre)
      .sort((a, b) => (parseInt(b.stock) || 0) - (parseInt(a.stock) || 0));
    if (lista.length) elegidos.push({ p: lista[0], c });
  });
  wrap.innerHTML = elegidos.slice(0, 6).map(({ p, c }, i) => `
    <button type="button" class="kh-tile kh-t${i}" style="--cat:${c.color}" onclick="openLightbox(${p.id}, 0)" tabindex="-1">
      <img src="${productImgSrc(p)}" alt="" decoding="async">
      <span class="kh-tile-tag">${escapeHtml(c.nombre)}</span>
    </button>`).join('');
}

function renderPage(reset, sinScroll) {
  const grid = document.getElementById('grid');
  if (reset) {
    grid.innerHTML = '';
    renderedCount = 0;
    if (!sinScroll) {
    // Sube hasta el inicio del catalogo, dejando espacio para el encabezado fijo
    const ancla = document.querySelector('.catalog-head') || grid;
    const header = document.getElementById('siteHeader');
    const offset = (header ? header.offsetHeight : 0) + 12;
    window.scrollTo({ top: ancla.getBoundingClientRect().top + window.scrollY - offset, behavior: 'auto' });
    }

    if (filteredProducts.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Sin resultados</div>
          <div class="empty-state-text">No encontramos productos con esa búsqueda o filtro. Prueba con otro nombre, código o marca.</div>
        </div>`;
    }
  }
  const nextBatch = filteredProducts.slice(renderedCount, renderedCount + PAGE_SIZE);
  const antesDeInsertar = grid.children.length;
  if (reset) _ultimaSeccion = null;
  const agrupar = vistaAgrupada();
  grid.insertAdjacentHTML('beforeend', nextBatch.map(p => {
    let encabezado = '';
    if (agrupar) {
      const cat = categoriaNinos(p);
      if (cat !== _ultimaSeccion) { _ultimaSeccion = cat; encabezado = seccionHTML(cat); }
    }
    return encabezado + cardHTML(p);
  }).join(''));
  renderBarcodes(nextBatch.map(p => p.id));
  observeRevealCards(Array.from(grid.children).slice(antesDeInsertar));
  renderedCount += nextBatch.length;

  const total = filteredProducts.length;
  document.getElementById('count').textContent = total + (total === 1 ? ' producto' : ' productos');

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = renderedCount < total ? '' : 'none';
    loadMoreBtn.textContent = `Cargar más (${total - renderedCount} restantes)`;
  }
  const meta = document.getElementById('loadMoreMeta');
  if (meta) {
    meta.innerHTML = total > PAGE_SIZE
      ? `Mostrando ${renderedCount} de ${total}<span class="lm-bar"><i style="width:${Math.round(renderedCount / total * 100)}%"></i></span>`
      : '';
  }

  // Si el cliente esta buscando algo puntual y ese producto tiene un
  // dupe/inspiracion cargado, se lo mostramos ya abierto, sin que tenga
  // que tocar el boton (tenga o no tenga stock). Fuera de una busqueda
  // (navegando el catalogo normal) el panel se queda como siempre:
  // cerrado hasta que el cliente lo abre.
  const searchQuery = document.getElementById('search').value.trim();
  if (searchQuery && typeof getRelatedProducts === 'function') {
    nextBatch.forEach(p => {
      if (!getRelatedProducts(p.id).length) return;
      const panel = document.getElementById('dupe-panel-' + p.id);
      if (panel) panel.classList.add('open');
    });
  }
}

function showNuevosIngresos() {
  document.getElementById('search').value = '';
  document.getElementById('brandFilter').value = '';
  clearTipoGenero();
  nuevosIngresosMode = true;
  applyFilters();
  document.getElementById('nuevosIngresosBanner').style.display = 'flex';
}

function exitNuevosIngresos() {
  nuevosIngresosMode = false;
  applyFilters();
  document.getElementById('nuevosIngresosBanner').style.display = 'none';
}

function applyFilters() {
  filteredProducts = computeFiltered();
  renderPage(true);
}

// ============================================================
//  EXISTENCIAS EN VIVO
// ============================================================
//  products-loader.js vuelve a leer el stock cada 5 minutos. Si algo
//  cambio, se actualizan las tarjetas que ya estan en pantalla (sin
//  perder lo que el cliente ya escribio). Un producto que se agota
//  mientras el cliente mira queda marcado "Agotado" y se saca de su
//  pedido; al recargar la pagina ya no aparece.
// ============================================================
function actualizarExistenciasEnPantalla() {
  document.querySelectorAll('#grid .card').forEach(card => {
    const id = parseInt(card.id.replace('card-', ''), 10);
    const p = PRODUCTS_BY_ID[id];
    if (!p) return;
    const agotado = (parseInt(p.stock) || 0) <= 0;
    const etiqueta = card.querySelector('.meta .stock');
    if (etiqueta) {
      etiqueta.textContent = agotado ? 'Agotado' : `${p.stock} uds`;
      etiqueta.classList.toggle('is-out', agotado);
    }
    if (agotado && !card.classList.contains('agotado')) {
      if (typeof qtyMap !== 'undefined' && qtyMap[id] && typeof setQty === 'function') setQty(id, 0);
      card.outerHTML = cardHTML(p);
      renderBarcodes([id]);
    }
  });
  renderTipoGeneroFilter();
}
