import { useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowRight, Check } from "lucide-react";
import chrys from "@assets/chrys_sitting_new_user_nobg.png";
import alyse from "@assets/alyse_normal_nobg.png";
import { AdventureProgress } from "./AdventureUI";
import { landmarks, spriteSize, type MapSprite, type Placement } from "../lib/learningMapArt";
import { narrowWorld, wideWorld, type LandmarkLayout, type MapPoint } from "../lib/learningMapLayout";
import "../learning-map.css";

const names = {
  en: ["Adventure Camp", "Number Treehouse", "Counting Banana Grove", "River Stone Crossing", "Banana Sorting Grove", "Banana Gathering Meadow", "Takeaway Clearing", "Jungle Market Village", "Grand Star Summit"],
  ms: ["Kem Pengembaraan", "Rumah Pokok Nombor", "Kebun Mengira Pisang", "Lintasan Batu Sungai", "Rimbun Mengumpul Pisang", "Padang Mengumpul Pisang", "Laman Tolak", "Kampung Pasar Rimba", "Puncak Bintang Agung"],
};
const order = ["camp", "treehouse", "orchard", "river", "sorting", "gathering", "takeaway", "market", "summit"] as const;
const groundSprites = new Set<MapSprite>(["forecourt", "orchard-floor", "meadow-floor", "clearing-floor", "water", "left-bank", "right-bank"]);
const asset = (sprite: MapSprite | "trail-texture") => new URL(`assets/learning-map/${sprite}.webp`, document.baseURI).href;
const compactQuery = "(max-width: 680px)";

