import { usePlayerGender } from "@/game/moon/narrative/hooks/playerCharacterContext";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Info,
  Lightbulb,
} from "lucide-react";
import { GameInfo } from "@exo/ui";
import {
  browserNarrationEnvironment,
  NarrationController,
} from "@/game/moon/narrative/voice/narration";
import { GLOSSARY, WORD_GROUPS, type LearningTerm } from "./glossary";
import {
  getContextualTerms,
  matchLearningTerms,
  type KeywordScene,
} from "./keywordContext";
import { KeywordCard } from "./KeywordCard";
import "@/shared/shell/gamePolish.css";
import "./keywords.css";

type KeywordView = LearningTerm | "all" | "context";
const LearningContext = createContext<{
  open(term: KeywordView): void;
  registerText(id: string, text: string): () => void;
} | null>(null);

function KeywordLibrary({ onSelect }: { onSelect(term: LearningTerm): void }) {
  const [group, setGroup] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const selected = WORD_GROUPS.find((item) => item.name === group);
  const entries = selected?.terms ?? [];
  const count = Math.ceil(entries.length / 6);
  const list = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    list.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [group, page]);
  return (
    <div ref={list} className="keyword-library">
      <div className="learning-word-grid">
        {selected ? (
          <>
            <button
              onClick={() => {
                setGroup(null);
                setPage(0);
              }}
            >
              ← All topics
            </button>
            {entries.slice(page * 6, page * 6 + 6).map((term) => (
              <button key={term} onClick={() => onSelect(term)}>
                <span aria-hidden="true">{GLOSSARY[term].icon}</span>
                {GLOSSARY[term].name}
              </button>
            ))}
          </>
        ) : (
          WORD_GROUPS.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setGroup(item.name);
                setPage(0);
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.name}
            </button>
          ))
        )}
      </div>
      {selected && count > 1 ? (
        <div
          className="keyword-library-pages"
          aria-label={`${selected.name} pages`}
        >
          <button
            className="game-info-page-button"
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
            aria-label="Previous keyword page"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <span aria-live="polite">
            {page + 1} / {count}
          </span>
          <button
            className="game-info-page-button"
            disabled={page === count - 1}
            onClick={() => setPage((value) => value + 1)}
            aria-label="Next keyword page"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function LearningProvider({
  children,
  stepId,
  text,
  objective,
  activity,
}: { children: ReactNode } & KeywordScene) {
  const [view, setView] = useState<KeywordView | null>(null);
  const [prose, setProse] = useState<Record<string, string>>({});
  const [playing, setPlaying] = useState<{
    term: LearningTerm;
    scene: string;
  } | null>(null);
  const gender = usePlayerGender();
  const [voice] = useState(
    () => new NarrationController(browserNarrationEnvironment()),
  );
  const content = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const stopMedia = useCallback(() => setPlaying(null), []);
  const stop = useCallback(() => {
    voice.stop();
    stopMedia();
  }, [voice, stopMedia]);
  const sceneKey = `${stepId ?? ""}:${activity ?? ""}:${text ?? ""}`;
  useEffect(() => () => voice.stop(), [voice, sceneKey]);
  const open = useCallback(
    (value: KeywordView) => {
      if (!document.querySelector("dialog.keyword-drawer[open]")) {
        opener.current = document.activeElement as HTMLElement | null;
      }
      stop();
      setView(value);
    },
    [stop],
  );
  const registerText = useCallback((id: string, value: string) => {
    setProse((previous) => ({ ...previous, [id]: value }));
    return () =>
      setProse((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
  }, []);
  const context = useMemo(() => ({ open, registerText }), [open, registerText]);
  const relevant = getContextualTerms({
    stepId,
    objective,
    activity,
    text: [text, ...Object.values(prose)].filter(Boolean).join(" "),
  });
  const terms =
    view === "context" ? relevant : view && view !== "all" ? [view] : [];
  useEffect(() => {
    if (view && view !== "all" && view !== "context")
      content.current?.querySelector<HTMLElement>("h3")?.focus();
  }, [view]);
  const close = () => {
    stop();
    setView(null);
    requestAnimationFrame(() => {
      const previous = opener.current;
      const target =
        previous?.isConnected && previous.getClientRects().length
          ? previous
          : document.querySelector<HTMLElement>(
              '.conversation-header [aria-label="Open space keywords"], .mobile-game-tools [aria-label="Pause menu"]',
            );
      target?.focus({ preventScroll: true });
    });
  };

  return (
    <LearningContext.Provider value={context}>
      {children}
      {view ? (
        <GameInfo
          title="Space keywords"
          className="game-info learning-drawer keyword-drawer"
          onClose={close}
          pages={[
            <div className="keyword-browser" ref={content} key="keywords">
              <div className="keyword-navigation" aria-label="Keyword views">
                <button
                  className="game-info-trigger"
                  aria-pressed={view === "context"}
                  onClick={() => open("context")}
                >
                  This scene
                </button>
                <button
                  className="game-info-trigger"
                  aria-pressed={view === "all"}
                  onClick={() => open("all")}
                >
                  <BookOpen size={17} />
                  All keywords
                </button>
              </div>
              {view === "all" ? (
                <KeywordLibrary onSelect={open} />
              ) : (
                <>
                  {view === "context" ? (
                    <p className="keyword-scene-label">
                      {relevant.length
                        ? "Words for this part of your mission"
                        : "Choose All keywords to explore space words."}
                    </p>
                  ) : null}
                  <div className="keyword-card-list">
                    {terms.map((term) => (
                      <KeywordCard
                        key={term}
                        term={term}
                        playing={
                          playing?.term === term && playing.scene === sceneKey
                        }
                        onStop={stopMedia}
                        onPlay={() => {
                          voice.stop();
                          setPlaying({ term, scene: sceneKey });
                        }}
                        onRead={() => {
                          stopMedia();
                          voice.speak(
                            `${GLOSSARY[term].name}. ${GLOSSARY[term].text}`,
                            "commander",
                            undefined,
                            gender,
                          );
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>,
          ]}
        />
      ) : null}
    </LearningContext.Provider>
  );
}

/** Do not put an information button inside another interactive control. */
export function Term({
  term,
  children,
}: {
  term: LearningTerm;
  children?: ReactNode;
}) {
  const context = useContext(LearningContext);
  const root = useRef<HTMLSpanElement>(null);
  const [canExplain, setCanExplain] = useState(false);
  useLayoutEffect(() => {
    setCanExplain(
      !root.current?.parentElement?.closest(
        'button, a, input, select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"]',
      ),
    );
  }, []);
  return (
    <span className="learning-term" ref={root}>
      {children ?? GLOSSARY[term].name}
      {context && canExplain ? (
        <button
          type="button"
          className="learning-info"
          aria-label={`Explain ${GLOSSARY[term].name}`}
          title={`What is ${GLOSSARY[term].name}?`}
          onClick={() => context.open(term)}
        >
          <Info size={15} />
        </button>
      ) : null}
    </span>
  );
}

export function LearningControls({ onOpen }: { onOpen?: () => void } = {}) {
  const context = useContext(LearningContext);
  if (!context) return null;
  return (
    <button
      className="conversation-icon labeled-control"
      aria-label="Open space keywords"
      title="Space keywords"
      onClick={() => {
        onOpen?.();
        context.open("context");
      }}
    >
      <BookOpen size={20} />
      <span>Keywords</span>
    </button>
  );
}

export function HintButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      className="game-hint"
      disabled={disabled}
      aria-label="Hint: show the next action"
      onClick={() => window.dispatchEvent(new Event("replay-game-help"))}
    >
      <Lightbulb size={19} />
      <span>Hint</span>
    </button>
  );
}

export function LearningText({ text }: { text: string }) {
  const context = useContext(LearningContext);
  const id = useId();
  const registerText = context?.registerText;
  useEffect(() => registerText?.(id, text), [id, text, registerText]);
  const pieces: ReactNode[] = [];
  let end = 0;
  for (const match of matchLearningTerms(text)) {
    pieces.push(text.slice(end, match.start));
    pieces.push(
      <Term key={match.start} term={match.term}>
        {text.slice(match.start, match.end)}
      </Term>,
    );
    end = match.end;
  }
  pieces.push(text.slice(end));
  return <>{pieces}</>;
}
