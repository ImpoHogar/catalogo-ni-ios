// ============================================================
//  CARGA DE PRODUCTOS DESDE SUPABASE (catalogo infantil)
// ============================================================
//  Trae SOLO los productos de niños (genero = "Niños") de la tabla
//  "productos" -- la misma del catalogo de perfumeria, con el stock
//  que sincroniza Interakzion -- y la lista de vendedores de la tabla
//  "ajustes_catalogo". Arma window.PRODUCTS y window.STOCK, llama a
//  buildDerivedData() y avisa con el evento "productos:listos".
//  Si algo falla dispara "productos:error".
// ============================================================

function mapSupabaseRow(row) {
  return {
    id: row.id,
    brand: row.brand,
    code: row.code,
    name: row.name,
    tipo: row.tipo,
    genero: row.genero,
    img: !!row.img,
    notes: [],
    dateAdded: row.date_added || undefined,
    hidden: !!row.hidden,
    stock: row.stock
  };
}

async function fetchProductosNinos() {
  const url = `${SUPABASE_URL}/rest/v1/productos?select=*&genero=eq.${encodeURIComponent(GENERO_NINOS)}&order=id.asc`;
  const resp = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: 'no-store'
  });
  if (!resp.ok) throw new Error('HTTP ' + resp.status + ' al leer productos');
  return resp.json();
}

// Solo se usa la lista de vendedores. Si falla, quedan los de respaldo.
async function fetchVendedores() {
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/ajustes_catalogo?select=clave,valor&clave=eq.vendedores`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!resp.ok) return;
    const rows = await resp.json();
    rows.forEach(row => {
      if (row.clave === 'vendedores' && row.valor && typeof row.valor === 'object' && Object.keys(row.valor).length) {
        SELLERS = row.valor;
      }
    });
  } catch (err) { /* sigue con los vendedores de respaldo */ }
}

async function loadProductsFromSupabase() {
  try {
    const [rows] = await Promise.all([fetchProductosNinos(), fetchVendedores()]);
    window.PRODUCTS = rows.filter(row => !row.eliminado_en).map(mapSupabaseRow);
    window.STOCK = {};
    window.PRODUCTS.forEach(p => { STOCK[p.code] = parseInt(p.stock) || 0; });
    buildDerivedData();
    window.dispatchEvent(new CustomEvent('productos:listos'));
  } catch (err) {
    window.dispatchEvent(new CustomEvent('productos:error', { detail: err }));
  }
}

// Vuelve a leer las existencias cada pocos minutos mientras el catalogo
// esta abierto, para que un cliente que lo deja abierto no pida algo que
// ya se agoto. Solo actualiza los numeros: no re-dibuja todo.
const REFRESCO_STOCK_MS = 5 * 60 * 1000;

async function refrescarExistencias() {
  try {
    const rows = await fetchProductosNinos();
    let cambios = 0;
    rows.forEach(row => {
      const p = window.PRODUCTS_BY_ID && PRODUCTS_BY_ID[row.id];
      if (!p) return;
      const nuevo = parseInt(row.stock) || 0;
      if ((parseInt(p.stock) || 0) !== nuevo) { p.stock = nuevo; STOCK[p.code] = nuevo; cambios++; }
    });
    if (cambios && typeof actualizarExistenciasEnPantalla === 'function') actualizarExistenciasEnPantalla();
  } catch (err) { /* se intenta de nuevo en el proximo ciclo */ }
}

loadProductsFromSupabase();
setInterval(refrescarExistencias, REFRESCO_STOCK_MS);
