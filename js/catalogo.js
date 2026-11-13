import {CONFIG} from './config.js';
export async function cargarProductos(){
  // Punto de integración futuro: reemplazar este fetch por consulta a bd_productos
  // filtrada por negocio_id con RLS; nunca usar service_role en el navegador.
  const r=await fetch('./data/productos.json',{cache:'no-store'});
  if(!r.ok)throw new Error('No se pudo cargar el catálogo');
  return r.json();
}
export function categorias(productos){return ['Todos','Destacados',...new Set(productos.map(p=>p.categoria))]}
export function dinero(n){return n===null||n===undefined?'Precio por confirmar':new Intl.NumberFormat('es-MX',{style:'currency',currency:CONFIG.moneda}).format(n)}
export function texto(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
