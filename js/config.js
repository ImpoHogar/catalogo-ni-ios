// ============================================================
//  AJUSTES DEL CATALOGO INFANTIL
// ============================================================
//  Mini catalogo de pedido SOLO con articulos de niños de perfumeria.
//  Usa la MISMA base de datos que el catalogo de perfumeria (tabla
//  "productos" de Supabase): las existencias son las mismas, en vivo,
//  y se actualizan solas con la sincronizacion de Interakzion.
//
//  Que productos salen:
//    - genero = "Niños" en la tabla productos
//    - con foto subida (img = true) y no ocultos
//    - con existencia mayor a 0 (los agotados NO se muestran)
//  Para que un articulo nuevo de niños aparezca aqui basta con
//  cargarlo en el panel del catalogo de perfumeria con genero "Niños".
// ============================================================

// Misma base de datos que el catalogo de perfumeria.
const SUPABASE_URL = "https://wzntsmbnsiafebfojaww.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5eCDbAxlk-Q6nreXo0dhgQ_Gjq7pY0s";

// Las fotos de los productos se toman directo del catalogo de
// perfumeria publicado (repositorio Catalogo-Perfumer-a-Web, carpeta
// img/): no se duplica ninguna. Una foto nueva subida alla aparece aqui
// sola.
const IMG_BASE = "https://impohogar.github.io/Catalogo-Perfumer-a-Web/img/";

// Misma version de fotos que el catalogo de perfumeria (js/config.js de
// la raiz). Subirla cuando se reemplacen fotos de productos de niños.
const IMG_VERSION = "20261026";

// Version de los archivos propios de este catalogo (iconos de categoria).
const NINOS_VERSION = "20261114";

// Valor que identifica a los productos de niños en la tabla productos.
const GENERO_NINOS = "Niños";

// Un producto aparece en "Nuevos ingresos" mientras su fecha de ingreso
// este dentro de los ultimos NEW_PRODUCT_DAYS dias.
const NEW_PRODUCT_DAYS = 30;
const MOSTRAR_ETIQUETA_NUEVO = true;

// Cuantos productos se cargan por tanda al hacer scroll / "Cargar mas".
const PAGE_SIZE = 60;

// Cuantos pedidos guarda el historial local de cada cliente.
const ORDER_HISTORY_LIMIT = 20;

// Con fotos publicadas: habilita el ZIP de fotos del pedido.
const HAS_PHOTOS = true;

// Vendedores: igual que en perfumeria, la lista real viene de Supabase
// (tabla ajustes_catalogo, clave "vendedores", editable desde el panel
// administrativo del catalogo de perfumeria). Esto es solo el respaldo
// si no se logra traer.
const SELLERS_RESPALDO = {
  roy: { name: 'Roy Chacón', phone: '50687203737' },
  pedro: { name: 'Pedro Alemán', phone: '50672349212' }
};
let SELLERS = { ...SELLERS_RESPALDO };

// Formulario de opinion: el mismo de perfumeria.
const FEEDBACK_URL = "https://script.google.com/macros/s/AKfycbz8t35NnwV7paVbsrYBPvODUNDDNGiltQgvvjLjFGLW8XjV7-51Fozt6aN5F4N9-SPt/exec";

// Claves propias en el navegador del cliente: el carrito y el historial
// de este catalogo NO se mezclan con los del catalogo de perfumeria.
const LS_CART = 'impohogar_ninos_cart';
const LS_HISTORY = 'impohogar_ninos_order_history';
const LS_THEME = 'impohogar_ninos_theme';

// ============================================================
//  CATEGORIAS DEL CATALOGO INFANTIL
// ============================================================
//  Se arman solas a partir de la marca y el nombre de cada producto.
//  El orden de esta lista es el orden de las tarjetas.
//  Cada icono esta en ninos/img/categorias/<archivo>.
// ============================================================
const CATEGORIAS_NINOS = [
  { nombre: 'Perfumes', icono: 'perfumes.svg', color: '#38BDF8' },
  { nombre: 'Grandeur Tubbees', icono: 'tubbees.svg', color: '#FB923C' },
  { nombre: 'Estuches', icono: 'estuches.svg', color: '#F472B6' },
  { nombre: 'Splash', icono: 'splash.svg', color: '#2DD4BF' },
  { nombre: 'Cremas y lociones', icono: 'cremas.svg', color: '#A78BFA' },
  { nombre: 'Tous Kids & Baby', icono: 'tous.svg', color: '#FBBF24' }
];

function categoriaNinos(p) {
  const nombre = String(p.name || '').toUpperCase();
  const marca = String(p.brand || '').toUpperCase();
  if (marca.includes('TUBBEES')) return 'Grandeur Tubbees';
  if (marca === 'TOUS' || /\bTOUS\b/.test(nombre)) return 'Tous Kids & Baby';
  if (p.tipo === 'Estuche' || /^(EST|ESTUCHE|SET)\b/.test(nombre)) return 'Estuches';
  if (/\bCREMA\b|\bLOTION\b|\bLOCION\b/.test(nombre)) return 'Cremas y lociones';
  if (/\bSPLASH\b|BODY\s?MIST/.test(nombre)) return 'Splash';
  return 'Perfumes';
}

// Color de la categoria de un producto (franja y fondo de la foto).
function colorCategoria(p) {
  const c = CATEGORIAS_NINOS.find(x => x.nombre === categoriaNinos(p));
  return c ? c.color : '#38BDF8';
}

// Nombre mas legible para mostrar en la tarjeta y la ficha (el Excel
// del pedido y el buscador siguen usando el nombre real del sistema).
// "PRF-DISNEY 100ML CARS" -> "Disney 100 ml Cars"
const SIGLAS_NOMBRE = ['EDT', 'EDP', 'EDC', 'LOL', 'PJ', 'DC', 'MGA', 'H', 'M', 'U', 'DL24'];
function nombreBonito(p) {
  let n = String(p.name || '').replace(/\s+/g, ' ').trim();
  n = n.replace(/^PRF-\s*/i, '').replace(/^PERFUMES\s+/i, '').replace(/\bPJMASKS\b/i, 'PJ Masks').replace(/^EST\s+/i, 'Estuche ');
  return n.split(' ').map(w => {
    const up = w.toUpperCase();
    if (/^\d+(?:[.,]\d+)?ML$/.test(up)) return up.replace('ML', ' ml');
    if (up === 'ML') return 'ml';
    if (w === 'Masks') return w;
    if (/\d/.test(w) || SIGLAS_NOMBRE.includes(up)) return up;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

// Texto que se mueve en la cinta de colores de arriba del catalogo.
const CINTA_NINOS = [
  'Perfumes de personajes', 'Estuches de regalo', 'Cremas y lociones',
  'Splash', 'Tous Kids & Baby', 'Grandeur Tubbees', 'Inventario en vivo',
  'Pedido directo a su vendedor'
];
