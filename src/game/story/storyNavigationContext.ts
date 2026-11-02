import { createContext, useContext } from 'react';
import type { milestoneProgress } from './missionMilestones.ts';
export interface StoryNavigation {
  progress:ReturnType<typeof milestoneProgress>;
  reviewing:boolean;
  autoplay:boolean;
  card:boolean;
  skip?():void;
  skipping?:boolean;
  back():void;
  forward():void;
  overview():void;
}
export const StoryNavigationContext=createContext<StoryNavigation|null>(null);
export const useStoryNavigation=()=>useContext(StoryNavigationContext);
