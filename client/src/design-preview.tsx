import { useState, useEffect } from "react";
import { GameFileScreen, ModeSelectScreen, MenuScreen, AdvancedMenuScreen, AdditionOnlyLesson, Quiz, UI, recognitionPracticeQuestions, DEFAULT_BACKGROUND_STYLE, CYBER_BACKGROUND_STYLE } from "./App";
import { REVIEW_LESSONS, REVIEW_TESTS, TestMenu, AdvancedTestMenu, LessonCompletionScreen, AudioEnabledContext, setGlobalAudioMuted, stopNumberAudio, Header } from "./App";
import { CloudCheck } from "lucide-react";
import type { GameSave } from "./lib/gameSaves";

const sample: GameSave = {
  id: "design-preview", fileName: "My jungle adventure", playerName: "Explorer", stars: 12,
  updatedAt: "2026-10-22T00:00:00Z", createdAt: "2026-10-22T00:00:00Z", lang: "en", soundEnabled: false,
  player: { name: "Explorer", stars: 12, progress: { recognizeNumbers: 1, numberValues: 1 } },
};
// Local fixtures: the gallery never reads or writes a child's cloud saves.
const api = { listGameSaves: async () => [sample], loadGameSave: async () => sample, createGameSave: async () => sample };

export function DesignPreview() {
  // Optional ?screen=&lang=&nav=0 parameters make review screenshots reproducible.
  const params = new URLSearchParams(window.location.search);
  const [screen, setScreen] = useState(params.get("screen") ?? "modes");
  const [lang, setLang] = useState<"en" | "ms">(params.get("lang") === "ms" ? "ms" : "en");
  const showNav = params.get("nav") !== "0";
  const [sound, setSound] = useState(false);
  useEffect(() => { setGlobalAudioMuted(!sound); }, [sound]);
  useEffect(() => () => stopNumberAudio(), [screen, lang]);
  const Lesson = REVIEW_LESSONS[screen as keyof typeof REVIEW_LESSONS];
  const questions = REVIEW_TESTS[screen as keyof typeof REVIEW_TESTS];
  const advanced = screen.startsWith("advanced");
  const t = UI[lang];
  // ?frame=app renders the Learning map inside the same full-screen frame, header and save status as the app.
  if (screen === "menu" && params.get("frame") === "app") {
    return <AudioEnabledContext.Provider value={sound}><div className="page-bg learning-theme min-h-[100dvh] text-slate-800 font-sans learning-map-page" style={DEFAULT_BACKGROUND_STYLE}>
      <div className="app-responsive-frame jungle-leaves relative z-10 mx-auto flex min-h-[100dvh] w-full flex-col px-4 py-4 md:px-8 learning-map-frame">
        <Header lang={lang} onToggleLang={() => setLang(lang === "en" ? "ms" : "en")} title={t.title} stars={sample.stars} t={t}
          soundEnabled={sound} onToggleSound={() => setSound(!sound)} onOpenGlossary={() => {}} onBack={() => setScreen("modes")} />
        <div className="app-save-status mb-3 flex justify-end px-1" aria-live="polite" aria-atomic="true">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-black border-emerald-300 bg-gradient-to-r from-sky-50 via-emerald-50 to-yellow-50 text-emerald-900">
            <CloudCheck aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={3} />{lang === "en" ? "Saved to your game" : "Disimpan dalam permainan"}
          </span>
        </div>
        <MenuScreen lang={lang} t={t} player={sample.player} go={setScreen} />
      </div>
    </div></AudioEnabledContext.Provider>;
  }
  return <AudioEnabledContext.Provider value={sound}><div className={`page-bg ${advanced ? "sunset-theme" : "learning-theme"} min-h-screen p-3 text-emerald-950 md:p-6`} style={advanced ? CYBER_BACKGROUND_STYLE : DEFAULT_BACKGROUND_STYLE}>
    <div className="relative z-10 mx-auto max-w-6xl">
    {showNav && <nav aria-label="Design preview" className="relative z-10 mb-4 flex flex-wrap gap-2">
      {["modes", "menu", "advancedMenu", "saved", "lesson", "practice"].map(item => <button key={item} aria-pressed={screen === item} onClick={() => setScreen(item)} className="rounded-xl border-2 border-emerald-700 bg-white px-4 py-2 font-bold">{item}</button>)}
      <button onClick={() => setLang(lang === "en" ? "ms" : "en")} className="rounded-xl border-2 border-emerald-700 bg-white px-4 py-2">{lang === "en" ? "Bahasa Melayu" : "English"}</button>
      <label className="rounded-xl bg-white px-3 py-2 text-emerald-950">Review section <select aria-label="Review section" value={screen} onChange={e => setScreen(e.target.value)}>
        {["modes", "menu", "advancedMenu", "saved", "lesson", "practice", "testMenu", "advancedTestMenu", "completion", "advancedCompletion", ...Object.keys(REVIEW_LESSONS), ...Object.keys(REVIEW_TESTS)].map(id => <option key={id} value={id}>{id}</option>)}
      </select></label>
      <button onClick={() => setSound(!sound)} className="rounded-xl bg-white px-3 py-2">{sound ? "Mute preview" : "Enable preview audio"}</button>
    </nav>}
    {screen === "saved" && <GameFileScreen lang={lang} pin="preview" initialSaves={[sample]} soundEnabled={false} api={api} onToggleLang={() => setLang(lang === "en" ? "ms" : "en")} onOpen={() => setScreen("journey")} onChangePin={() => setScreen("saved")} />}
    {screen === "modes" && <ModeSelectScreen lang={lang} t={t} player={sample.player} go={setScreen} />}
    {(screen === "menu" || screen === "journey") && <MenuScreen lang={lang} t={t} player={sample.player} go={setScreen} />}
    {screen === "advancedMenu" && <AdvancedMenuScreen lang={lang} t={t} player={{...sample.player, progress: {...sample.player.progress, advancedTeenNumbers: 1}}} go={setScreen} />}
    {screen === "lesson" && <AdditionOnlyLesson lang={lang} t={t} onDone={() => setScreen("practice")} />}
    {screen === "practice" && <Quiz lang={lang} t={t} title={t.practice} questions={recognitionPracticeQuestions} randomize={false} onFinish={() => setScreen("journey")} />}
    {Lesson && <Lesson key={`${screen}-${lang}`} lang={lang} t={t} onDone={() => setScreen(advanced ? "advancedCompletion" : "completion")} />}
    {questions && <Quiz key={`${screen}-${lang}`} lang={lang} t={t} title={screen} questions={questions} randomize={false} variant={advanced ? "cyber" : "default"} onFinish={() => setScreen(advanced ? "advancedCompletion" : "completion")} />}
    {screen === "testMenu" && <TestMenu lang={lang} t={t} player={sample.player} go={setScreen} />}
    {screen === "advancedTestMenu" && <AdvancedTestMenu lang={lang} t={t} player={sample.player} lastScore={null} testingMode go={setScreen} />}
    {(screen === "completion" || screen === "advancedCompletion") && <LessonCompletionScreen lang={lang} sectionName={t.addition} cyber={advanced} onContinue={() => setScreen(advanced ? "advancedMenu" : "menu")} />}
    </div>
  </div></AudioEnabledContext.Provider>;
}
