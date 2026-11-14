// CONFIGURACIÓN DEL NEGOCIO: completar antes de entregar al cliente.
export const CONFIG = {
  negocioId: '85e8e8a1-ad39-45d5-b5a0-f542b0c5dac8', // UUID real del negocio
  nombre: 'El Dulce Sueño',
  supabaseUrl: 'https://epxbvaeantfeduhkolal.supabase.co',
  supabasePublishableKey: 'sb_publishable_jVso9pjnYOF-X6nBHDNEZg_IOurDgJ7',
  whatsapp: '523113392436', // Numero de prueba autorizado; cambiar por el oficial al entregar
  direccion: 'Av. México 1000 Sur, Col. Centro, Tepic, Nayarit (domicilio de muestra)',
  telefonoMuestra: '+52 311 339 2436',
  correoMuestra: 'contacto@eldulcesueno.com', // Correo ficticio, no habilitado
  mapaUrl: '',
  horario: '',
  instagram: '',
  facebook: '',
  googleResenas: '',
  moneda: 'MXN',
  
  // Notificaciones push de Barrio Digital
  vapidPublicKey: 'a75a03ff7aeed2feec3a913e79ec7ee574a363e267c3f8c603ad1c469f37bfcc',

  // Ejemplo: abrir ?mesa=3 reconoce el origen, pero NO envía pedidos a caja hasta integrar backend.
  // No publicar QR de mesas para pedidos internos antes de habilitar la conexión.
  modoDemo: true,
  // Promoción flash de demostración: dejar null para que NO aparezca.
  // Ejemplo futuro: {id:'eds-020',titulo:'Postre de la tarde',precio:49,
  // descripcion:'Hasta agotar existencias',imagen:'assets/productos/pastel-tres-leches.jpg',vence:'2026-11-14T18:00:00-06:00'}
  promocionFlash: null
};
