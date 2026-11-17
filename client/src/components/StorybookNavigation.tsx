import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Sparkles } from 'lucide-react';
import { selectMagicEffect, magicPresentation, type MagicEffect } from '../lib/navigationMagic';

const publicArt = (file: string) => `${import.meta.env.BASE_URL}${file.slice(1)}`;
const art = {
  tree: publicArt("/assets/sprites/tree.png"),
  book: publicArt("/assets/sprites/book.png"),
  basket: publicArt("/assets/sprites/basket.png"),
  banana: publicArt("/assets/sprites/banana.png"),
  log: publicArt("/assets/sprites/log.png"),
  pencil: publicArt("/assets/sprites/pencil.png"),
  leaf: publicArt("/assets/sprites/leaf.png"),
  butterfly: publicArt("/assets/sprites/butterfly.png"),
  flower: publicArt("/assets/sprites/flower.png"),
  shell: publicArt("/assets/sprites/shell.png"),
};
// Decorative landmarks, never mathematical demonstrations or counted objects.
export function DestinationArt({ index, night = false }: { index: number; night?: boolean }) {
  const objects = night ? ['book', 'tree', 'log', 'banana', 'pencil', 'basket'] as const
    : ['book', 'basket', 'log', 'tree', 'banana', 'leaf', 'shell', 'pencil'] as const;
  return <span className={`destination-art landmark-${index}`} aria-hidden="true">
    <svg viewBox="0 0 280 120" className="landmark-ground"><path d="M12 100 Q42 64 92 83 Q155 40 200 76 Q254 67 270 100 Q146 124 12 100" fill="currentColor" /><path d="M65 104 Q130 77 205 101" fill="none" stroke="var(--path-color)" strokeWidth="12" strokeLinecap="round" /></svg>
    <img className="landmark-object" src={art[objects[(index - 1) % objects.length]]} alt="" draggable={false} />
    <img className="landmark-flora" src={night ? art.leaf : art.flower} alt="" draggable={false} />
    {index === 3 && <span className="landmark-steps"><i /><i /><i /></span>}
  </span>;
}

export function WorldMagic({ lang, night = false, companion }: { lang: 'en' | 'ms'; night?: boolean; companion: string }) {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [active, setActive] = useState<{ effect: MagicEffect; seed: number } | null>(null);
  const previous = useRef<MagicEffect | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => { setActive(null); busy.current = false; previous.current = null; }, [lang, night]);
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => { setActive(null); busy.current = false; }, magicPresentation(active.effect, reduced).duration);
    return () => window.clearTimeout(timer);
  }, [active, reduced]);
  const activate = () => {
    if (busy.current) return;
    busy.current = true;
    const effect = selectMagicEffect(night, previous.current);
    previous.current = effect;
    setActive({ effect, seed: Math.random() });
  };
  const presentation = active ? magicPresentation(active.effect, reduced) : null;
  return <div className={`world-weather ${night ? 'world-weather-night' : ''}`}>
    <div className="storybook-air" aria-hidden="true"><i /><i /></div>
    <button className="magic-trigger" type="button" onClick={activate} disabled={Boolean(active)}>
      <Sparkles aria-hidden="true" />{lang === 'en' ? 'A little wonder' : 'Sedikit keajaiban'}
    </button>
    {active && presentation && <div className={`environment-magic effect-${presentation.effect}`} aria-hidden="true" data-effect={presentation.effect}>
      {presentation.effect === 'still' ? <span className="magic-still"><Sparkles />{lang === 'en' ? 'A little wonder, just for you.' : 'Sedikit keajaiban untuk kamu.'}</span>
        : presentation.effect === 'greeting' ? <img className="magic-companion" src={companion} alt="" />
        : presentation.effect === 'rainbow' ? <span className="magic-rainbow" />
        : presentation.effect === 'meteor' ? <span className="magic-meteor" />
        : Array.from({ length: presentation.particles }, (_, i) => <span className="magic-particle" key={i} style={{ '--x': `${8 + i * 12}%`, '--y': `${20 + ((i * 31 + active.seed * 27) % 50)}%`, '--drift': `${20 + ((i * 17 + active.seed * 30) % 65)}px`, '--delay': `${i * 75}ms`, '--turn': `${i % 2 ? 25 : -35}deg` } as CSSProperties}>
          {presentation.effect === 'butterflies' || presentation.effect === 'leaves' ? <img src={presentation.effect === 'butterflies' ? art.butterfly : art.leaf} alt="" /> : <i />}
        </span>)}
    </div>}
  </div>;
}
