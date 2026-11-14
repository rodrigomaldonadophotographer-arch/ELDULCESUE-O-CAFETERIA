/* Barrio Digital: sincronización de cambios en productos desde Supabase.
   No almacena claves privadas, no modifica datos y no interviene en pedidos. */
import { cargarProductos } from './catalogo.js';

const INTERVALO_MS = 20000;
let anterior = null;
let consultando = false;
let cambioPendiente = false;

function huella(productos) {
  return JSON.stringify(productos.map(p => [
    p.supabaseId, p.id, p.nombre, p.categoria, p.descripcion,
    p.precio, p.disponible, p.imagen
  ]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

function sePuedeActualizar() {
  const drawer = document.getElementById('drawer');
  const editando = document.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]');
  return !document.hidden && (!drawer || drawer.hidden) && !editando;
}

async function revisar() {
  if (consultando || document.hidden) return;
  consultando = true;
  try {
    const productos = await cargarProductos();
    const actual = huella(productos);
    if (anterior !== null && anterior !== actual) cambioPendiente = true;
    anterior = actual;
    if (cambioPendiente && sePuedeActualizar()) {
      cambioPendiente = false;
      location.reload(); // app.js vuelve a cargar Supabase y actualiza carrito/precios
    }
  } catch (error) {
    console.warn('No se pudo revisar el catálogo; se reintentará.', error);
  } finally {
    consultando = false;
  }
}

// Primera lectura: establece referencia; la página ya carga el catálogo al iniciar.
window.addEventListener('load', () => {
  revisar();
  setInterval(revisar, INTERVALO_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) revisar();
  });
  window.addEventListener('focus', revisar);
});
