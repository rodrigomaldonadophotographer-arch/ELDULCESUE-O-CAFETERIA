import {CONFIG} from './config.js';
export async function promocionVigente(){
 const qs=new URLSearchParams({select:'id,producto_id,titulo,descripcion,precio_promocion,imagen_url,termina_en',negocio_id:`eq.${CONFIG.negocioId}`,activa:'eq.true',order:'fecha_registro.desc',limit:'1'});
 const r=await fetch(`${CONFIG.supabaseUrl}/rest/v1/bd_promociones_flash?${qs}`,{cache:'no-store',headers:{apikey:CONFIG.supabasePublishableKey}});
 if(!r.ok) throw new Error('Promociones: '+r.status);
 const filas=await r.json();return filas[0]||null;
}
