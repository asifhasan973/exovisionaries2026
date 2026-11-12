import { Volume2 } from "lucide-react";
import { GLOSSARY, type LearningTerm } from "./glossary";
import { KeywordMediaCarousel } from "./KeywordCarousel";

export function KeywordCard({
  term,
  playing,
  onPlay,
  onStop,
  onRead,
}: {
  term: LearningTerm;
  playing: boolean;
  onPlay(): void;
  onStop(): void;
  onRead(): void;
}) {
  const entry = GLOSSARY[term];
  return (
    <article className="keyword-card" aria-label={entry.name}>
      <h3 tabIndex={-1}>{entry.name}</h3>
      <p>{entry.text}</p>
      <KeywordMediaCarousel
        term={term}
        playing={playing}
        onPlay={onPlay}
        onStop={onStop}
      />
      <button
        className="game-info-trigger"
        onClick={onRead}
        aria-label={`Read aloud: ${entry.name}`}
      >
        <Volume2 size={18} />
        Read aloud
      </button>
    </article>
  );
}
