/* Barrio Digital · actualización automática del menú y administrador. */
(() => {
  if (!('serviceWorker' in navigator)) return;
  const swUrl = new URL('service-worker.js', new URL('../', document.currentScript.src)).href;
  let updating = false;
  let lastCheck = 0;
  let registration;
  let hadController = !!navigator.serviceWorker.controller;
  const reload = () => {
    if (!hadController || updating) return;
    updating = true;
    // Si se está escribiendo en un formulario, no interrumpir la edición.
    const el = document.activeElement;
    if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) &&
        !el.closest('#search')) {
      const onFinish = () => {
        el.removeEventListener('blur', onFinish);
        location.reload();
      };
      el.addEventListener('blur', onFinish, { once: true });
      return;
    }
    location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', reload);
  const check = async () => {
    if (document.visibilityState !== 'visible') return;
    if (!registration || Date.now() - lastCheck < 30000) return;
    lastCheck = Date.now();
    try { await registration.update(); } catch (error) { console.debug('Actualización pendiente:', error); }
  };
  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' });
      hadController = !!navigator.serviceWorker.controller;
      await check();
      window.setInterval(check, 60000);
      document.addEventListener('visibilitychange', check);
      window.addEventListener('focus', check);
    } catch (error) { console.warn('No se pudo comprobar la actualización:', error); }
  });
})();
