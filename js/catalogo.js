import {CONFIG} from './config.js';
export async function cargarProductos(){
  // Punto de integración futuro: reemplazar este fetch por consulta a bd_productos
  // filtrada por negocio_id con RLS; nunca usar service_role en el navegador.
  const r=await fetch('./data/productos.json',{cache:'no-store'});
  if(!r.ok)throw new Error('No se pudo cargar el catálogo');
  const productos = await r.json();
  const nombresFotos = {
    'Malteada de Oreo': 'malteada-oreo.jpg',
    'Malteada de fresa': 'malteada-fresa.jpg',
    'Frappé de Oreo': 'frappe-oreo.jpg',
    'Frappé de mazapán': 'frappe-mazapan.jpg',
    'Americano': 'cafe-americano.jpg',
    'Capuchino': 'capuchino.jpg',
    'Smoothie de fresa': 'smoothie-fresa.jpg',
    'Pastel de tres leches': 'pastel-tres-leches.jpg',
    'Cheesecake de fresa': 'cheesecake-fresa.jpg',
    'Pay de queso': 'pay-queso.jpg',
    'Cupcakes': 'cupcake.jpg',
    'Galletas de nuez': 'galletas-nuez.jpg'
  };
  const slug = nombre => nombre.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return productos.map(p => ({
    ...p,
    imagen: p.imagen || 'assets/productos/' + (nombresFotos[p.nombre] || slug(p.nombre) + '.jpg')
  }));
}
export function categorias(productos){return ['Todos','Destacados',...new Set(productos.map(p=>p.categoria))]}
export function dinero(n){return n===null||n===undefined?'Precio por confirmar':new Intl.NumberFormat('es-MX',{style:'currency',currency:CONFIG.moneda}).format(n)}
export function texto(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
