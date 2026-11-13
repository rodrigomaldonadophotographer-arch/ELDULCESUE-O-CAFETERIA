// CONFIGURACIÓN DEL NEGOCIO: completar antes de entregar al cliente.
export const CONFIG = {
  negocioId: 'el-dulce-sueno', // sustituir por UUID real de bd_negocios al conectar
  nombre: 'El Dulce Sueño',
  whatsapp: '', // 521XXXXXXXXXX sin +, espacios ni guiones; NO inventar
  direccion: '', // confirmar con la propietaria
  mapaUrl: '',
  horario: '',
  instagram: '',
  facebook: '',
  googleResenas: '',
  moneda: 'MXN',
  // Ejemplo: abrir ?mesa=3 reconoce el origen, pero NO envía pedidos a caja hasta integrar backend.
  // No publicar QR de mesas para pedidos internos antes de habilitar la conexión.
  modoDemo: true,
  // Promoción flash de demostración: dejar null para que NO aparezca.
  // Ejemplo futuro: {id:'eds-020',titulo:'Postre de la tarde',precio:49,
  // descripcion:'Hasta agotar existencias',imagen:'assets/productos/pastel-tres-leches.jpg',vence:'2026-11-14T18:00:00-06:00'}
  promocionFlash: null
};
