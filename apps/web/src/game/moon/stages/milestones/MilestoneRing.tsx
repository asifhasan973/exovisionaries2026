import { useStoryNavigation } from "@/game/moon/core/storyNavigationContext";
import { MILESTONES } from "@/game/moon/core/missionMilestones";
import { ProgressRing } from "@exo/ui";
import "@/shared/shell/missionExperience.css";

export function MilestoneRing() {
  const navigation = useStoryNavigation();
  if (!navigation || navigation.card) return null;
  const { index, percent, milestone } = navigation.progress;

  return (
    <ProgressRing
      percent={percent}
      current={index + 1}
      total={MILESTONES.length}
      label={`${milestone.name}, milestone ${index + 1} of ${MILESTONES.length}, ${percent}% complete. Open mission map.`}
      title={`${index + 1}/${MILESTONES.length} · ${milestone.name}`}
      onClick={navigation.overview}
    />
  );
}
