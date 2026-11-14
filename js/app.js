import {promocionVigente} from './promociones.js';
import {CONFIG} from './config.js';
import {cargarProductos,categorias,dinero,texto} from './catalogo.js';
import {leer,guardar} from './storage.js';
let catalogoDisponible=false,productos=[],categoria='Todos',soloFavoritos=false,carrito=leer('carrito',[]),favoritos=leer('favoritos',[]),perfil=leer('perfil',{}),promoTimer=null;
const $=id=>document.getElementById(id);
const mesa=new URLSearchParams(location.search).get('mesa');
const INACTIVIDAD_MS = 30 * 60 * 1000;
let ultimaActividad = Date.now();
let inicioAusencia = null;
let comprobandoRegreso = false;
let revisionPendiente = false;
// Una sesión activa nunca recibe cambios de precio en segundo plano.
for (const evento of ['pointerdown', 'keydown', 'scroll', 'touchstart']) {
  document.addEventListener(evento, () => { ultimaActividad = Date.now(); }, {passive:true});
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) inicioAusencia = Date.now();
  else void comprobarRegreso();
});
window.addEventListener('focus', () => { void comprobarRegreso(); });
async function comprobarRegreso() {
  if (!catalogoDisponible || document.hidden || comprobandoRegreso) return;
  const ahora = Date.now();
  const desde = inicioAusencia ?? ultimaActividad;
  if (ahora - desde < INACTIVIDAD_MS) return;
  inicioAusencia = null;
  ultimaActividad = ahora;
  comprobandoRegreso = true;
  try {
    if (carrito.length) {
      revisionPendiente = true;
      avisar('Antes de enviar tu pedido revisaremos precios y disponibilidad.');
      return;
    }
    const nuevos = await cargarProductos();
    const cambiaron = huellaMenu(nuevos) !== huellaMenu(productos);
    productos = nuevos;
    comprobarNuevaApertura(nuevos);
    render();
    pintarPortada();
    if (cambiaron) await flash();
  } catch (e) {
    console.warn('No fue posible comprobar el menú al regresar.', e);
    avisar('No se pudo actualizar el menú. Comprueba tu conexión.');
  } finally { comprobandoRegreso = false; }
}

// Se compara únicamente al iniciar una nueva carga del menú.
// No hay consultas periódicas ni recargas automáticas durante la visita.
const CLAVE_VERSION_MENU = 'bd_dulce_sueno_catalogo_ultima_apertura_v1';
function huellaMenu(lista) {
  return JSON.stringify(lista.map(p => [
    p.supabaseId, p.id, p.nombre, p.categoria, p.descripcion,
    p.precio, p.disponible, p.imagen
  ]).sort((a,b) => String(a[0]).localeCompare(String(b[0]))));
}
function comprobarNuevaApertura(lista) {
  try {
    const actual = huellaMenu(lista);
    const anterior = localStorage.getItem(CLAVE_VERSION_MENU);
    localStorage.setItem(CLAVE_VERSION_MENU, actual);
    if (anterior !== null && anterior !== actual) {
      setTimeout(() => avisar('Menú actualizado. Revisa los precios y la disponibilidad antes de pedir.'), 700);
    }
  } catch (e) {
    console.warn('No se pudo recordar la última versión del menú', e);
  }
}