function subscribeResponsive(listener: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function position(x: number, y: number, [width, height]: MapPoint): CSSProperties {
  return { left: `${x / width * 100}%`, top: `${y / height * 100}%` };
}

function Sprite({ placement, world, className = "", eager = false }: {
  placement: Placement; world: MapPoint; className?: string; eager?: boolean;
}) {
  const [sprite, width, x, y, height] = placement;
  const [nativeWidth, nativeHeight] = spriteSize[sprite];
  return <img alt="" aria-hidden="true" draggable={false}
    className={`learning-world-sprite ${className}`}
    loading={eager ? "eager" : "lazy"} decoding="async" width={nativeWidth} height={nativeHeight}
    src={asset(sprite)}
    style={{
      ...position(x, y, world),
      width: `${width / world[0] * 100}%`,
      aspectRatio: height ? `${width} / ${height}` : `${nativeWidth} / ${nativeHeight}`,
    }} />;
}

function at(placement: Placement, [x, y, scale]: LandmarkLayout): Placement {
  const [name, width, localX, localY, height] = placement;
  return [name, width * scale, x + localX * scale, y + localY * scale, height && height * scale];
}

type LessonStop = { title: string; complete: boolean; onClick: () => void };

export function IllustratedLearningMap({ lang, lessons }: { lang: "en" | "ms"; lessons: LessonStop[] }) {
  const compact = useSyncExternalStore(subscribeResponsive, () => window.matchMedia(compactQuery).matches);
  const world = compact ? narrowWorld : wideWorld;
  const map = useRef<HTMLDivElement>(null);
  const current = lessons.findIndex(lesson => !lesson.complete);
  const completed = lessons.filter(lesson => lesson.complete).length;
  const [width, height] = world.size;
  const tileCount = compact ? 8 : 4;
  const [campX, campY, campScale] = world.stops[0];

  useLayoutEffect(() => {
    const element = map.current;
    if (!element) return;
    const showCamp = () => {
      const target = element.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
      window.scrollTo({ top: target, behavior: "instant" });
    };
    const observer = new ResizeObserver(showCamp);
    const stop = () => observer.disconnect();
    observer.observe(element);
    showCamp();
    // The shell can widen when the preceding screen finishes leaving the DOM.
    // Stop correcting as soon as the player starts navigating.
    const timer = window.setTimeout(stop, 350);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    return () => {
      stop();
      window.clearTimeout(timer);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, []);

  return <main className="learning-world-menu" aria-label={lang === "en" ? "Learning Adventure" : "Pengembaraan Pembelajaran"}>
    <div ref={map} className="learning-world" data-learning-map style={{ aspectRatio: `${width} / ${height}`, "--map-nameboard": `url("${asset("nameboard")}")` } as CSSProperties}>
      <div className="learning-world-foundation" aria-hidden="true">
        {Array.from({ length: tileCount }, (_, i) => (
          <img key={i} alt="" src={asset("jungle-floor")} decoding="async"
            style={{ top: `${i * 100 / tileCount}%`, height: `${100 / tileCount + 7}%` }} />
        ))}
      </div>
      {world.scenery.map((placement, i) => (
        <Sprite key={i} placement={placement} world={world.size} className="world-verge" />
      ))}
      <Sprite placement={world.cascade} world={world.size} className="world-cascade" />
      {order.map((kit, i) => landmarks[kit].map((placement, j) => groundSprites.has(placement[0]) && (
        <Sprite key={`${kit}-${j}`} placement={at(placement, world.stops[i])} world={world.size}
          className="world-ground" eager={i < 2} />
      )))}
      <svg className="learning-world-road" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          <pattern id="learning-trail-paint" width="100" height="115" patternUnits="userSpaceOnUse">
            <image href={asset("trail-texture")} width="100" height="115" />
          </pattern>
          <filter id="learning-trail-edge" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="13" result="grain" />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {world.road.map((path, i) => <g key={i} filter="url(#learning-trail-edge)">
          <path className="world-road-verge" d={path} />
          <path className="world-road-sand" d={path} />
        </g>)}
      </svg>
      {order.map((kit, i) => {
        const layout = world.stops[i];
        const lake = kit === "river";
        let stoneNumber = 0;
        return landmarks[kit].map((placement, j) => {
          const name = placement[0];
          if (groundSprites.has(name)) return null;
          const adjusted = at(placement, layout);
          const stone = lake && (name === "stone-a" || name === "stone-b");
          if (stone) stoneNumber += 1;
          return <div key={`${kit}-${j}`} className="world-landmark-layer"
            data-map-sprite={name}>
            <Sprite placement={adjusted} world={world.size} eager={i < 2} />
            {stone && <span className="world-stone-number" data-crossing-stone={stoneNumber}
              style={position(adjusted[2], adjusted[3] - adjusted[1] * .11, world.size)}>{stoneNumber}</span>}
          </div>;
        });
      })}
      <img className="world-character" src={chrys} alt="Chrys" width="232" height="243"
        style={{ ...position(campX + 179 * campScale, campY + 270 * campScale, world.size), width: `${80 / width * 100}%` }} />
      <img className="world-character" src={alyse} alt="Alyse" width="207" height="305"
        style={{ ...position(campX + 236 * campScale, campY + 278 * campScale, world.size), width: `${55 / width * 100}%` }} />

      <div className="world-nameboard world-welcome" data-destination="camp"
        style={position(...world.stops[0][3], world.size)}>
        <p>{lang === "en" ? "Start" : "Mula"}</p>
        <h2>{names[lang][0]}</h2>
      </div>
      {lessons.map((lesson, index) => {
        const i = index + 1;
        const available = lang === "en" ? "Available" : "Tersedia";
        const status = lesson.complete ? (lang === "en" ? "Completed" : "Selesai")
          : current === index ? (lang === "en" ? "Next adventure" : "Pengembaraan seterusnya") : available;
        return <button key={order[i]} type="button" className="world-nameboard world-lesson"
          data-destination={order[i]} data-complete={lesson.complete} aria-current={current === index ? "step" : undefined}
          onClick={lesson.onClick} style={position(...world.stops[i][3], world.size)}
          aria-label={`${i}. ${names[lang][i]}. ${lesson.title}. ${status}`}>
          <span className="world-stop-number" aria-hidden="true">{i}</span>
          <span className="world-stop-name">{names[lang][i]}</span>
          <span className="world-stop-lesson">{lesson.title}</span>
          <span className="world-stop-status">{status}
            {lesson.complete ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          </span>
        </button>;
      })}
      <div className="world-progress">
        <AdventureProgress value={completed} total={lessons.length} label={lang === "en" ? "Your journey" : "Perjalanan kamu"} />
      </div>
    </div>
  </main>;
}
