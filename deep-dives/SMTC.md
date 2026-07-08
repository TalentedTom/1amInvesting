# SMTC — Semtech Corporation | Deep Dive

**Date:** Jun 19, 2026 | **Framework:** v4.2
**Status:** NOT HELD — ⚡ BOTTLENECK-ADJACENT (optical IC supplier, competitive market)
**Base:** 43/60 (72%) | **Price:** $138 | **Shares:** 98M diluted (10-Q Apr 2026) | **MC:** ~$13.5B
**Ceiling:** FY2028 $117

---

## Supercycle: DB1 Photonics / AI DC Interconnect (224G optical ICs for 800G/1.6T/3.2T)

## Core Thesis: The Analog Layer Inside Every Transceiver

Semtech makes the analog/mixed-signal ICs that go INSIDE optical transceivers and CPO modules — transimpedance amplifiers (TIAs), Mach-Zehnder modulator (MZM) drivers, clock-and-data recovery (CDR), and linear drive ICs. Every 800G, 1.6T, and 3.2T transceiver needs these components regardless of who makes the module (InnoLight, Coherent, Lumentum, Jabil).

The key innovation: Semtech's linear drive architecture REMOVES the power-hungry DSP from optical modules while maintaining link integrity. At OFC 2026, Semtech demonstrated live 1.6T interconnects using 224Gbps/lane ICs across LRO, LPO, XPO, NPO, and CPO architectures. This is the broadest 224G product line in the industry — a single IC family that works across ALL optical interconnect architectures, not just one.

CEO Hong Hou (Q1 FY2027): demand "outpacing capacity by about 3x or so" across 800G, 1.6T, LPO, LRO, and laser products. 1.6T ICs have started shipping to a US hyperscaler. Data center revenue growing ~35% sequentially.

The constraint: "gain chip" availability — the III-V laser chips that Semtech's ICs drive. Semtech's own growth is bottlenecked by the same laser shortage that constrains the entire optical chain (the SIVE/LITE/COHR constraint).

---

## Scoring Table

| Category | Score | Evidence |
|---|---|---|
| Core Thesis | 14/20 | 224G leadership across ALL optical architectures (LRO/LPO/XPO/NPO/CPO). Linear drive removes DSP = lower power, lower cost. FiberEdge (optical) + CopperEdge (copper AECs) = comprehensive portfolio. CEO: demand 3x capacity. 1.6T shipping. Penalties: competitive market — Broadcom, Marvell, MACOM all make optical ICs (-2); IoT/LoRa legacy dilutes AI purity (~25% of revenue) (-2); not a monopoly — if SMTC disappeared, AVGO/MRVL take the sockets (-2). |
| Cycle Stage | 9/10 | Record Q1 $291M (+16% YoY). Q2 guided $328M (+13% sequential). Data center +35% sequential. 1.6T ICs shipping. Demand 3x capacity. "Picked up pretty dramatically." |
| TAM | 8/10 | Linear optics market $5B (2024) → $10B+ (2026) = doubling. 224G CPO/NPO/XPO total addressable within Goldman's $193.5B photonics TAM. Evercore on CRDO (similar market): "10-20x TAM expansion." |
| Catalysts | 4/5 | Q2 print (Aug 2026). 1.6T volume ramp. Cellular module divestiture → GM >60%. Gain-chip supply relief = margin acceleration. Linear optics standard adoption. |
| Macro | 9/10 | AI DC interconnect supercycle. 800G→1.6T→3.2T transition. Every AI cluster needs optical ICs regardless of architecture choice. |
| Alpha | 2/5 | 13 analysts. $13.5B MC. Well-covered NASDAQ. Floor score. |
| Risks | -3 | (1) Competitive: AVGO/MRVL/MACOM make similar ICs (-1). (2) Convertible debt $492M — 2030 Notes could dilute shares if stock rises above conversion price (-1). (3) Gain-chip constraint limits near-term revenue regardless of IC demand (-1). |
| **TOTAL** | **43/60** | **72% — WL** |

---

## Ceiling Derivation

**Revenue model (vectors):**

