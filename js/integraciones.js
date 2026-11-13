// CONTRATOS PREPARADOS PARA BARRIO DIGITAL. NO ESTÁN CONECTADOS.
// No simular un pedido de mesa exitoso sin confirmación de servidor.
export async function enviarPedidoMesa({negocioId,mesa,items,cliente}){
  throw new Error('Pedidos de mesa pendientes de conexión con Centro de Ventas y Caja.');
}
export async function guardarClienteSeguro(datos){
  throw new Error('Registro en la nube pendiente de conexión y verificación de identidad.');
}
export async function suscribirPush(){
  throw new Error('Notificaciones push pendientes de servidor, permiso y suscripción del dispositivo.');
}
// FUTURO: asociar cada pedido a negocio_id y mesa_id; guardar precios en servidor,
// validar cuentas activas y RLS, y crear operaciones idempotentes para evitar duplicados.
