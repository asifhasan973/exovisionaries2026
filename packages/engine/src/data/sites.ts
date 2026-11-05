// Mission Forge - Landing Site Concepts
import { SiteId } from '../types/mission';

export interface SiteConcept {
  id: SiteId;
  name: string;
  tagline: string;
  badge: string;
  isRecommended: boolean;
  isPlayable: boolean;
  comingSoonReason?: string;
  illumination: string;
  thermalRange: string;
  distanceToIceTargets: string;
  operationalProfile: string;
  engineeringTradeoffs: {
    pros: string[];
    cons: string[];
    readinessRecommendation: string;
  };
  disclaimer: string;
}

export const SITE_CONCEPTS: Record<SiteId, SiteConcept> = {
  ridge: {
    id: 'ridge',
    name: 'High-Illumination Ridge (Shackleton Connecting Ridge)',
    tagline: 'Elevated terrain with extended solar exposure periods and reliable direct-to-Earth line of sight.',
    badge: 'Recommended Concept',
    isRecommended: true,
    isPlayable: true,
    illumination: 'High (~75–85% annual peak illumination)',
    thermalRange: '-50°C to +40°C during lit cycles',
    distanceToIceTargets: '4.5 to 8.0 km traverse down into shadowed cold-traps',
    operationalProfile: 'Maximizes solar array power generation and thermal stability for surface operations, but requires long-distance mobility systems to reach shadowed ice deposits.',
    engineeringTradeoffs: {
      pros: [
        'Prolonged solar power generation minimizes emergency battery reserves',
        'Favorable continuous line-of-sight for direct-to-Earth telemetry',
        'Moderate surface slope simplifies base touchdown logistics'
      ],
      cons: [
        'Greater traverse distance required to collect volatile core samples',
        'Steep switchback terrain descending into target craters'
      ],
      readinessRecommendation: 'Prioritize Context Multi-Spectral Cameras and standard power storage; extra battery upgrades are optional.'
    },
    disclaimer: 'Illustrative planning concept. Not a certified safe landing coordinate or real-time ephemeris site.'
  },
  'crater-rim': {
    id: 'crater-rim',
    name: 'Ice-Proximity Crater Rim (Faustini-Shoemaker Rim)',
    tagline: 'Direct cliff-edge proximity to permanently shadowed crater floors harboring volatile deposits.',
    badge: 'High-Reward Concept',
    isRecommended: false,
    isPlayable: true,
    illumination: 'Moderate & Intermittent (~45–60% illumination with frequent long shadows)',
    thermalRange: '-130°C to +20°C with rapid diurnal drops',
    distanceToIceTargets: '0.8 to 2.2 km direct access to volatile deposits',
    operationalProfile: 'Immediate access to volatile-bearing regolith, but demands rigorous thermal management, navigation sensors for deep shadows, and higher electrical reserves.',
    engineeringTradeoffs: {
      pros: [
        'Short traverses minimize crew exposure and rover battery depletion during sample collection',
        'Direct sensor viewing into deep volatile cold traps'
      ],
      cons: [
        'Frequent periods of low solar angle and shadowing',
        'Stronger reliance on auxiliary battery storage and precision star trackers'
      ],
      readinessRecommendation: 'Recommend equipping the Auxiliary High-Capacity Battery Pack and Precision Star Tracker to handle intermittent shadowing.'
    },
    disclaimer: 'Illustrative planning concept. Not a certified safe landing coordinate or real-time ephemeris site.'
  },
  'shadowed-crater': {
    id: 'shadowed-crater',
    name: 'Permanently Shadowed Region (Deep Cold-Trap Interior)',
    tagline: 'Direct touchdown inside permanent shadow at cryogenic temperatures.',
    badge: 'Advanced Site — Coming Soon',
    isRecommended: false,
    isPlayable: false,
    comingSoonReason: 'The first crewed version plans a sunlit base with later surface access to shadowed science targets, instead of pretending a solar-powered crewed base can operate indefinitely inside permanent shadow without nuclear surface power.',
    illumination: '0% (Continuous deep cryogenic shadow)',
    thermalRange: 'Cryogenic (~40 K / -233°C constant)',
    distanceToIceTargets: '0 km (direct contact with volatile traps)',
    operationalProfile: 'Permanent shadow demands megawatt-scale radioisotope or nuclear surface power systems and extreme cryogenic thermal insulation currently outside Phase 1 mission limits.',
    engineeringTradeoffs: {
      pros: ['Immediate access to pure surface ice frost and deep volatile layers'],
      cons: ['Zero solar illumination; impossible for standard photovoltaic solar architecture'],
      readinessRecommendation: 'Requires future surface fission power modules (Phase 2).'
    },
    disclaimer: 'Illustrative planning concept. Not a certified safe landing coordinate or real-time ephemeris site.'
  }
};