function avisar(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>$('toast').classList.remove('show'),3600)}
function abrir(t,html){$('drawerTitle').textContent=t;$('drawerBody').innerHTML=html;$('drawer').hidden=false;$('overlay').hidden=false;document.body.style.overflow='hidden'}
function cerrar(){$('drawer').hidden=true;$('overlay').hidden=true;document.body.style.overflow=''}
function actualizarCarrito(){guardar('carrito',carrito);$('cartCount').textContent=carrito.reduce((n,x)=>n+x.cantidad,0)}
function imagenProducto(p){return p.imagen?`<img src="${texto(p.imagen)}" loading="lazy" alt="${texto(p.nombre)}" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="photo-placeholder" hidden>${texto(p.categoria)}</div>`:`<div class="photo-placeholder">${texto(p.categoria)}</div>`}
function render(){const cats=categorias(productos);$('categories').innerHTML=cats.map(c=>`<button data-cat="${texto(c)}" class="${categoria===c?'active':''}">${texto(c)}</button>`).join('');let q=$('search').value.trim().toLocaleLowerCase('es');const lista=productos.filter(p=>(categoria==='Todos'||(categoria==='Destacados'?p.destacado:p.categoria===categoria))&&(!soloFavoritos||favoritos.includes(p.id))&&p.nombre.toLocaleLowerCase('es').includes(q));$('favoritesFilter').classList.toggle('active',soloFavoritos);$('favoritesFilter').setAttribute('aria-pressed',String(soloFavoritos));$('productGrid').innerHTML=lista.map(p=>`<article class="product-card"><div class="product-photo">${imagenProducto(p)}${!p.disponible?'<span class="soldout">Agotado</span>':''}</div><div class="product-card-body"><span class="product-category">${texto(p.categoria)}</span><h3>${texto(p.nombre)}</h3><div class="product-price">${dinero(p.precio)}</div><div class="product-actions"><button class="button" data-producto="${p.id}" ${!p.disponible?'disabled':''}>${p.disponible?'Ver y agregar':'Agotado'}</button><button class="heart" data-favorito="${p.id}" aria-label="Favorito">${favoritos.includes(p.id)?'♥':'♡'}</button></div></div></article>`).join('')||'<p>No encontramos productos en esta selección.</p>';pintarNavegacionCategorias()}
const fotosCategoria = {'Cafés':'1.jpg','Frappés':'2.jpg','Smoothies':'3.jpg','Malteadas':'4.jpg','Postres':'5.jpg','Cupcakes':'6.jpg','Salados':'7.jpg','Otras bebidas':'8.jpg'};
function pintarPortada(){
 const orden=['Cafés','Frappés','Smoothies','Malteadas','Postres','Cupcakes','Salados','Otras bebidas'];
 const disponibles=new Set(productos.map(p=>p.categoria));
 const nombres=orden.filter(c=>disponibles.has(c));
 // Las categorías sin productos cargados no se anuncian como disponibles.
 $('heroCategories').innerHTML=nombres.map(c=>`<button class="category-tile" data-hero-cat="${texto(c)}"><img src="assets/categorias/${fotosCategoria[c]}" alt="" loading="eager"><span>${texto(c)}</span></button>`).join('');
}
function seleccionarCategoria(c){
 categoria=c;soloFavoritos=false;$('search').value='';render();
 $('menu').scrollIntoView({behavior:'smooth',block:'start'});
}
function pintarNavegacionCategorias(){
 const orden=['Cafés','Frappés','Smoothies','Malteadas','Postres','Otras bebidas'];
 const disponibles=new Set(productos.map(p=>p.categoria));
 const lista=orden.filter(c=>disponibles.has(c));
 const actual=lista.indexOf(categoria);
 const siguiente=actual>=0?lista[(actual+1)%lista.length]:lista[0];
 const nav=$('categoryNext');
 if(!nav)return;
 nav.innerHTML=`<div class="category-next-title">Sigue descubriendo nuestros sabores</div><div class="category-next-actions">${siguiente?`<button type="button" data-next-cat="${texto(siguiente)}" class="next-category-button">Siguiente: ${texto(siguiente)} <span aria-hidden="true">→</span></button>`:''}<button type="button" data-back-categories="1" class="back-categories-button">Ver todas las categorías ↑</button></div>`;
}

