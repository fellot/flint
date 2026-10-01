import type { EveningLocation } from '@/types/evening-context';

// Called only from a user action. Coordinates are coarsened before leaving the browser.
export function locateEvening(signal: AbortSignal, geo = globalThis.navigator?.geolocation): Promise<EveningLocation> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
    if (!geo) { resolve({ mode: 'none' }); return; }
    let finished = false;
    const finish = (value?: EveningLocation) => {
      if (finished) return;
      finished = true; clearTimeout(timer); signal.removeEventListener('abort', abort);
      if (value) resolve(value); else reject(new DOMException('Cancelled', 'AbortError'));
    };
    const abort = () => finish();
    const timer = setTimeout(() => finish({ mode: 'none' }), 10000);
    signal.addEventListener('abort', abort, { once: true });
    try {
      geo.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        finish(Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
          ? { mode: 'coordinates', latitude: Math.round(latitude * 10) / 10, longitude: Math.round(longitude * 10) / 10 } : { mode: 'none' });
      }, () => finish({ mode: 'none' }), { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 });
    } catch { finish({ mode: 'none' }); }
  });
}
