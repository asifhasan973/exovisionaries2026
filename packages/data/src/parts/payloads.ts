import type { PartDefinition } from "../types";

export const PAYLOAD_PARTS: Record<string, PartDefinition> = {
  // Configurable Mission Equipment (Draws from $25M allowance, 250 kg limit)
  "neutron-spectrometer": {
    id: "neutron-spectrometer",
    name: "Pulsed Neutron Spectrometer (PNS)",
    subtitle: "Hydrogen Signature & Water-Ice Prospecting Instrument",
    category: "science",
    compatibleSlots: ["science-slot-1", "science-slot-2"],
    costDollars: 3200000,
    priceStatus: "educationalEstimate",
    massKg: 24,
    massStatus: "sourced",
    powerWatts: 35,
    description:
      "Measures epithermal and thermal neutron flux to detect hydrogen enrichment down to 1 meter depth in lunar regolith.",
    educationalNote:
      "Indicates hydrogen concentration, a critical indicator of water ice or hydrated minerals, though not proof on its own.",
    sourceCitation:
      "NASA Lunar Prospector Neutron Spectrometer Design & Results",
    meshType: "scienceSpectrometer",
  },
  "nir-spectrometer": {
    id: "nir-spectrometer",
    name: "Near-Infrared Volatiles Spectrometer (NIR)",
    subtitle: "Mineral & Volatile Reflectance Mapping Sensor",
    category: "science",
    compatibleSlots: ["science-slot-1", "science-slot-2", "science-slot-3"],
    costDollars: 2800000,
    priceStatus: "educationalEstimate",
    massKg: 18,
    massStatus: "sourced",
    powerWatts: 28,
    description:
      "Analyzes 1.2 to 3.5 micron absorption bands to distinguish surface water frost, hydroxyl radicals, and mineral types with active LED illumination.",
    educationalNote:
      "Requires active lighting when operating in permanent shadow, consuming slightly more power in dark terrain.",
    sourceCitation: "NASA VIPER NIRVSS Instrument Specification",
    meshType: "scienceNIR",
  },
  "subsurface-drill": {
    id: "subsurface-drill",
    name: "Subsurface Core Drill & Sample Assembly",
    subtitle: "1.5-Meter Rotary-Percussive Regolith Core Extractor",
    category: "science",
    compatibleSlots: ["science-slot-3", "science-slot-4"],
    costDollars: 5500000,
    priceStatus: "educationalEstimate",
    massKg: 45,
    massStatus: "sourced",
    powerWatts: 85,
    description:
      "Rotary-percussive drill system designed to acquire intact core segments from cryogenic, cemented regolith up to 1.5 meters deep without melting trapped volatiles.",
    educationalNote:
      "Critical for confirming if subsurface volatile layers exist beneath dry surface desiccation zones.",
    sourceCitation: "NASA TRIDENT Drill Architecture for Polar Lunar Missions",
    meshType: "scienceDrill",
  },
  "mass-spectrometer": {
    id: "mass-spectrometer",
    name: "Sample-Analysis Mass Spectrometer (MSolo)",
    subtitle: "Volatile Gas Release & Isotope Ratio Analyzer",
    category: "science",
    compatibleSlots: ["science-slot-2", "science-slot-3", "science-slot-4"],
    costDollars: 4600000,
    priceStatus: "educationalEstimate",
    massKg: 32,
    massStatus: "sourced",
    powerWatts: 60,
    description:
      "Quadrupole mass spectrometer that sniffs escaping low-molecular volatiles during drilling and analyzes baked core samples for isotopic ratios.",
    educationalNote:
      "Enables identification of carbon monoxide, carbon dioxide, methane, ammonia, and water vapor released from samples.",
    sourceCitation: "NASA MSolo Instrument Suite on Commercial Lunar Landers",
    meshType: "scienceMSolo",
  },
  "nav-context-camera": {
    id: "nav-context-camera",
    name: "Multi-Spectral Navigation & Context Camera Array",
    subtitle: "Stereo Topographic & Hazard Mapping Vision System",
    category: "science",
    compatibleSlots: ["science-slot-1", "science-slot-4"],
    costDollars: 1900000,
    priceStatus: "educationalEstimate",
    massKg: 14,
    massStatus: "sourced",
    powerWatts: 20,
    description:
      "High-dynamic-range stereo cameras with multi-band color filters for terrain elevation mapping, boulder hazard tracking, and photometric surveying.",
    educationalNote:
      "Essential for crew safety and vehicle context during polar operations with low sun angles and long shadows.",
    sourceCitation: "NASA Mastcam / Terrain Hazard Sensor Architectures",
    meshType: "scienceCamera",
  },
  "radiation-monitor": {
    id: "radiation-monitor",
    name: "Lunar Surface Radiation Dosimeter & Sensor",
    subtitle: "Galactic Cosmic Ray & Solar Energetic Particle Monitor",
    category: "science",
    compatibleSlots: ["science-slot-3", "science-slot-4", "upgrade-slot-1"],
    costDollars: 1500000,
    priceStatus: "educationalEstimate",
    massKg: 12,
    massStatus: "sourced",
    powerWatts: 15,
    description:
      "Silicon semiconductor detector telescope measuring absorbed dose and dose equivalent from ionizing galactic cosmic rays and solar proton storms.",
    educationalNote:
      "Provides biological dose monitoring for astronauts and records long-term polar surface radiation background.",
    sourceCitation: "NASA LRO CRaTER Instrument Investigation Team",
    meshType: "scienceRadiation",
  },
};
