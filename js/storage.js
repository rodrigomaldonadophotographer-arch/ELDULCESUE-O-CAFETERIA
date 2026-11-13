const prefijo='eds-v1-';
export function leer(k,valor){try{return JSON.parse(localStorage.getItem(prefijo+k))??valor}catch{return valor}}
export function guardar(k,v){try{localStorage.setItem(prefijo+k,JSON.stringify(v));return true}catch{return false}}
// localStorage solo sirve como comodidad en ESTE dispositivo. No es identidad verificada.
// Datos de clientes entre dispositivos y notificaciones requieren Supabase + autenticación.
