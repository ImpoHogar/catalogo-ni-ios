// ============================================================
//  ARMADO DE LOS DATOS (catalogo infantil)
// ============================================================
//  Arma PRODUCTS_BY_ID, VISIBLE_PRODUCTS y BRANDS a partir de PRODUCTS.
//  Solo quedan visibles los productos de niños con foto, no ocultos y
//  CON EXISTENCIA: los agotados no se muestran en este catalogo.
//  Se llama UNA VEZ desde products-loader.js.
// ============================================================

function buildDerivedData() {
  window.PRODUCTS_BY_ID = {};
  PRODUCTS.forEach(p => { PRODUCTS_BY_ID[p.id] = p; });

  const orden = CATEGORIAS_NINOS.map(c => c.nombre);

  window.VISIBLE_PRODUCTS = PRODUCTS
    .filter(p => !p.hidden && p.img && (parseInt(p.stock) || 0) > 0)
    .sort((a, b) => {
      const ca = orden.indexOf(categoriaNinos(a));
      const cb = orden.indexOf(categoriaNinos(b));
      if (ca !== cb) return ca - cb;
      return String(a.name).localeCompare(String(b.name), 'es');
    });

  window.BRANDS = [...new Set(VISIBLE_PRODUCTS.map(p => p.brand))].sort();
}
