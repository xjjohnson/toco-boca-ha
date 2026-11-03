/** Calls back with whether the browser is online, now and on every change. */
export function watchNetwork(listener: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const update = () => listener(navigator.onLine !== false);
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}