function ficha(id){const p=productos.find(x=>x.id===id);if(!p||!p.disponible||p.precio===null){avisar('Producto pendiente de precio o disponibilidad');return;}const variantes=p.variantes||[],extras=p.extras||[];abrir(p.nombre,`<div class="product-photo" style="height:185px">${imagenProducto(p)}</div><p class="muted">${texto(p.categoria)}</p><h2>${texto(p.nombre)}</h2><strong>${dinero(p.precio)}</strong><label>Cantidad</label><input class="field" id="itemQty" type="number" min="1" max="50" value="1"><label>Presentación</label><select class="field" id="itemVariant"><option value="">Normal / sin variante</option>${variantes.map(v=>`<option value="${texto(v.nombre)}">${texto(v.nombre)} · ${dinero(v.precio)}</option>`).join('')}</select><label>Extras</label>${extras.length?extras.map((e,i)=>`<label class="checkline"><input type="checkbox" data-extra="${i}">${texto(e.nombre)} · ${dinero(e.precio)}</label>`).join(''):'<p class="muted">No hay extras con precio configurado.</p>'}<label>Indicaciones especiales</label><textarea class="field" id="itemNotes" rows="2" placeholder="Ej. sin hielo, sin azúcar…"></textarea><button class="button" id="addItem">Agregar al carrito</button><p class="muted">Las variantes y extras solo aparecerán con precios confirmados por el negocio.</p>`);$('addItem').onclick=()=>{let qty=Math.floor(Number($('itemQty').value));if(!Number.isFinite(qty)||qty<1||qty>50){avisar('Elige una cantidad entre 1 y 50');return}let v=variantes.find(x=>x.nombre===$('itemVariant').value);let sel=extras.filter((_,i)=>$('drawerBody').querySelector(`[data-extra="${i}"]`)?.checked);let unit=v?.precio??p.precio;if(unit!==null)unit+=sel.reduce((s,e)=>s+e.precio,0);carrito.push({clave:crypto.randomUUID?.()||String(Date.now()+Math.random()),id:p.id,nombre:p.nombre,cantidad:qty,precio:unit,variante:v?.nombre||'',extras:sel.map(e=>e.nombre),notas:$('itemNotes').value.trim()});actualizarCarrito();cerrar();avisar('Producto agregado al carrito')}}
function renderCarrito(){const subtotal=carrito.reduce((s,x)=>s+(x.precio??0)*x.cantidad,0),sinPrecio=carrito.some(x=>x.precio===null);abrir('Tu carrito',carrito.length?`${mesa?`<div class="note"><b>Mesa ${texto(mesa)}</b>. Los pedidos directos a caja se habilitarán cuando conectemos el Centro de Ventas y Caja.</div>`:''}${carrito.map((x,i)=>`<div class="line"><div class="line-row"><strong>${texto(x.nombre)}</strong><button data-eliminar="${i}" aria-label="Eliminar producto">Quitar</button></div><p class="muted">${texto([x.variante,...x.extras,x.notas].filter(Boolean).join(' · ')||'Sin indicaciones')}</p><div class="line-row"><div class="qty"><button data-menos="${i}">−</button><b>${x.cantidad}</b><button data-mas="${i}">+</button></div><b>${x.precio===null?'Por confirmar':dinero(x.precio*x.cantidad)}</b></div></div>`).join('')}<h2>Subtotal conocido: ${dinero(subtotal)}</h2>${sinPrecio?'<p class="note">Hay productos sin precio confirmado. El total definitivo se acuerda con el negocio.</p>':''}${mesa?'<p class="note">Envío a Mesa pendiente de conexión. No se ha registrado ningún pedido en caja.</p><button class="button" disabled>Enviar pedido a Mesa ${texto(mesa)} · Próximamente</button>':`<label>¿Cómo recibirás tu pedido?</label><select id="orderType" class="field"><option value="recoger">Recoger en cafetería</option><option value="domicilio">Servicio a domicilio</option></select><div id="orderProfile"></div><button class="button" id="sendOrder">Preparar pedido para WhatsApp</button><p class="muted">La venta se confirma con la cafetería. No se cobra ni se registra en caja desde este menú.</p>`}`:'<p>Tu carrito está vacío. Explora el menú y agrega tus favoritos.</p>');$('drawerBody').querySelectorAll('[data-mas]').forEach(b=>b.onclick=()=>{carrito[+b.dataset.mas].cantidad++;actualizarCarrito();renderCarrito()});$('drawerBody').querySelectorAll('[data-menos]').forEach(b=>b.onclick=()=>{const i=+b.dataset.menos;carrito[i].cantidad--;if(!carrito[i].cantidad)carrito.splice(i,1);actualizarCarrito();renderCarrito()});$('drawerBody').querySelectorAll('[data-eliminar]').forEach(b=>b.onclick=()=>{carrito.splice(+b.dataset.eliminar,1);actualizarCarrito();renderCarrito()});if(!mesa&&carrito.length){$('orderType').onchange=renderPerfilPedido;renderPerfilPedido();$('sendOrder').onclick=enviarWhatsApp}}
function renderPerfilPedido(){const domicilio=$('orderType').value==='domicilio';$('orderProfile').innerHTML=`${perfil.nombre?`<div class="profile-saved">Cliente: <b>${texto(perfil.nombre)}</b> · ${texto(perfil.telefono||'Sin teléfono')}<br><small>Confirma o modifica tus datos antes de enviar.</small></div>`:''}<label>Nombre del cliente</label><input id="orderName" class="field" value="${texto(perfil.nombre||'')}" placeholder="Tu nombre"><label>Celular</label><input id="orderPhone" class="field" type="tel" inputmode="tel" value="${texto(perfil.telefono||'')}" placeholder="10 dígitos">${domicilio?`<label>Dirección de entrega</label><textarea id="orderAddress" class="field" rows="2">${texto(perfil.domicilio||'')}</textarea>`:''}<label>Indicaciones del pedido</label><textarea id="orderNotes" class="field" rows="2" placeholder="Hora aproximada, referencias…"></textarea><label class="checkline"><input type="checkbox" id="saveInfo" checked>Recordar mis datos en este dispositivo</label>`}
async function enviarWhatsApp(){
  if(!catalogoDisponible){avisar('No se pudo verificar el catálogo en línea');return;}
  const boton=$('sendOrder');
  if(boton?.disabled)return;
  const nombre=$('orderName').value.trim(),tel=$('orderPhone').value.trim(),tipo=$('orderType').value,
    dir=$('orderAddress')?.value.trim()||'',notas=$('orderNotes').value.trim(),recordar=$('saveInfo').checked;
  if(!nombre||!/\d{10}$/.test(tel.replace(/\D/g,''))){avisar('Escribe tu nombre y celular de 10 dígitos');return}
  if(tipo==='domicilio'&&!dir){avisar('Escribe la dirección de entrega');return}
  boton.disabled=true;boton.textContent='Verificando pedido…';
  let actuales;
  try { actuales=await cargarProductos(); }
  catch(e){console.warn('Verificación final de pedido fallida',e);avisar('No hay conexión para verificar precios. Intenta de nuevo.');boton.disabled=false;boton.textContent='Preparar pedido para WhatsApp';return;}
  const vigentes=new Map(actuales.map(p=>[p.id,p]));
  const cambios=carrito.filter(x=>{
    const p=vigentes.get(x.id);
    return !p||!p.disponible||p.precio===null||x.variante||(x.extras||[]).length||Number(x.precio)!==Number(p.precio);
  });
  if(cambios.length){
    productos=actuales;revisionPendiente=false;
    render();pintarPortada();
    // No modificar precios, cantidades ni productos del carrito sin aceptación.
    const aviso=document.createElement('div');
    aviso.className='note';
    aviso.setAttribute('role','alert');
    aviso.style.margin='12px 0';
    aviso.innerHTML='<strong>Revisa los cambios de tu pedido</strong><p>
'Tu pedido merece nuestra atención\n\nHemos realizado algunos ajustes en nuestro menú. Te invitamos a revisar los detalles de tu pedido antes de confirmarlo.'
</p><button class="button" type="button" id="reviewOrderNow">Revisar y actualizar carrito</button>';
    boton.before(aviso);
    boton.textContent='Pendiente de revisión';
    aviso.querySelector('button').onclick=()=>{
      const faltantes=carrito.filter(x=>{const p=vigentes.get(x.id);return !p||!p.disponible||p.precio===null||x.variante||(x.extras||[]).length;});
      // Se retiran únicamente con autorización expresa del cliente.
      carrito=carrito.filter(x=>!faltantes.includes(x)).map(x=>({...x,precio:vigentes.get(x.id).precio,nombre:vigentes.get(x.id).nombre}));
      actualizarCarrito();
      renderCarrito();
      if($('orderType')){
        $('orderType').value=tipo;
        renderPerfilPedido();
        $('orderName').value=nombre;$('orderPhone').value=tel;
        if($('orderAddress'))$('orderAddress').value=dir;
        $('orderNotes').value=notas;$('saveInfo').checked=recordar;
      }
      avisar(faltantes.length?'Se retiraron productos no disponibles. Revisa tu pedido.':'Precios actualizados. Revisa el total antes de enviar.');
    };
    return;
  }
  boton.disabled=false;boton.textContent='Preparar pedido para WhatsApp';
  if(recordar){perfil={nombre,telefono:tel,domicilio:dir||perfil.domicilio||''};guardar('perfil',perfil)}
  const subtotal=carrito.reduce((s,x)=>s+(x.precio??0)*x.cantidad,0);
  const detalleProductos=carrito.map(x=>{
    const importe=dinero(x.precio*x.cantidad);
    const detalles=[x.variante,...(x.extras||[])].filter(Boolean);
    return `${x.cantidad} x ${x.nombre} — ${importe}${detalles.length?'\n   Opciones: '+detalles.join(', '):''}${x.notas?'\n   Nota: '+x.notas:''}`;
  }).join('\n\n');
  const msg=[
    '*EL DULCE SUEÑO*','COFFEE & DESSERTS','━━━━━━━━━━━━━━━━━━','*NUEVO PEDIDO*','━━━━━━━━━━━━━━━━━━','',
    '*PRODUCTOS*',detalleProductos,'','━━━━━━━━━━━━━━━━━━',`*TOTAL: ${dinero(subtotal)}*`,'━━━━━━━━━━━━━━━━━━','',
    '*DATOS DEL CLIENTE*',`Nombre: ${nombre}`,`Celular: ${tel}`,
    `Modalidad: ${tipo==='recoger'?'Recoger en cafetería':'Servicio a domicilio'}`,
    ...(dir?[`Dirección: ${dir}`]:[]),'','━━━━━━━━━━━━━━━━━━','*OBSERVACIONES*',notas||'Sin observaciones.','',
    'Pedido sujeto a confirmación de la cafetería.','Gracias por elegir El Dulce Sueño.'
  ].join('\n');
  if(CONFIG.whatsapp){window.location.href='https://wa.me/'+CONFIG.whatsapp+'?text='+encodeURIComponent(msg)}
  else{navigator.clipboard?.writeText(msg).then(()=>avisar('Pedido copiado. Falta configurar WhatsApp oficial.')).catch(()=>prompt('Copia el pedido:',msg));if(!navigator.clipboard)prompt('Copia el pedido:',msg)}
}
function abrirPerfil(){abrir('Mi perfil',`<p class="muted">Guarda tus datos para no volver a escribirlos en este dispositivo. Al conectar Supabase se habilitará la cuenta segura entre dispositivos.</p><label>Nombre</label><input class="field" id="pName" value="${texto(perfil.nombre||'')}" placeholder="Nombre"><label>Celular</label><input class="field" id="pPhone" type="tel" value="${texto(perfil.telefono||'')}" placeholder="10 dígitos"><label>Domicilio para entregas (opcional)</label><textarea class="field" id="pAddress" rows="3">${texto(perfil.domicilio||'')}</textarea><label class="checkline"><input type="checkbox" id="pPromo" ${leer('promoConsent',false)?'checked':''}>Me interesa recibir promociones (requiere activar notificaciones cuando estén disponibles)</label><button class="button" id="saveProfile">Guardar mis datos</button><p class="muted">Los datos quedan guardados solo en este navegador. No se envían a ningún servidor.</p>`);$('saveProfile').onclick=()=>{const nombre=$('pName').value.trim(),tel=$('pPhone').value.replace(/\D/g,'');if(!nombre||tel.length!==10){avisar('Indica nombre y teléfono de 10 dígitos');return}const primera=!perfil.nombre;perfil={nombre,telefono:tel,domicilio:$('pAddress').value.trim()};guardar('perfil',perfil);guardar('promoConsent',$('pPromo').checked);cerrar();avisar(primera?`¡Bienvenido a la familia de El Dulce Sueño, ${nombre}!`:'Datos actualizados correctamente')}}
function abrirNotificaciones(){let activo=leer('avisosActivos',false);abrir('Notificaciones',`<p>Controla los avisos de promociones Flash cuando estén disponibles.</p><p class="note">El permiso del teléfono y el envío real de notificaciones se habilitarán al conectar el servicio push. Por ahora solo puedes guardar tu preferencia local.</p><button class="button" id="toggleAlerts">${activo?'Silenciar avisos promocionales':'Activar preferencia de avisos'}</button>`);$('toggleAlerts').onclick=()=>{activo=!activo;guardar('avisosActivos',activo);avisar(activo?'Preferencia activada; falta habilitar push':'Avisos silenciados en este dispositivo');cerrar()}}
async function flash(){
  const seccion=$('flashSection');
  try{
    const f=await promocionVigente();
    if(!f){seccion.hidden=true;return;}
    const p=productos.find(x=>x.supabaseId===f.producto_id);
    if(!p || !p.disponible){seccion.hidden=true;return;}
    const vence=new Date(f.termina_en).getTime();
    if(!Number.isFinite(vence)||vence<=Date.now()){seccion.hidden=true;return;}
    clearInterval(promoTimer);
    $('flashTitle').textContent=f.titulo;
    $('flashDescription').textContent=f.descripcion||'';
    $('flashPrice').textContent=`Precio promocional anunciado: ${dinero(Number(f.precio_promocion))}`;
    $('flashImage').src=f.imagen_url||p.imagen||'assets/local/interior-principal.jpg';
    // Hasta contar con cobro de promociones validado en servidor,
    // nunca introducir el descuento en el carrito a precio incorrecto.
    $('flashAdd').textContent='Consultar promoción';
    $('flashAdd').onclick=()=>{
      const mensaje=`Hola, quiero consultar la promoción ${f.titulo} de El Dulce Sueño (${dinero(Number(f.precio_promocion))}).`;
      if(CONFIG.whatsapp) window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`,'_blank','noopener');
      else avisar('Falta configurar WhatsApp');
    };
    function tick(){
      const ms=vence-Date.now();
      if(ms<=0){seccion.hidden=true;clearInterval(promoTimer);return;}
      seccion.hidden=false;
      $('flashCountdown').textContent=`Termina en ${Math.floor(ms/3600000)}h ${Math.floor(ms%3600000/60000)}m ${Math.floor(ms%60000/1000)}s`;
    }
    tick();promoTimer=setInterval(tick,1000);
  }catch(e){console.warn('Promoción no disponible',e);seccion.hidden=true;}
}
function detalles(){
  const filas=[];
  const iconos={
    domicilio:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    telefono:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3H4a2 2 0 0 0-2 2c0 9.4 7.6 17 17 17a2 2 0 0 0 2-2v-3l-5-2-2.2 2.2a16 16 0 0 1-7-7L9 8 7 3Z"/></svg>',
    correo:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></svg>'
  };
  if(CONFIG.direccion)filas.push(`<div class="visit-detail"><span class="visit-detail-icon">${iconos.domicilio}</span><div><strong>Domicilio:</strong><span>${texto(CONFIG.direccion.replace(/\s*\(domicilio de muestra\)/i,''))}</span></div></div>`);
  if(CONFIG.telefonoMuestra)filas.push(`<div class="visit-detail"><span class="visit-detail-icon">${iconos.telefono}</span><div><strong>Celular:</strong><a href="tel:${CONFIG.telefonoMuestra.replace(/[^+\d]/g,'')}">${texto(CONFIG.telefonoMuestra)}</a></div></div>`);
  if(CONFIG.correoMuestra)filas.push(`<div class="visit-detail"><span class="visit-detail-icon">${iconos.correo}</span><div><strong>Correo:</strong><a href="mailto:${encodeURI(CONFIG.correoMuestra)}">${texto(CONFIG.correoMuestra)}</a></div></div>`);
  $('businessDetails').innerHTML=filas.join('')+'<p class="demo-contact-note">Datos y enlaces de demostración; confirmar con el negocio antes de su entrega.</p>';
  const redes={socialFacebook:CONFIG.facebook,socialInstagram:CONFIG.instagram,socialTikTok:CONFIG.tiktok,socialWhatsApp:CONFIG.whatsapp?'https://wa.me/'+CONFIG.whatsapp:''};
  for(const [id,url] of Object.entries(redes)){
    const link=$(id);if(!link)continue;
    if(url){link.href=url;link.title=link.getAttribute('aria-label').replace(' (enlace de muestra)','').replace(' (número de muestra)','');}
  }
}
async function iniciar(){try{productos=await cargarProductos();catalogoDisponible=true;comprobarNuevaApertura(productos);carrito=carrito.filter(x=>{const p=productos.find(p=>p.id===x.id);return p&&p.disponible&&p.precio!==null&&!x.variante&&!(x.extras||[]).length;}).map(x=>({...x,precio:productos.find(p=>p.id===x.id).precio}));actualizarCarrito();render();pintarPortada();flash()}catch(e){catalogoDisponible=false;carrito=[];actualizarCarrito();$('productGrid').innerHTML='<p>No pudimos verificar los productos en este momento. Intenta de nuevo en unos minutos. No se recibirán pedidos sin precios confirmados.</p>';console.error(e)}detalles();actualizarCarrito();$('search').oninput=render;$('categories').onclick=e=>{const b=e.target.closest('[data-cat]');if(b){seleccionarCategoria(b.dataset.cat)}};$('productGrid').onclick=e=>{const p=e.target.closest('[data-producto]'),f=e.target.closest('[data-favorito]');if(p)ficha(p.dataset.producto);if(f){const id=f.dataset.favorito;favoritos=favoritos.includes(id)?favoritos.filter(x=>x!==id):[...favoritos,id];guardar('favoritos',favoritos);render()}};$('favoritesFilter').onclick=()=>{soloFavoritos=!soloFavoritos;categoria='Todos';render()};$('categoryNext').onclick=e=>{const siguiente=e.target.closest('[data-next-cat]');if(siguiente){seleccionarCategoria(siguiente.dataset.nextCat);return}if(e.target.closest('[data-back-categories]'))$('explorar').scrollIntoView({behavior:'smooth',block:'start'})};$('heroCategories').onclick=e=>{const b=e.target.closest('[data-hero-cat]');if(b)seleccionarCategoria(b.dataset.heroCat)};$('menuToggle').onclick=()=>$('explorar').scrollIntoView({behavior:'smooth',block:'start'});$('bottomFavorites').onclick=()=>{soloFavoritos=true;categoria='Todos';render();$('menu').scrollIntoView({behavior:'smooth'})};$('bottomOrder').onclick=renderCarrito;$('cartBtn').onclick=renderCarrito;$('profileBtn').onclick=abrirPerfil;$('notificationBtn').onclick=abrirNotificaciones;$('closeDrawer').onclick=cerrar;$('overlay').onclick=cerrar;document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrar()});if(mesa)avisar(`Mesa ${mesa} detectada. Pedido interno pendiente de conexión.`)}
iniciar();


// Solo efecto visual: no altera productos, carrito ni pedidos.
(function activarFondoEnScroll(){
  let pendiente=false;
  function actualizar(){
    const avance=Math.min(1,Math.max(0,window.scrollY/(window.innerHeight*0.9)));
    document.documentElement.style.setProperty('--scroll-blur',(avance*13).toFixed(1)+'px');
    document.documentElement.style.setProperty('--scroll-dim',(avance*0.27).toFixed(3));
    pendiente=false;
  }
  window.addEventListener('scroll',()=>{if(!pendiente){pendiente=true;requestAnimationFrame(actualizar)}},{passive:true});
  window.addEventListener('resize',actualizar,{passive:true});
  actualizar();
})();

// Instalación PWA: el navegador decide cuándo permite mostrar la solicitud.
let solicitudInstalacion=null;
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  solicitudInstalacion=event;
  const boton=document.getElementById('installAppBtn');
  if(boton)boton.hidden=false;
});
window.addEventListener('appinstalled',()=>{
  solicitudInstalacion=null;
  const boton=document.getElementById('installAppBtn');
  if(boton)boton.hidden=true;
});
document.getElementById('installAppBtn')?.addEventListener('click',async()=>{
  if(!solicitudInstalacion)return;
  const solicitud=solicitudInstalacion;
  solicitudInstalacion=null;
  document.getElementById('installAppBtn').hidden=true;
  await solicitud.prompt();
});
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(console.warn));
}
