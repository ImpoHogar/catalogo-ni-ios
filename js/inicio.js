// ============================================================
//  INICIO
// ============================================================
//  El catalogo infantil abre directo: sin clave y sin vitrina de
//  entrada. Solo se muestra un instante la bienvenida con el logo y
//  luego se desvanece.
// ============================================================
setTimeout(() => {
  const welcome = document.getElementById('welcomeScreen');
  if (!welcome) return;
  welcome.classList.add('fade-out');
  setTimeout(() => { welcome.style.display = 'none'; }, 500);
}, 1400);
