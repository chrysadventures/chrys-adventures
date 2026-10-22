import { useState } from "react";
import { GameFileScreen, MenuScreen, AdditionOnlyLesson, Quiz, UI, recognitionPracticeQuestions } from "./App";
import type { GameSave } from "./lib/gameSaves";

const sample: GameSave = {
  id: "design-preview", fileName: "My jungle adventure", playerName: "Explorer", stars: 12,
  updatedAt: "2026-10-22T00:00:00Z", createdAt: "2026-10-22T00:00:00Z", lang: "en", soundEnabled: false,
  player: { name: "Explorer", stars: 12, progress: { recognizeNumbers: 1, numberValues: 1 } },
};
// Local fixtures: the gallery never reads or writes a child's cloud saves.
const api = { listGameSaves: async () => [sample], loadGameSave: async () => sample, createGameSave: async () => sample };

export function DesignPreview() {
  const [screen, setScreen] = useState("saved");
  const [lang, setLang] = useState<"en" | "ms">("en");
  const t = UI[lang];
  return <div className="learning-theme min-h-screen bg-emerald-50 p-3 text-emerald-950 md:p-6">
    <nav aria-label="Design preview" className="relative z-10 mb-4 flex flex-wrap gap-2">
      {["saved", "journey", "lesson", "practice"].map(item => <button key={item} aria-pressed={screen === item} onClick={() => setScreen(item)} className="rounded-xl border-2 border-emerald-700 bg-white px-4 py-2 font-bold">{item}</button>)}
      <button onClick={() => setLang(lang === "en" ? "ms" : "en")} className="rounded-xl border-2 border-emerald-700 bg-white px-4 py-2">{lang === "en" ? "Bahasa Melayu" : "English"}</button>
    </nav>
    {screen === "saved" && <GameFileScreen lang={lang} pin="preview" initialSaves={[sample]} soundEnabled={false} api={api} onToggleLang={() => setLang(lang === "en" ? "ms" : "en")} onOpen={() => setScreen("journey")} onChangePin={() => setScreen("saved")} />}
    {screen === "journey" && <MenuScreen lang={lang} t={t} player={sample.player} go={() => setScreen("lesson")} />}
    {screen === "lesson" && <AdditionOnlyLesson lang={lang} t={t} onDone={() => setScreen("practice")} />}
    {screen === "practice" && <Quiz lang={lang} t={t} title={t.practice} questions={recognitionPracticeQuestions} randomize={false} onFinish={() => setScreen("journey")} />}
  </div>;
}
