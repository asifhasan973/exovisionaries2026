# MISSION FORGE — Assumptions & Engineering Boundaries

This document details the quantitative, architectural, and educational assumptions authored for **Phase 1: Crewed Moon Mission**.

---

## 1. Budget Model ($2,620M Game Planning Cap)

The budget structure uses authored educational planning allocations rather than commercial vendor quotes:

| Line Item | Game Allocation | Status | Notes |
|---|---|---|---|
| Heavy-Lift Launch Vehicle / Service Package | $1,400M | Included Package | Covers Stage 1, Stage 2, Stage 3, and Instrument Unit. |
| Crew Command Module | $350M | Included Package | Includes pressure vessel, heat shield, parachutes, ECLSS, and primary avionics. |
| Service Module (SM) | $180M | Included Package | Includes SPS engine, fuel cell bus, and high-gain antenna mast. |
| Reserved Lunar-Payload Package | $300M | Included Package | Reserved stowed lunar lander & surface package (stowed in SLA fairing). |
| Systems Integration & Qualification | $100M | Included Package | Multi-stage interface testing and human-rating qualification. |
| Ground & Launch Operations | $70M | Included Package | Pad infrastructure, propellant loading, range safety, and telemetry tracking. |
| **Mandatory Base Total** | **$2,400M** | Base Commitment | Fixed allocation for core flight-worthy vehicle. |
| Reserved Contingency | $200M | Reserve | Untouchable reserve for mission contingency. |
| Configurable Science & Upgrade Allowance | $20M | Discretionary Cap | Available discretionary allowance for science instruments and upgrades. |
| **Overall Game Planning Cap** | **$2,620M** | Maximum Cap | Maximum total mission budget envelope. |

**Accounting Rules:**
- Core components included in a parent package have visible engineering mass and power characteristics, but no second retail fee.
- Unused discretionary allowance is not spent.
- Over-spending beyond $20M triggers a Launch Blocker.

---

## 2. Mass & Payload Allowances

- **Science Payload Rack Rating**: Maximum **250 kg**. Exceeding 250 kg compromises stage 3 insertion mass margin and triggers a Launch Blocker.
- **Crew Consumables Planning Allowance**: Documented **120 kg per seat** (82 kg astronaut + 38 kg IVA space suit, personal equipment, ascent life support consumables).
- **Gross Liftoff Weight (GLOW)**: Approximately 2,900,000 kg fully fueled on the pad.

---

## 3. Reference Ascent Flight Profile

- **Inspiration**: NASA Apollo 10 & Saturn V historical flight parameters.
- **Flight Milestones**:
  - `T-0s`: Liftoff from LC-39A with 5x F-1 engines (34.5 MN total thrust).
  - `T+72s`: Max-Q at 13 km altitude, ~Mach 1.6, dynamic pressure ~33 kPa.
  - `T+162s`: S-IC booster cutoff and stage separation at 67 km, 2,750 m/s. S-II hydrolox second stage ignites.
  - `T+195s`: Launch Escape System (LES) tower jettison at 95 km.
  - `T+520s`: S-II second stage cutoff and separation at 175 km, 6,850 m/s.
  - `T+530s`: S-IVB third stage single J-2 engine ignites for orbital insertion burn.
  - `T+695s`: Orbital insertion cutoff (SECO-1) at 185 km, 7,800 m/s.
  - `T+720s`: Circular 185-km Earth parking orbit confirmed. Spacecraft enters quiet coast attached to the S-IVB stage.
- **Chapter Boundary**:
  - Phase 1 terminates with the spacecraft securely in Earth parking orbit.
  - In accordance with Apollo 10 and 11 flight procedures, the departure stage remains attached for translunar injection (TLI) in Chapter 2.

---

## 4. Scientific Sensors & VIPER Instrumentation Reference

Sensors are adapted from documented NASA lunar polar missions (such as the VIPER rover payload):
- **Pulsed Neutron Spectrometer**: Detects hydrogen-related epithermal neutron leakage to 1 m depth. Indicates water presence, but not direct proof on its own.
- **Near-Infrared Volatiles Spectrometer**: Surface volatile reflectance and mineral absorption bands. Requires active illumination in shadow.
- **Subsurface Core Drill**: 1.5-meter rotary-percussive drill for sampling buried permafrost layers.
- **MSolo Mass Spectrometer**: Real-time mass analysis of volatile gases escaping during core extraction.
