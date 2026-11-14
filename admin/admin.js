import {CONFIG} from '../js/config.js';
const $=id=>document.getElementById(id);
const base=CONFIG.supabaseUrl;
let token=null,productos=[];
function status(s){$('status').textContent=s;}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
async function api(path,options={}){
 const r=await fetch(`${base}${path}`,{...options,headers:{apikey:CONFIG.supabasePublishableKey,...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
 if(!r.ok){let detail=await r.text();throw new Error(`HTTP ${r.status}: ${detail.slice(0,280)}`);}
 return r.status===204?null:await r.json();
}
async function login(email,password){
 const r=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
 token=r.access_token;
 // La autorización real depende de bd_puede_administrar y las políticas RLS.
 const miembros=await api(`/rest/v1/bd_administradores?select=id&negocio_id=eq.${CONFIG.negocioId}&usuario_id=eq.${r.user.id}&activo=eq.true&limit=1`);
 if(!miembros.length){token=null;throw new Error('La cuenta no está asignada como administradora activa de esta cafetería.');}
 $('login').hidden=true;$('dashboard').hidden=false;
 await cargar();
}
async function cargar(){
 productos=await api(`/rest/v1/bd_productos?select=id,codigo,nombre,categoria,descripcion,precio,disponible,activo,imagen_url&negocio_id=eq.${CONFIG.negocioId}&order=codigo.asc`);
 $('count').textContent=`${productos.length} productos`;
 mostrarProductos();mostrarSelector();await cargarPromos();
}
function mostrarProductos(){
 const q=$('search').value.toLocaleLowerCase('es');
 $('products').innerHTML=productos.filter(p=>(p.nombre+' '+p.categoria).toLocaleLowerCase('es').includes(q)).map(p=>`<article class="item" data-id="${p.id}"><img src="${esc(p.imagen_url||'')}" alt="" loading="lazy"><div><h3>${esc(p.nombre)}</h3><p class="muted">${esc(p.codigo)} · ${esc(p.categoria)}</p><div class="fields"><label>Precio ($ MXN)<input data-field="precio" type="number" min="0" step="0.01" value="${p.precio??''}" placeholder="Pendiente"></label><label>Disponibilidad<select data-field="disponible"><option value="true" ${p.disponible?'selected':''}>Disponible</option><option value="false" ${!p.disponible?'selected':''}>No disponible</option></select></label><label class="wide">Descripción<input data-field="descripcion" maxlength="500" value="${esc(p.descripcion||'')}"></label><label class="wide">URL de fotografía<input data-field="imagen_url" type="url" value="${esc(p.imagen_url||'')}"></label></div><button data-save="${p.id}">Guardar cambios</button></div></article>`).join('');
}
function mostrarSelector(){ $('promoProduct').innerHTML=productos.filter(p=>p.activo&&p.disponible&&p.precio!==null).map(p=>`<option value="${p.id}">${esc(p.nombre)}</option>`).join(''); }
async function guardarProducto(id){
 const el=[...document.querySelectorAll('.item')].find(x=>x.dataset.id===id);if(!el)return;
 const valor=f=>el.querySelector(`[data-field="${f}"]`).value;
 const raw=valor('precio');const precio=raw.trim()===''?null:Number(raw);
 if(precio!==null&&(!Number.isFinite(precio)||precio<0||!/^\d+(\.\d{1,2})?$/.test(raw))){throw new Error('Precio inválido');}
 const disponible=valor('disponible')==='true';if(disponible&&precio===null)throw new Error('Configura el precio antes de habilitar la venta.');
 const imagen_url=valor('imagen_url').trim()||null;
 if(imagen_url&&!/^https:\/\//i.test(imagen_url))throw new Error('La foto debe tener una URL HTTPS.');
 const payload={precio,disponible,descripcion:valor('descripcion').trim(),imagen_url};
 await api(`/rest/v1/bd_productos?id=eq.${id}&negocio_id=eq.${CONFIG.negocioId}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload)});
 status('Producto actualizado. El menú mostrará el cambio al volver a cargar.');await cargar();
}
async function cargarPromos(){
 const promos=await api(`/rest/v1/bd_promociones_flash?select=id,titulo,precio_promocion,inicia_en,termina_en,activa&negocio_id=eq.${CONFIG.negocioId}&order=fecha_registro.desc&limit=30`);
 $('promos').innerHTML=promos.map(p=>`<article class="panel"><strong>${esc(p.titulo)}</strong><p>${Number(p.precio_promocion).toLocaleString('es-MX',{style:'currency',currency:'MXN'})} · Hasta ${new Date(p.termina_en).toLocaleString('es-MX')}</p><p class="muted">${p.activa?'Activada':'Desactivada'} · ${new Date(p.termina_en)>new Date()?'Vigencia pendiente/actual':'Vencida'}</p>${p.activa?`<button data-disable="${p.id}" class="secondary">Desactivar</button>`:''}</article>`).join('')||'<p>No hay promociones creadas.</p>';
}
$('loginForm').onsubmit=async e=>{e.preventDefault();status('Verificando acceso…');try{await login($('email').value,$('password').value);$('password').value='';status('Sesión iniciada.');}catch(err){status(err.message);}};
$('logout').onclick=()=>{token=null;productos=[];$('dashboard').hidden=true;$('login').hidden=false;status('Sesión cerrada.');};
$('search').oninput=mostrarProductos;
$('products').onclick=async e=>{const b=e.target.closest('[data-save]');if(!b)return;b.disabled=true;try{await guardarProducto(b.dataset.save)}catch(err){status(err.message)}finally{b.disabled=false}};
document.querySelector('nav').onclick=e=>{const b=e.target.closest('[data-tab]');if(!b)return;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x===b));$('productosPanel').hidden=b.dataset.tab!=='productos';$('promocionesPanel').hidden=b.dataset.tab!=='promociones';};
$('promoForm').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{
 const product=productos.find(p=>p.id===$('promoProduct').value);if(!product||!product.disponible||product.precio===null)throw new Error('Producto no disponible');
 const precio=Number($('promoPrice').value);if(!Number.isFinite(precio)||precio<0||precio!==Math.round(precio*100)/100)throw new Error('Precio promocional inválido');
 const termina=new Date(Date.now()+Number($('promoMinutes').value)*60000).toISOString();
 await api('/rest/v1/bd_promociones_flash',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({negocio_id:CONFIG.negocioId,producto_id:product.id,titulo:$('promoTitle').value.trim(),descripcion:$('promoDescription').value.trim(),precio_promocion:precio,imagen_url:product.imagen_url,termina_en:termina,activa:true})});
 $('promoForm').reset();status('Promoción publicada. Aparecerá en el menú mientras esté vigente.');await cargarPromos();
 }catch(err){status(err.message)}finally{b.disabled=false}};
$('promos').onclick=async e=>{const b=e.target.closest('[data-disable]');if(!b)return;b.disabled=true;try{await api(`/rest/v1/bd_promociones_flash?id=eq.${b.dataset.disable}&negocio_id=eq.${CONFIG.negocioId}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({activa:false})});status('Promoción desactivada.');await cargarPromos();}catch(err){status(err.message)}finally{b.disabled=false}};
