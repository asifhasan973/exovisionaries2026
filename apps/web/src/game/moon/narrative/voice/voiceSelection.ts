import type { StoryCharacterId } from "@/game/moon/core/types";

/** Prefer a natural voice and never select the same known female default for Chief. */
export function selectCharacterVoice(
  voices: readonly SpeechSynthesisVoice[],
  character: StoryCharacterId,
  gender: "male" | "female" = "female",
) {
  const male =
    /Guy|Andrew|Brian|Ryan|Daniel|Alex|David|Aaron|Arthur|Tom|Rishi|\bMale\b/i;
  const female =
    /Sonia|Aria|Jenny|Ava|Emma|Samantha|Karen|Serena|Victoria|Zira|Susan|\bFemale\b/i;
  const useMale = character === "chief" || gender === "male";
  if (character === "chief") {
    const directorVoice = voices.find((voice) =>
      /Guy|David|Arthur|Aaron/i.test(voice.name),
    );
    if (directorVoice) return directorVoice;
  }
  if (character === "commander" && useMale) {
    const distinctVoice = voices.find((voice) =>
      /Andrew|Ryan|Brian|Daniel|Alex/i.test(voice.name),
    );
    if (distinctVoice) return distinctVoice;
  }
  const matches = voices.filter((voice) =>
    (useMale ? male : female).test(voice.name),
  );
  return (
    matches.find((voice) =>
      /Natural|Neural|Enhanced|Premium/i.test(voice.name),
    ) ??
    matches[0] ??
    voices.find(
      (voice) => !(useMale ? female : male).test(voice.name) && voice.default,
    ) ??
    voices.find((voice) => !(useMale ? female : male).test(voice.name)) ??
    voices[useMale ? 0 : Math.min(1, voices.length - 1)]
  );
}
