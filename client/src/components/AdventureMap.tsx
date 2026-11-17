import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { adventureRoute } from '../lib/adventureRoute';

export function AdventureMap({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState({ path: '', width: 1, height: 1 });
  useLayoutEffect(() => {
    const element = root.current!;
    let frame = 0;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const markers = [...element.querySelectorAll<HTMLElement>('[data-map-pin]')];
      const points = markers.map(marker => {
        const rect = marker.getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - bounds.left, y: rect.top + rect.height / 2 - bounds.top };
      });
      const next = { path: adventureRoute(points, bounds.width, window.innerWidth < 1024), width: bounds.width, height: bounds.height };
      setRoute(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    element.querySelectorAll('[data-map-stop]').forEach(stop => observer.observe(stop));
    window.addEventListener('resize', schedule);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', schedule); };
  }, [children]);
  return <div className="adventure-map" ref={root}>
    <svg className="adventure-map-route" width={route.width} height={route.height} aria-hidden="true">
      <path className="route-bank" d={route.path} />
      <path className="route-earth" d={route.path} />
      <path className="route-footsteps" d={route.path} />
    </svg>
    {children}
  </div>;
}

const locations = {
  en: ['Number Treehouse', 'Counting Orchard', 'Number Trail', 'Grouping Grove', 'Addition Bridge', 'Takeaway Clearing', 'Everyday Village', 'Star Summit'],
  ms: ['Rumah Pokok Nombor', 'Kebun Mengira', 'Denai Nombor', 'Rimbun Kumpulan', 'Jambatan Tambah', 'Laman Tolak', 'Kampung Harian', 'Puncak Bintang'],
};
const expeditions = {
  en: ['Double-Digit Lookout', 'Comparison Canyon', 'Sequence Stairway', 'Joining Valley', 'Place-Value Workshop', 'Borrowing Mountain'],
  ms: ['Tinjau Dua Digit', 'Ngarai Perbandingan', 'Tangga Urutan', 'Lembah Gabungan', 'Bengkel Nilai Tempat', 'Gunung Meminjam'],
};
export function MapLocation({ index, lang, night = false }: { index: number; lang: 'en' | 'ms'; night?: boolean }) {
  return <span className="map-location">{(night ? expeditions : locations)[lang][index - 1]}</span>;
}
