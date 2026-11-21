import type { CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Check, Flag, Map as MapIcon, Minus, Plus, RotateCcw } from "lucide-react";
import chrys from "@assets/chrys_sitting_new_user_nobg.png";
import alyse from "@assets/alyse_normal_nobg.png";
import { AdventureProgress } from "./AdventureUI";
import { landmarks, spriteSize, type MapSprite, type Placement } from "../lib/learningMapArt";
import { edgeFoliage, foreground, journey, overviewMarkers, riverStones, scenery, stops, worldSize, type LandmarkLayout, type MapPoint } from "../lib/learningMapLayout";
import { useMapCamera } from "../lib/useMapCamera";
import "../learning-map.css";

const names = {
  en: ["Adventure Camp", "Number Treehouse", "Counting Banana Grove", "River Stone Crossing", "Banana Sorting Grove", "Banana Gathering Meadow", "Takeaway Clearing", "Jungle Market Village", "Grand Star Summit"],
  ms: ["Kem Pengembaraan", "Rumah Pokok Nombor", "Kebun Mengira Pisang", "Lintasan Batu Sungai", "Rimbun Mengumpul Pisang", "Padang Mengumpul Pisang", "Laman Tolak", "Kampung Pasar Rimba", "Puncak Bintang Agung"],
};
const labels = {
  en: { overview: "World Overview", back: "Return to map", explore: "Drag to explore", choose: "Tap a place to visit it",
    controls: "Map view", places: "All places", start: "Start", done: "Completed", next: "Next adventure", open: "Available" },
  ms: { overview: "Seluruh Peta", back: "Kembali ke peta", explore: "Seret untuk meneroka", choose: "Ketik tempat untuk melawatnya",
    controls: "Paparan peta", places: "Semua tempat", start: "Mula", done: "Selesai", next: "Pengembaraan seterusnya", open: "Tersedia" },
};
const order = ["camp", "treehouse", "orchard", "river", "sorting", "gathering", "takeaway", "market", "summit"] as const;
const groundSprites = new Set<MapSprite>(["wc-water", "wc-left-bank", "wc-right-bank"]);
const asset = (sprite: MapSprite | "trail-texture") => new URL(`assets/learning-map/${sprite}.webp`, document.baseURI).href;
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
  const camera = useMapCamera(worldSize);
  const overview = camera.mode === "overview";
  const text = labels[lang];
  const current = lessons.findIndex(lesson => !lesson.complete);
  const completed = lessons.filter(lesson => lesson.complete).length;
  const [width, height] = worldSize;
  const [campX, campY, campScale] = stops[0];
  const isEnglish = lang === "en";

  return <main className="learning-world-menu" aria-label={isEnglish ? "Learning Adventure" : "Pengembaraan Pembelajaran"}>
    <p className="world-explorer-hint" data-map-hud>{overview ? <>
      <span className="world-hint-choose">{text.choose}</span>
      {current >= 0 && <span className="world-hint-next">{text.next}: {current + 1}. {names[lang][current + 1]}</span>}
    </> : text.explore}</p>
    <div className="world-journey-progress" data-map-hud>
      <AdventureProgress value={completed} total={lessons.length} label={isEnglish ? "Your journey" : "Perjalanan kamu"} />
    </div>
    <div className="world-camera-controls" role="group" aria-label={text.controls} data-map-hud data-mode={camera.mode}>
      <button type="button" className="world-overview-toggle"
        onClick={overview ? () => camera.exitOverview() : camera.enterOverview}>
        {overview ? <ArrowLeft aria-hidden="true" /> : <MapIcon aria-hidden="true" />}
        <span>{overview ? text.back : text.overview}</span>
      </button>
      <div className="world-zoom-controls" role="group" aria-label={isEnglish ? "Map zoom" : "Zum peta"}>
        {overview ? <output aria-live="polite" className="world-overview-status">
          <MapIcon aria-hidden="true" />{text.overview}
        </output> : <>
          <button type="button" onClick={camera.zoomOut} disabled={camera.zoom <= camera.minZoom + 0.001}
            aria-label={isEnglish ? "Zoom out" : "Zum keluar"}><Minus aria-hidden="true" /></button>
          <output aria-live="polite">{Math.round(camera.zoom * 100)}%</output>
          <button type="button" onClick={camera.zoomIn} disabled={camera.zoom >= camera.maxZoom - 0.001}
            aria-label={isEnglish ? "Zoom in" : "Zum masuk"}><Plus aria-hidden="true" /></button>
          <button type="button" onClick={camera.reset}
            aria-label={isEnglish ? "Reset zoom to 100%" : "Tetapkan semula zum kepada 100%"}>
            <RotateCcw aria-hidden="true" />
          </button>
        </>}
      </div>
    </div>
    <div className="learning-world-camera" ref={camera.viewport}
      onPointerDown={camera.start} onPointerMove={camera.move}
      onPointerUp={camera.finish} onPointerCancel={camera.finish} onLostPointerCapture={camera.finish}
      onClickCapture={camera.filterClick} onFocusCapture={camera.revealFocus}>
      <div className="learning-world-extent" style={{ "--map-ratio": width / height } as CSSProperties}>
        <div className="learning-world-track" ref={camera.track}>
          <div className="learning-world-surround" aria-hidden="true"><i className="surround-ground" /><i className="surround-sky" /><i className="surround-hills" /></div>
          <div className="learning-world" data-learning-map style={{ aspectRatio: `${width} / ${height}`, "--map-nameboard": `url("${asset("nameboard")}")` } as CSSProperties}>
            <div className="learning-world-art">
            {scenery.map((placement, i) => (
              <Sprite key={i} placement={placement} world={worldSize} className="world-verge" />
            ))}
            {order.map((kit, i) => landmarks[kit].map((placement, j) => groundSprites.has(placement[0]) && (
              <Sprite key={`${kit}-${j}`} placement={at(placement, stops[i])} world={worldSize}
                className="world-ground" eager={i < 2} />
            )))}
            </div>
            <svg className="learning-world-road" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
              <defs>
                <pattern id="learning-trail-paint" width="100" height="115" patternUnits="userSpaceOnUse">
                  <image href={asset("trail-texture")} width="100" height="115" />
                </pattern>
                <filter id="river-cutout">
                  <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
                </filter>
                <filter id="river-shore">
                  <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
                </filter>
                <mask id="learning-dry-trail" maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
                  <rect width={width} height={height} fill="white" />
                  {landmarks.river.filter(([name]) => groundSprites.has(name)).map(piece => {
                    const [name, span, x, y, placedHeight] = at(piece, stops[3]);
                    const [imageWidth, imageHeight] = spriteSize[name];
                    const rise = placedHeight ?? span * imageHeight / imageWidth;
                    return <image key={name} href={asset(name)} x={x - span / 2} y={y - rise / 2}
                      width={span} height={rise} preserveAspectRatio="none" filter={name === "wc-water" ? "url(#river-cutout)" : "url(#river-shore)"} />;
                  })}
                </mask>
                <filter id="learning-trail-edge" x="-5%" y="-5%" width="110%" height="110%">
                  <feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="13" result="grain" />
                  <feDisplacementMap in="SourceGraphic" in2="grain" scale="5" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
              <g mask="url(#learning-dry-trail)">
                {journey.map((leg, i) => leg.surface === "dirt" && <g key={i} filter="url(#learning-trail-edge)">
                  <path className="world-road-verge" d={leg.path} />
                  <path className="world-road-sand" d={leg.path} />
                </g>)}
              </g>
            </svg>
            {order.map((kit, i) => {
              const layout = stops[i];
              const lake = kit === "river";
              let stoneNumber = 0;
              const pieces = lake ? [...landmarks.river, ...riverStones] : landmarks[kit];
              return pieces.map((placement, j) => {
                const name = placement[0];
                if (groundSprites.has(name)) return null;
                const adjusted = at(placement, layout);
                const stone = name === "wc-stone";
                if (stone) stoneNumber += 1;
                return <div key={`${kit}-${j}`} className="world-landmark-layer"
                  data-map-sprite={name}>
                  <Sprite placement={adjusted} world={worldSize} className="world-structure" eager={i < 2} />
                  {stone && <span className="world-stone-number" data-crossing-stone={stoneNumber}
                    style={position(adjusted[2], adjusted[3] - adjusted[1] * .11, worldSize)}>{stoneNumber}</span>}
                </div>;
              });
            })}
            {foreground.map((placement, i) => (
              <Sprite key={i} placement={placement} world={worldSize} className="world-foreground" />
            ))}
            {edgeFoliage.map(([sprite, span, x, y, flip], i) => (
              <Sprite key={`edge-${i}`} placement={[sprite, span, x, y]} world={worldSize}
                className={`world-edge-foliage${flip ? " is-flipped" : ""}`} />
            ))}
            <img className="world-character" src={chrys} alt="Chrys" width="232" height="243"
              style={{ ...position(campX + 154 * campScale, campY + 272 * campScale, worldSize), width: `${80 / width * 100}%` }} />
            <img className="world-character" src={alyse} alt="Alyse" width="207" height="305"
              style={{ ...position(campX + 225 * campScale, campY + 281 * campScale, worldSize), width: `${55 / width * 100}%` }} />

            <div className="world-nameboard world-welcome" data-destination="camp"
              style={position(...stops[0][3], worldSize)}>
              <p>{lang === "en" ? "Start" : "Mula"}</p>
              <h2>{names[lang][0]}</h2>
            </div>
            {lessons.map((lesson, index) => {
              const i = index + 1;
              const [signX, signY] = stops[i][3];
              const available = lang === "en" ? "Available" : "Tersedia";
              const status = lesson.complete ? (lang === "en" ? "Completed" : "Selesai")
                : current === index ? (lang === "en" ? "Next adventure" : "Pengembaraan seterusnya") : available;
              return <button key={order[i]} type="button" className="world-nameboard world-lesson"
                data-destination={order[i]} data-complete={lesson.complete} aria-current={current === index ? "step" : undefined}
                onClick={lesson.onClick} style={position(signX, signY, worldSize)}
                aria-label={`${i}. ${names[lang][i]}. ${lesson.title}. ${status}`}>
                <span className="world-stop-number" aria-hidden="true">{i}</span>
                <span className="world-stop-name">{names[lang][i]}</span>
                <span className="world-stop-lesson">{lesson.title}</span>
                <span className="world-stop-status">{status}
                  {lesson.complete ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
                </span>
              </button>;
            })}
            <nav className="world-overview-pins" aria-label={text.places} hidden={!overview}>
              {overviewMarkers.map(([x, y], i) => {
                const lesson = lessons[i - 1];
                const state = i === 0 ? "start" : lesson.complete ? "complete" : current === i - 1 ? "next" : "open";
                const status = state === "start" ? text.start : state === "complete" ? text.done : state === "next" ? text.next : text.open;
                const [signX, signY] = stops[i][3];
                const go = () => camera.exitOverview({
                  point: [(x + signX) / 2, (y + signY) / 2],
                  focus: () => document.querySelector<HTMLElement>(`.world-nameboard[data-destination="${order[i]}"]`)?.focus({ preventScroll: true }),
                });
                return <button key={order[i]} type="button" className="world-overview-pin" data-state={state}
                  data-destination={order[i]} aria-current={state === "next" ? "step" : undefined}
                  aria-label={`${i ? `${i}. ` : ""}${names[lang][i]}. ${status}`}
                  style={position(x, y, worldSize)} onClick={go}>
                  <span className="world-pin-disc" aria-hidden="true">
                    {state === "start" ? <Flag /> : state === "complete" ? <Check /> : i}
                  </span>
                  <span className="world-pin-label" aria-hidden="true">
                    {i ? `${i}. ` : ""}{names[lang][i]}<small>{status}</small>
                  </span>
                </button>;
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  </main>;
}
