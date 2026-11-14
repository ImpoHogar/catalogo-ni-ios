# Catálogo infantil ImpoHogar

Mini catálogo de pedido **solo con artículos de niños de perfumería**.
Funciona igual que el catálogo de perfumería (carrito, Excel del pedido,
ZIP de fotos, envío por WhatsApp al vendedor, historial, calculadora,
modo oscuro y reseñas), con colores infantiles. **Abre directo: sin clave
y sin vitrina de entrada.** Arriba tiene una portada con un producto de
cada categoría y la grilla se muestra agrupada por categoría.

Link: `https://impohogar.github.io/catalogo-ni-ios/`

## De dónde salen los productos y las cantidades

- De la **misma tabla `productos` de Supabase** que usa el catálogo de
  perfumería: las existencias son las que sincroniza Interakzion cada
  5 minutos. No hay que actualizar nada a mano.
- Solo se muestran los que tienen **género "Niños"**, foto subida, no
  están ocultos y tienen **existencia mayor a 0**. Los agotados no salen.
- Con el catálogo abierto, las cantidades se vuelven a leer cada 5 minutos.
- Las fotos de productos se toman del catálogo de perfumería publicado
  (`Catalogo-Perfumer-a-Web/img/`): no se duplican. Aquí solo están los logos.

Para agregar un artículo nuevo a este catálogo basta con cargarlo en el
panel administrativo del catálogo de perfumería con género **Niños**.

## Pedidos y vendedores

- Las vendedoras son las del catálogo de bodega (Nevada): Ingrid, Jennifer,
  Lohana y Nicole, con su foto (`img/vendedores/`). Se cambian en
  `js/config.js` (lista `SELLERS_RESPALDO`). Salen al enviar el pedido y en
  la sección "Tus asesoras de ventas" antes del pie de página.
- Cada pedido se guarda en la misma tabla `pedidos` (se ve en el panel →
  Pedidos). El Excel se llama `Pedido_Infantil_...xlsx` y el mensaje de
  WhatsApp dice "...este es mi pedido del catálogo infantil".
- El carrito y el historial de este catálogo **no se mezclan** con los de
  perfumería.

## Archivos

```
index.html          Esqueleto de la página
css/styles.css      Estilos base (copia del de perfumería)
css/ninos.css       Colores y letras del catálogo infantil (se carga al final)
img/logo*.png       Logos de ImpoHogar
img/categorias/     Íconos de las 6 categorías
js/config.js        AJUSTES: categorías y sus colores, textos de la cinta,
                    nombres legibles de las tarjetas (el Excel usa el nombre real)
js/…                Mismo funcionamiento que perfumería, adaptado
```

Categorías (se arman solas por marca y nombre del producto): Perfumes,
Grandeur Tubbees, Estuches, Splash, Cremas y lociones, Tous Kids & Baby.

Al cambiar un archivo, subir el número `?v=` en `index.html` para que no
quede en caché.