| Vector | FY2027 | FY2028 | FY2029 | FY2030 | Source | AH-7 |
|---|---|---|---|---|---|---|
| V1 FiberEdge Optical ICs (TIA/MZM/CDR 224G) | $550M | $950M | $1,450M | $1,900M | 1.6T shipping, demand 3x, 224G broadest portfolio, CEO guide | HIGH |
| V2 CopperEdge (AECs, retimers) | $250M | $400M | $550M | $650M | ACC standard, competing with CRDO, server attach growing | MEDIUM |
| V3 LoRa / IoT | $350M | $400M | $420M | $440M | Stable, all-time-high LoRa Q1, not AI-driven | HIGH |
| V4 Infrastructure (5G, PON) | $200M | $250M | $280M | $310M | 5G RedCap, PON, stable growth | MEDIUM |
| V5 Other / Services | $100M | $100M | $100M | $100M | Legacy, declining post divestiture | HIGH |
| **TOTAL** | **$1,450M** | **$2,100M** | **$2,800M** | **$3,400M** | | |

**Operating margins:** Q1 FY2027 adj OP margin 20.4%. Cellular module divestiture lifts GM from 52% to >60%. As semiconductor mix grows (higher margin) and IoT/services shrink (lower margin), OP expands toward 28-30%.

| Year | Revenue | OP Margin | OP | × 20x | Per Share |
|------|---------|-----------|-----|-------|-----------|
| 2027 | $1,450M | 22% | $319M | $6.38B | **$65** |
| 2028 | $2,100M | 26% | $546M | $10.92B | **$111** |
| 2029 | $2,800M | 28% | $784M | $15.68B | **$160** |
| 2030 | $3,400M | 30% | $1,020M | $20.40B | **$208** |

Note: 2030 convertible notes ($492M) excluded from current diluted count. If stock rises above conversion price, diluted shares increase to ~105-110M. At 108M shares: FY2028 = $101. Conversion risk is real.

  FY2028: $2,100M × 26% OP = $546M × 20x = $10.92B / 98M shares = **$111**

CEILING: $111 (FY2028 column standard. At conversion-adjusted 108M shares: $101.)

---

## Cross-Book Read-Throughs

**CRDO:** Direct competitor on CopperEdge AECs. CRDO has 88% AEC market share; SMTC is the challenger. Same customers, same racks. The question is whether SMTC's FiberEdge+CopperEdge bundling gives it a packaging advantage vs CRDO's pure-play approach.

**SIVE:** SMTC's growth is bottlenecked by the same laser shortage that SIVE benefits from. SMTC CEO's "demand 3x capacity" quote is partly about gain-chip (laser) availability. More SIVE lasers = more SMTC ICs can ship.

**AAOI:** AAOI makes the transceivers that use SMTC's ICs inside. SMTC is the component supplier to AAOI's module business. AAOI's $471M/month exit rate requires SMTC-class optical ICs at scale.

**LITE/COHR:** Both are vertically integrated (they make their own TIAs/drivers internally). SMTC serves the NON-vertically-integrated module makers (InnoLight, Eoptolink, AAOI, Jabil). This limits SMTC's addressable customer base to ~50-60% of the transceiver market.

---

## Key Risks

1. **Competitive market (-1):** Broadcom, Marvell, and MACOM all make 224G optical ICs. SMTC has no monopoly or chokepoint position. Rule 9 fails: if SMTC disappeared, AVGO/MRVL fill the sockets within 6-12 months.

2. **Convertible debt (-1):** $492M in 2030 convertible notes. If stock exceeds conversion price, diluted shares increase ~10%. Every per-share ceiling number drops proportionally.

3. **Gain-chip constraint (-1):** SMTC's revenue is capped by laser/gain-chip availability, not IC demand. The company can make more ICs than it can sell because the lasers they drive are in shortage. Relief depends on SIVE/LITE/COHR capacity expansion — outside SMTC's control.

---

## Re-Rate Triggers

1. Cellular module divestiture closes → GM >60%, immediate margin step-up
2. Gain-chip supply relief → revenue accelerates toward demand (currently at 33% of demand per CEO)
3. 1.6T volume ramp at named hyperscaler → V1 step-change
4. CPO adoption with SMTC ICs inside → V1 TAM expansion
5. Linear drive standard wins vs DSP → AVGO/MRVL DSP approach loses share

*Initial creation Jun 19, 2026.*
