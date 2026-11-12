import type { LearningTerm } from "./glossary";

export type KeywordMedia = {
  kind: "image" | "video" | "youtube";
  src: string;
  alt: string;
  source?: string;
  sourceUrl?: string;
  videoId?: string;
  caption?: string;
};

/** Only supplied, inspected media; unrelated pictures are intentionally omitted. */
export const KEYWORD_MEDIA: Partial<
  Record<LearningTerm, readonly KeywordMedia[]>
> = {
  crater: [
    {
      kind: "image",
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTi0yQ2FmLUjbpDLa3KwKpKcUb5axkElv3Rv7zjJOPt9BKlcDA7TDRSIU&s=10",
      alt: "A raised crater rim around a deep bowl.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTi0yQ2FmLUjbpDLa3KwKpKcUb5axkElv3Rv7zjJOPt9BKlcDA7TDRSIU&s=10",
    },
    {
      kind: "youtube",
      src: "https://youtu.be/2iSZMv64wuU?si=fDNvxfY_xN9Vvyxx",
      alt: "NASA | Tour of the Moon",
      source: "YouTube",
      sourceUrl: "https://youtu.be/2iSZMv64wuU?si=fDNvxfY_xN9Vvyxx",
      videoId: "2iSZMv64wuU",
    },
  ],
  shadow: [
    {
      kind: "image",
      src: "https://svs.gsfc.nasa.gov/vis/a000000/a004000/a004043/shot1_on.0420.jpg",
      alt: "Sunlight and shadow near the Moon’s pole.",
      source: "NASA",
      sourceUrl:
        "https://svs.gsfc.nasa.gov/vis/a000000/a004000/a004043/shot1_on.0420.jpg",
    },
    {
      kind: "youtube",
      src: "https://youtu.be/X_lBCVx-L1s?si=p5eXgQi6DuxH9LTb",
      alt: "The Moon’s Permanent Shadows",
      source: "YouTube",
      sourceUrl: "https://youtu.be/X_lBCVx-L1s?si=p5eXgQi6DuxH9LTb",
      videoId: "X_lBCVx-L1s",
    },
  ],
  lander: [
    {
      kind: "image",
      src: "https://www.nasa.gov/wp-content/uploads/2026/03/clps-nova-d-1.png?w=1939",
      alt: "A robotic Moon lander.",
      source: "NASA",
      sourceUrl:
        "https://www.nasa.gov/wp-content/uploads/2026/03/clps-nova-d-1.png?w=1939",
    },
  ],
  adapter: [
    {
      kind: "image",
      src: "https://www.nasa.gov/wp-content/uploads/2023/03/2015-2189.jpg",
      alt: "A spacecraft adapter during assembly.",
      source: "NASA",
      sourceUrl:
        "https://www.nasa.gov/wp-content/uploads/2023/03/2015-2189.jpg",
    },
    {
      kind: "image",
      src: "https://www.nasa.gov/wp-content/uploads/2024/07/b1b-crew-rev-33-expanded-with-inset4.png",
      alt: "Rocket parts, including adapters and the payload.",
      source: "NASA",
      sourceUrl:
        "https://www.nasa.gov/wp-content/uploads/2024/07/b1b-crew-rev-33-expanded-with-inset4.png",
    },
  ],
  anorthosite: [
    {
      kind: "image",
      src: "https://airandspace.si.edu/sites/default/files/styles/callout_half/public/images/5288h.jpg.webp?itok=9kBhsd19",
      alt: "A pale sample of ancient Moon crust.",
      source: "Smithsonian",
      sourceUrl:
        "https://airandspace.si.edu/sites/default/files/styles/callout_half/public/images/5288h.jpg.webp?itok=9kBhsd19",
    },
    {
      kind: "image",
      src: "https://airandspace.si.edu/sites/default/files/styles/body_large/public/images/5293h.jpg.webp?itok=QfwNAGGr",
      alt: "The Moon’s old highlands.",
      source: "Smithsonian",
      sourceUrl:
        "https://airandspace.si.edu/sites/default/files/styles/body_large/public/images/5293h.jpg.webp?itok=QfwNAGGr",
    },
  ],
  ejecta: [
    {
      kind: "image",
      src: "https://www.lpi.usra.edu/exploration/training/illustrations/impactEjecta/preview/03.jpg",
      alt: "Material thrown out around impact craters.",
      source: "Lunar and Planetary Institute",
      sourceUrl:
        "https://www.lpi.usra.edu/exploration/training/illustrations/impactEjecta/preview/03.jpg",
    },
    {
      kind: "image",
      src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/p/i/a/PIA15044_hires.jpg?w=1024&h=1024&fit=clip&crop=faces%2Cfocalpoint",
      alt: "Rock and dust spread around a crater.",
      source: "NASA",
      sourceUrl:
        "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/p/i/a/PIA15044_hires.jpg?w=1024&h=1024&fit=clip&crop=faces%2Cfocalpoint",
    },
  ],
  docking: [
    {
      kind: "image",
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdxPhlsg4jhuE5uPrJWt84m7t5w1WdwNdE-Wd_pRWywNUC8jDdxlf4jMGd&s=10",
      alt: "Spacecraft lining up to join.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdxPhlsg4jhuE5uPrJWt84m7t5w1WdwNdE-Wd_pRWywNUC8jDdxlf4jMGd&s=10",
    },
    {
      kind: "image",
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfeIdO7-_pgzw8AJb_qYWRqaOfWY0QfpjlvQtTbWjEs_Oq7Pz5HtMIogdD&s=10",
      alt: "Two spacecraft joining together.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfeIdO7-_pgzw8AJb_qYWRqaOfWY0QfpjlvQtTbWjEs_Oq7Pz5HtMIogdD&s=10",
    },
  ],
  thrust: [
    {
      kind: "image",
      src: "https://miro.medium.com/v2/resize:fit:1400/1*8-7DkmPeGT9c_kYSCrmk2w.png",
      alt: "An illustration of a rocket engine pushing a spacecraft.",
      source: "Supplied media",
      sourceUrl:
        "https://miro.medium.com/v2/resize:fit:1400/1*8-7DkmPeGT9c_kYSCrmk2w.png",
    },
  ],
  flyby: [
    {
      kind: "youtube",
      src: "https://youtu.be/_rVSnxIFAws?si=PdYPDrV3W77ga5-y",
      alt: "The Artemis Trajectory: Orbital Mechanics of a Lunar Flyby",
      source: "YouTube",
      sourceUrl: "https://youtu.be/_rVSnxIFAws?si=PdYPDrV3W77ga5-y",
      videoId: "_rVSnxIFAws",
    },
  ],
  gpr: [
    {
      kind: "image",
      src: "https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/detail_files/3/3160_Putzig_a_radargram-full2.jpg",
      alt: "Radar echoes showing underground layers on Mars.",
      caption: "Radar example from Mars",
      source: "NASA",
      sourceUrl:
        "https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/detail_files/3/3160_Putzig_a_radargram-full2.jpg",
    },
  ],
  heatshield: [
    {
      kind: "image",
      src: "https://cdn.mos.cms.futurecdn.net/PHnniuyeamj7XZQAPvGRDY-1200-80.jpg",
      alt: "A spacecraft protected during a hot return.",
      source: "Supplied media",
      sourceUrl:
        "https://cdn.mos.cms.futurecdn.net/PHnniuyeamj7XZQAPvGRDY-1200-80.jpg",
    },
  ],
  rocketequation: [
    {
      kind: "image",
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpdm4a8Zo9Z8Bz4dJ1umWAP4zRTo0At75IcLvewEw-ziFWfxhpOddOf2o&s=10",
      alt: "NASA’s diagram of the ideal rocket equation.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpdm4a8Zo9Z8Bz4dJ1umWAP4zRTo0At75IcLvewEw-ziFWfxhpOddOf2o&s=10",
    },
  ],
  breccia: [
    {
      kind: "image",
      src: "https://static.toiimg.com/thumb/msid-135461856,imgsize-141641,width-400,height-225,resizemode-4/scientists-find-rare-rock-formed-by-carbon-rich-asteroid-impact-in-moon-dust-that-may-explain-how-water-reached-the-lunar-surface.jpg",
      alt: "A piece of impact-mixed Moon rock.",
      source: "Supplied media",
      sourceUrl:
        "https://static.toiimg.com/thumb/msid-135461856,imgsize-141641,width-400,height-225,resizemode-4/scientists-find-rare-rock-formed-by-carbon-rich-asteroid-impact-in-moon-dust-that-may-explain-how-water-reached-the-lunar-surface.jpg",
    },
  ],
  lunarorbit: [
    {
      kind: "image",
      src: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Earth_rising_behind_the_Moon.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original",
      alt: "An illustration of a spacecraft near the Moon.",
      source: "Supplied media",
      sourceUrl:
        "https://upload.wikimedia.org/wikipedia/commons/a/a4/Earth_rising_behind_the_Moon.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original",
    },
  ],
  moontransfer: [
    {
      kind: "image",
      src: "https://media.esa.int/legacy/web/images/esa_multimedia/images/2007/12/chandrayaan-1_mission_profile/10241670-2-eng-GB/126899/image-thumb__126899__fit_large/Chandrayaan-1_mission_profile~-~media--9a2dd926--query.a94f3698.webp",
      alt: "Chandrayaan-1’s route to the Moon.",
      source: "ESA",
      sourceUrl:
        "https://media.esa.int/legacy/web/images/esa_multimedia/images/2007/12/chandrayaan-1_mission_profile/10241670-2-eng-GB/126899/image-thumb__126899__fit_large/Chandrayaan-1_mission_profile~-~media--9a2dd926--query.a94f3698.webp",
    },
  ],
  seismometer: [
    {
      kind: "image",
      src: "https://assets.science.nasa.gov/content/dam/science/psd/lunar-science/2023/09/AS11-40-5948HR.jpg",
      alt: "An Apollo science instrument on the Moon.",
      source: "NASA",
      sourceUrl:
        "https://assets.science.nasa.gov/content/dam/science/psd/lunar-science/2023/09/AS11-40-5948HR.jpg",
    },
    {
      kind: "image",
      src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/lunar-science/2023/08/371255main_Seismic_1600.jpg?w=1536&h=864&fit=crop&crop=faces%2Cfocalpoint",
      alt: "An astronaut with a Moonquake sensor.",
      source: "NASA",
      sourceUrl:
        "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/lunar-science/2023/08/371255main_Seismic_1600.jpg?w=1536&h=864&fit=crop&crop=faces%2Cfocalpoint",
    },
  ],
  msolo: [
    {
      kind: "image",
      src: "https://images-assets.nasa.gov/image/KSC-20230621-PH-KLS01_0053/KSC-20230621-PH-KLS01_0053~large.jpg",
      alt: "Testing the MSOLO instrument.",
      source: "NASA",
      sourceUrl:
        "https://images-assets.nasa.gov/image/KSC-20230621-PH-KLS01_0053/KSC-20230621-PH-KLS01_0053~large.jpg",
    },
  ],
  nirvss: [
    {
      kind: "image",
      src: "https://www.nasa.gov/wp-content/uploads/2023/03/nirvss.jpg",
      alt: "The NIRVSS instrument.",
      source: "NASA",
      sourceUrl: "https://www.nasa.gov/wp-content/uploads/2023/03/nirvss.jpg",
    },
  ],
  nss: [
    {
      kind: "image",
      src: "https://www.nasa.gov/wp-content/uploads/2026/03/nss-neutron-spectrometer-system.jpg?w=1431",
      alt: "The Neutron Spectrometer System.",
      source: "NASA",
      sourceUrl:
        "https://www.nasa.gov/wp-content/uploads/2026/03/nss-neutron-spectrometer-system.jpg?w=1431",
    },
  ],
  rendezvous: [
    {
      kind: "image",
      src: "https://i0.wp.com/www.drewexmachina.com/wp-content/uploads/2015/10/Gemini_6_7_artist_concept.jpg",
      alt: "Two spacecraft meeting in orbit.",
      source: "Supplied media",
      sourceUrl:
        "https://i0.wp.com/www.drewexmachina.com/wp-content/uploads/2015/10/Gemini_6_7_artist_concept.jpg",
    },
  ],
  radiation: [
    {
      kind: "image",
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRO2oUuOAHDf9Rx27i1eQnoJ3_QjwO311aeksI5YzpEfqKhvLfMWqOLJI8I&s=10",
      alt: "An illustration of radiation reaching space near Earth.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRO2oUuOAHDf9Rx27i1eQnoJ3_QjwO311aeksI5YzpEfqKhvLfMWqOLJI8I&s=10",
    },
  ],
  spaceweather: [
    {
      kind: "image",
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSI9mgcGXBvTdyze2AEoj5DXc40sbCDupmjF99joe81yblIUtY8RqPhwgLV&s=10",
      alt: "An illustration of activity from the Sun reaching Earth.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSI9mgcGXBvTdyze2AEoj5DXc40sbCDupmjF99joe81yblIUtY8RqPhwgLV&s=10",
    },
  ],
  stereocamera: [
    {
      kind: "image",
      src: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTei8AEJxD4xKxIMgvxbTTJIoQgwZNf1MrI8SFSFnKU-WYJi7Hw",
      alt: "Engineers with a stereo camera.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTei8AEJxD4xKxIMgvxbTTJIoQgwZNf1MrI8SFSFnKU-WYJi7Hw",
    },
    {
      kind: "image",
      src: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRYsiyhqzlEPnnhgkXBSk6E2NeOmvDD4_xuqiHjwyuLs2zDmsK7",
      alt: "A stereo camera during testing.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRYsiyhqzlEPnnhgkXBSk6E2NeOmvDD4_xuqiHjwyuLs2zDmsK7",
    },
  ],
  thermal: [
    {
      kind: "image",
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1t1yYGCybsr8OPcTeo-uadrN8ieHvcUnFR0kYh1qHxg&s=10",
      alt: "A protected spacecraft returning through hot air.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1t1yYGCybsr8OPcTeo-uadrN8ieHvcUnFR0kYh1qHxg&s=10",
    },
  ],
  trajectory: [
    {
      kind: "image",
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXhwNeiH9-1iHHOgOUN46uIUaYwkp1q-5PgTxLawnQ6y4Fl9gdhYEMjnTS&s=10",
      alt: "The Cassini spacecraft’s path through space.",
      source: "Supplied media",
      sourceUrl:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXhwNeiH9-1iHHOgOUN46uIUaYwkp1q-5PgTxLawnQ6y4Fl9gdhYEMjnTS&s=10",
    },
  ],
  xrd: [
    {
      kind: "image",
      src: "https://ares.jsc.nasa.gov/_pictures/_laboratories/x-ray-diffraction.png",
      alt: "A scientist working with X-ray equipment.",
      source: "NASA",
      sourceUrl:
        "https://ares.jsc.nasa.gov/_pictures/_laboratories/x-ray-diffraction.png",
    },
  ],
  xrf: [
    {
      kind: "image",
      src: "https://blogs.esa.int/exploration/files/2022/04/IMG_7768.jpg",
      alt: "An X-ray tool for studying rock ingredients.",
      source: "ESA",
      sourceUrl: "https://blogs.esa.int/exploration/files/2022/04/IMG_7768.jpg",
    },
  ],
};
