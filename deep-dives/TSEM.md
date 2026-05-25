# TSEM — Tower Semiconductor | Deep Dive
---

## Supercycle: DB1 Photonics (SiPh Foundry Layer)

## The "Mini TSMC" for Silicon Photonics

Every SiPh chip needs a foundry. Tower holds ~85% SiPh foundry share. The PH18 platform supports 100G through 1.6T for AI datacenter networking. $920M CapEx to 5x capacity. >70% already reserved/prepaid through 2028.

"By betting big on the optical interconnects that make AI data centers possible, TSEM has positioned itself for a multi-year growth cycle that traditional foundries may struggle to match."

## Key Financials

- FY2025: $1.57B revenue. Q4 $440M record. Net profit $220M.
- **SiPh revenue doubled: $106M (2024) → $228M (2025) (+115%)**
- Q1 2026 guided: $412M ±5%
- Sequential revenue and profitability growth throughout 2026
- **2028 model: $2.84B revenue, 39-40% GM, 31.7% OP margin, $750M NP**
- GM currently ~23% → targeting ~40% as SiPh mix increases (margins TRIPLE)

## The $920M Capacity Expansion

- 5x SiPh + SiGe capacity by Q4 2026
- **>70% of new capacity already reserved/prepaid through 2028**
- 28% of CapEx already spent
- Continuous tool qualification through 2026
- Intel Foundry (New Mexico): cap-light 300mm scaling for power/RF
- Customer prepayments = demand visibility + reduced TSEM cash risk

## Technology Partnerships

| Partner | Application | Status |
|---------|------------|--------|
| Coherent | 400 Gbps/lane SiPh demo | Production-ready (March 2026) |
| Xanadu | Quantum photonic computing | Custom material stack |
| Scintil | Heterogeneous III-V integration | PH18DA platform |
| Salience Labs | Optical Circuit Switches for AI DC | Pre-production |
| Oriole Networks | Nanosecond OCS for AI networking | Collaboration |

## Soitec Connection (Layer -1 → Layer 0)

Every SiPh wafer Tower fabricates sits on a **Soitec Photonics-SOI substrate** (>95% monopoly). When Tower 5x's capacity, it needs 5x more Soitec wafers. The supply chain is locked:

```
Soitec (SOI.PA) → Photonics-SOI substrate
  └── Tower (TSEM) → fabricates SiPh chips on the substrate
      └── SiPh chips go into transceivers (AAOI, COHR, LITE)
          └── with CW lasers from SIVE
              └── tested by AEHR WLBI
```

## Scoring Breakdown

| Category | Score | Evidence |
|----------|-------|---------|
| Core Thesis | 15/20 | ~85% SiPh foundry share. PH18 qualified for 1.6T. $920M expansion, >70% prepaid. BUT: TSMC COUPE entering (-2), GF expanding (-1), foundry substitutable given time (-2). |
| Cycle Stage | 8/10 | SiPh doubled. Q4 record. 5x expansion funded. >70% reserved. Growing sequentially. |
| TAM | 8/10 | SiPh foundry $500M→$3-5B. Power + RF + quantum. Phase 1+2. |
| Catalysts | 5/5 | Q1 May 13 🔥. 5x capacity Q4 2026. 2028 model. NVIDIA ramp. Quantum. |
| Macro | 8/10 | 120-150 GW. CPO pulled forward. Every SiPh chip needs a foundry. |
| Alpha | 2/5 | ~15 analysts. Thesis well-covered. Multiple public deep dives. |
| Risks | -2 | TSMC COUPE competition (-1). GM 23% needs to reach 40% (-1). |
| **Base** | **49/60 (82%)** | |

## $290M Prepayments + $1.3B Contracted SiPh (Q1 2026 Earnings)

Q1 2026: Revenue $414M (+15% YoY), beat estimates. EPS $0.65 vs $0.55 est (+18% beat). Gross profit $111M (+52% YoY). OP $65M (nearly doubled). Q2 guided $455M (RECORD, +22% YoY).

$290M prepayments from SiPh customers in a single quarter. Customers PAYING UPFRONT to lock foundry capacity — same pattern as NBIS ("customers competing for every GPU") and SK Hynix (hyperscalers funding fabs). Extreme demand stickiness.

$1.3B CONTRACTED SiPh revenue for 2027. SiPh growing from $228M (FY2025) to $1.3B contracted (FY2027) = 5.7x in 2 years. This is contracted, not estimated — revenue locked in.

