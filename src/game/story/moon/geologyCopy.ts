import {SCIENCE_LINES} from './scienceCopy.ts';
export const GEOLOGY_LINES={...SCIENCE_LINES,
 recovery:'Park, relay, seal samples, then check our crew.',
 samplesStowed:'Samples sealed and labeled. Ready to bring them home!',
 plan:'Pick a rock site. Survey it, then collect and test a sample.',survey:'Camera and fitted radar are surveying this patch.',
 drill:'Collecting a sample! A deeper drill uses more energy.',analysis:'Testing the rock with the tools you packed.',
 clue:'Picture saved. Collect and test a rock for stronger clues.',report:'Match the rock type to the tool cards.',
 sampleFirst:'Pictures alone cannot name a rock. Use a mineral or element tool.',
 inconclusive:'Still unsure. Save the clues without guessing the rock type.',
 confirm:'The rock clues agree! Send this finding to our team.',
 sensorSite:'Put the sensor on quiet ground, away from our wheels.',
 sensorWrong:'Wheels shake the sensor. Place it on the ground instead.',
 listening:'Listening to ground shakes. A signal is not a map of the Moon’s inside.',
 sampleLimit:'Sample box full. Keep the samples we already collected.',
 thermal:'Too cold for this kit. Try the light-rock patch.',
} as const;
export const GEOLOGY_LABELS={anorthosite:'Ancient crust rock',basalt:'Lava rock',breccia:'Impact-mixed rock',inconclusive:'Need more evidence'} as const;
export const GEOLOGY_SITE_BRIEFING=[{id:'geo-site-01',text:'Choose highlands for ancient crust, or an old crater for impact clues.',sourceSpeaker:'Commander',speaker:{character:'commander',expression:'curious',pose:'point'}}] as const;
