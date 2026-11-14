import {CONFIG} from './config.js';
// Catálogo público: solo lectura de productos activos del negocio.
// Los precios y la disponibilidad SIEMPRE vienen de Supabase.
// Nunca colocar service_role o claves secretas en esta aplicación.
export async function cargarProductos(){
  const endpoint = `${CONFIG.supabaseUrl}/rest/v1/bd_productos`;
  const filtros = new URLSearchParams({
    select: 'id,codigo,nombre,categoria,descripcion,precio,disponible,activo,imagen_url',
    negocio_id: `eq.${CONFIG.negocioId}`,
    activo: 'eq.true',
    order: 'codigo.asc'
  });
  const respuesta = await fetch(`${endpoint}?${filtros}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      'Accept': 'application/json'
    }
  });
  if(!respuesta.ok) throw new Error(`Supabase: HTTP ${respuesta.status}. Comprueba RLS y la clave pública.`);
  const filas = await respuesta.json();
  if(!Array.isArray(filas)) throw new Error('Respuesta inesperada del catálogo');
  // El JSON original se utiliza únicamente para conservar el orden,
  // los destacados y los nombres de imágenes locales como respaldo visual.
  // Nunca se usan sus precios o disponibilidad para vender.
  const local = await fetch('./data/productos.json', {cache:'no-store'})
    .then(r => r.ok ? r.json() : [])
    .catch(() => []);
  const indice = new Map(local.map((p,i) => [p.id,{...p,orden:i}]));
  return filas.map(p => {
    const base = indice.get(p.codigo) || {};
    const precio = p.precio === null ? null : Number(p.precio);
    const comprable = Boolean(p.disponible && precio !== null && Number.isFinite(precio) && precio >= 0);
    return {
      id: p.codigo || p.id,
      supabaseId: p.id,
      nombre: p.nombre,
      categoria: p.categoria || 'Otros',
      descripcion: p.descripcion || '',
      precio: precio,
      disponible: comprable,
      destacado: Boolean(base.destacado),
      variantes: [],
      extras: [],
      imagen: p.imagen_url || base.imagen || '',
      orden: base.orden ?? 9999
    };
  }).sort((a,b) => a.orden-b.orden || a.nombre.localeCompare(b.nombre,'es'));
}
export function categorias(productos){return ['Todos','Destacados',...new Set(productos.map(p=>p.categoria))]}
export function dinero(n){return n===null||n===undefined?'Precio por confirmar':new Intl.NumberFormat('es-MX',{style:'currency',currency:CONFIG.moneda}).format(n)}
export function texto(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
