import { useStoryNavigation } from './storyNavigationContext.ts';
import { MILESTONES } from './missionMilestones.ts';
import './milestones.css';

export function MilestoneRing(){
  const navigation=useStoryNavigation();if(!navigation||navigation.card)return null;
  const {index,percent,milestone}=navigation.progress;
  return <button className="mission-progress-ring" onClick={navigation.overview} aria-label={`${milestone.name}, milestone ${index+1} of ${MILESTONES.length}, ${percent}% complete. Open mission map.`} title={`${index+1}/${MILESTONES.length} · ${milestone.name}`}>
    <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><circle className="mission-progress-arc" cx="26" cy="26" r="23" pathLength="100" strokeDasharray={`${percent} 100`}/></svg>
    <span><strong>{percent}%</strong><small>{index+1}/{MILESTONES.length}</small></span>
  </button>;
}