SOI.PA upstream connection: Tower's $1.3B contracted SiPh = ~$200-400M SOI.PA Photonics-SOI wafer demand LOCKED upstream. Tower can't make SiPh PICs without SOI.PA wafers.

## $193B Photonics TAM — SiPh Foundry Monopoly (May 2026)

Tower is THE SiPh foundry (~85% share). PH18 process fabricates SiPh PICs for BOTH CPO and pluggable. Every SiPh chip in the $193B photonics TAM goes through Tower or GFS. SiPh pluggable at 1.6T "dominant almost out of the gate" (Irrational Analysis) = Tower already fabricating pluggable SiPh PICs at volume.

$1.3B contracted SiPh for 2027 may be conservative given full $193B photonics demand stacking (pluggable + CPO simultaneously).

Three independent sources naming Tower directly: FundaAI ($TSEM named as TPU v9 beneficiary, "higher-end PIC platforms"), Irrational Analysis ("Tower Semi going to the moon, people paying upfront for capacity"), Serenity ("InP shortage forces SiPh, SiPh needs SOI" = more SiPh = more Tower).

Revised revenue trajectory: FY2027 $2.7-2.9B, FY2028 $3.0-3.2B, FY2030 $4.5-5.5B.

## SiPh Production Partnership Ecosystem

$920M capex expansion (3x prior estimate of $350M). >5x SiPh wafer starts by end 2026. Patent suit vs GFS on SiPh = offensive IP defense.

Active production partnerships confirming platform breadth:
- Coherent: 400Gbps/lane silicon modulator
- Xanadu: quantum photonics
- Scintil: DWDM CPO lasers
- Salience: optical switches
- Axiro: defense radar

## Ceiling — v4.0 AH-1 Full Derivation (Aggressive OP ramp, 30x SiPh monopoly, single-number FY2029)

### Revenue Model (consistent growth, no cliff):

SiPh growing 5.7x in 2 years ($228M→$1.3B contracted). Growth doesn't suddenly decelerate — $193B photonics TAM pulls demand through.

| Year | Revenue | Growth | Source |
|------|---------|--------|--------|
| FY2026 | ~$1.90B | +14% | Q1 $414M + Q2 $455M guided |
| FY2027 | $2.80B | +47% | $1.3B SiPh contracted + legacy |
| FY2028 | $3.80B | +36% | SiPh continues ramping |
| FY2029 | $4.80B | +26% | Decelerating but $193B TAM pulling |
| FY2030 | $5.80B | +21% | Maturing |

### Full Valuation Table (Aggressive OP ramp, 30x, ~112M shares):

$290M prepayments = customers begging for capacity. Same pricing power as SK Hynix at full utilization. TSMC went 25%→45% OP during chip shortage. TSEM with 85% SiPh monopoly and prepaying customers ramps margins faster than typical foundry.

| Year | Revenue | OP Margin | OP | × 30x | Per Share |
|------|---------|-----------|-----|-------|-----------| 
| 2027 | $2.80B | 22% | $616M | $18.5B | $165 |
| 2028 | $3.80B | 28% | $1.06B | $31.9B | $285 |
| 2029 | $4.80B | 32% | $1.54B | $46.1B | $411 |
| 2030 | $5.80B | 34% | $1.97B | $59.2B | $528 |

FY2028 at $285 vs current $264 — market pricing ~15 months forward. Consistent with pattern.

### Ceiling Derivation:

  FY2029: $4.80B × 32% OP = $1.54B × 30x = $46.1B / 112M shares = $411

CEILING: $411 (single number, FY2029 forward)

## TSMC COUPE — The Competitive Threat

TSMC entering SiPh production with COUPE in H2 2026 is the biggest risk. If TSMC captures significant SiPh share, Tower's ~85% dominance could compress to 50-60%. However:
- Tower has qualification lead (years of customer recipes)
- Switching foundries = 12-18 month requalification
- >70% prepaid capacity through 2028 = locked revenue
- Tower specializes in SiPh; TSMC treats it as one of many platforms

## Key Risks

- TSMC COUPE entering H2 2026 — credible competitive threat
- 2028 model already priced into current stock
- GM 23% → 40% transformation requires perfect execution
- $22B market cap limits asymmetry (framework prefers smaller)
- 15+ analysts = limited information edge

