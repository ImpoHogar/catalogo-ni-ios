// ============================================================
//  DUPE / INSPIRACION
// ============================================================
//  Cada entrada de DUPE_RELATIONS cubre las dos direcciones: no hace
//  falta repetir la relacion al reves.
// ============================================================

// El catalogo infantil no usa Dupe / Inspiracion: lista vacia.
const DUPE_RELATIONS = [];

function getRelatedProducts(pid) {
  const rels = [];
  DUPE_RELATIONS.forEach(r => {
    if (r.a === pid && PRODUCTS_BY_ID[r.b]) rels.push({ product: PRODUCTS_BY_ID[r.b], tipo: r.tipo });
    else if (r.b === pid && PRODUCTS_BY_ID[r.a]) rels.push({ product: PRODUCTS_BY_ID[r.a], tipo: r.tipo });
  });
  return rels;
}

function dupePanelHTML(pid) {
  const rels = getRelatedProducts(pid);
  if (!rels.length) return '';
  const items = rels.map(r => {
    const rp = r.product;
    const imgSrc = rp.img ? `${IMG_BASE}p${rp.id}.webp?v=${IMG_VERSION}` : placeholderImg(rp.brand);
    const label = r.tipo === 'dupe_confirmado' ? 'Dupe / Inspiración confirmada'
                : r.tipo === 'inspiracion'     ? 'Dupe / Inspiración'
                : 'Perfil similar';
    const stockNum = parseInt(rp.stock) || 0;
    const agotado = stockNum <= 0;
    const qty = qtyMap[rp.id] || 0;
    const qtyControls = agotado
      ? `<span class="dupe-item-agotado">Sin stock</span>`
      : `<button type="button" onclick="event.stopPropagation(); dupeChangeQty(${rp.id}, -1)" aria-label="Quitar una unidad">−</button>
         <input type="number" min="0" inputmode="numeric" pattern="[0-9]*" value="${qty}" id="dupe-qty-${rp.id}"
                onclick="event.stopPropagation()" onfocus="this.select()"
                onchange="event.stopPropagation(); dupeSetQty(${rp.id}, this.value)">
         <button type="button" onclick="event.stopPropagation(); dupeChangeQty(${rp.id}, 1)" aria-label="Agregar una unidad">+</button>`;
    return `<div class="dupe-item">
      <img src="${imgSrc}" alt="" onclick="event.stopPropagation(); jumpToProduct(${rp.id})">
      <div class="dupe-item-text" onclick="event.stopPropagation(); jumpToProduct(${rp.id})" title="Ir a este producto"><div class="dupe-item-brand">${escapeHtml(rp.brand)} · ${label}</div><div class="dupe-item-name">${escapeHtml(rp.name)}</div></div>
      <div class="dupe-item-qty">${qtyControls}</div>
    </div>`;
  }).join('');
  return `
    <button type="button" class="dupe-btn" onclick="event.stopPropagation(); toggleDupePanel(${pid})" aria-controls="dupe-panel-${pid}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/></svg>
      Dupe / Inspiración
      <span class="dupe-count">${rels.length}</span>
      <svg class="dupe-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <div class="dupe-panel" id="dupe-panel-${pid}">
      <div class="dupe-label">Relacionado con:</div>
      ${items}
    </div>`;
}

function dupeSetQty(id, val) {
  setQty(id, val);
  const dInput = document.getElementById('dupe-qty-' + id);
  if (dInput) dInput.value = qtyMap[id] || 0;
}

function dupeChangeQty(id, delta) {
  const newVal = Math.max(0, (qtyMap[id] || 0) + delta);
  dupeSetQty(id, newVal);
}

function toggleDupePanel(pid) {
  const panel = document.getElementById('dupe-panel-' + pid);
  if (panel) panel.classList.toggle('open');
}

function jumpToProduct(pid) {
  const card = document.getElementById('card-' + pid);
  if (!card) { setStatus('Ese producto no está visible con los filtros actuales.', true); return; }
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('dupe-highlight');
  setTimeout(() => card.classList.remove('dupe-highlight'), 1600);
}

// Nota: ya no arma PRODUCTS_BY_ID aca -- eso lo hace buildDerivedData()
// en data.js, una sola vez, apenas llegan los productos de Supabase
// (ver js/products-loader.js). Duplicarlo aca no hace falta y con la
// carga ahora asincrona, PRODUCTS todavia no existiria en este momento.