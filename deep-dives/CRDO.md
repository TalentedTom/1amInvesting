# CRDO — Credo Technology | Deep Dive
---

## Supercycle: DB1 Photonics / AI Datacenter Connectivity (AEC + Optical DSP + SerDes)

## Core Thesis: The Purple Cable That Keeps AI Training Alive

Credo's Active Electrical Cables (AECs) — the distinctive purple cables — deliver 100x the reliability of optical connections for short-reach AI datacenter links. A single unstable optical link can crash an entire AI training run, costing millions in lost compute time. Credo's AECs solve this with copper-based, zero-flap connectivity at 50% lower power and 75% less volume than alternatives. Three hyperscalers at >10% revenue, fourth ramping, two more in pipeline.

## Key Financials

- Q1 FY2026 (Aug 2025): Revenue $223M (+274% YoY). Non-GAAP NI ~$100M. GM 67.6%.
- **Q3 FY2026 (Feb 2026): Revenue $407M.** 9-Month: $898M.
- FY2026 annualized run rate: **~$1.6B** (from Q3)
- FY2025 full year: ~$250M → FY2026: ~$1.2B+ (5x growth)
- AECs: >95% of product sales growth. Record revenue every quarter.
- Optical: on track to double revenue FY2026. DSPs for 800G/1.6T.
- SerDes IP licensing: 2.7% of revenue but very high margin.
- 3 hyperscalers >10% revenue. 4th achieving material contribution.
- Customer concentration: Top 3 = ~88% of revenue (35%, 33%, 20%).

## Product Portfolio

| Product | Description | Status |
|---------|------------|--------|
| **AECs (Active Electrical Cables)** | Copper with integrated retimer. 100x reliability vs optical. | **Primary revenue driver. Record growth.** |
| **Optical DSPs** | Digital signal processors for optical transceivers (800G/1.6T) | Doubling revenue FY2026. |
| **SerDes IP** | Proprietary serializer/deserializer technology | Licensed + used in own products. Core moat. |
| **PCIe Retimers** | Gen5→Gen6 retimers for CPU-to-GPU links | Design wins CY2025. Production CY2026. |
| **PILOT Software** | Diagnostic/analytics platform | Recurring revenue. |

## Why AECs Win (The Reliability Argument)

In AI training clusters, a single link failure ("flap") can crash an entire training run across thousands of GPUs. The cost of a flap is measured in hours of lost GPU time × thousands of GPUs × hundreds of dollars per GPU-hour = millions of dollars per incident.

Optical connections flap. AECs don't ("ZeroFlap"). For scale-up networks (GPU-to-GPU within a rack or adjacent racks), the reliability advantage is worth more than the bandwidth advantage of optical.

**100x reliability × 50% less power × 75% less volume = AECs dominate short-reach AI datacenter links.**

But there's a ceiling: AECs are copper-based and limited by distance. For scale-out networks (rack-to-rack across a datacenter), optical wins. This is where the framework's photonics positions (SIVE, LITE, COHR) play. AECs and optical are COMPLEMENTARY, not competitive.

## Scoring Breakdown

| Category | Score | Evidence |
|----------|-------|---------|
| Core Thesis | 15/20 | AEC first-mover with 100x reliability. SerDes IP moat. 68.6% GM. 4+ hyperscalers. DustPhotonics acquisition = SiPh PIC vertical integration = "most complete connectivity stack outside Broadcom." Multi-sector SerDes (DC + robots + auto + edge + custom chips). BUT: customer concentration 88% top 3 (-2). Distance ceiling (copper) (-2). Broadcom/Marvell compete (-1). |
| Cycle Stage | 9/10 | Revenue 5x YoY. Q3 $407M. GM 68.6%. 4 hyperscaler customers. Every quarter record. |
| TAM | 8/10 | Multi-sector SerDes: AI DC $10-20B + robots $5B + auto $5B + custom chip IP $5B + edge $3B. AEC + optical + retimers + IP licensing. |
| Catalysts | 4/5 | Q4 FY2026 earnings. 5th/6th hyperscaler. PCIe Gen6 production. ZeroFlap Optics ramp. Robot/auto design wins. |
| Macro | 8/10 | 120-150 GW compute. Every GPU cluster needs connectivity. Multi-sector SerDes demand. |
| Alpha | 1/5 | 15+ analysts. ~$34B MC. Thesis well-known. |
| Risks | -2 | Customer concentration 88% (-1). Copper distance limits (-1). |
| **Base** | **43/60 (72%)** | |

## Ceiling — v4.0 AH-1 Full Derivation (TAM-grounded per-rack math, 40% OP, 25x, blended)

### Per-Rack Connectivity Math:

Current: ~$46K per CRDO-equipped rack (FY2026). 35% rack penetration (3-4 hyperscalers).

| Product | Today | FY2028+ | Per Rack |
|---------|-------|---------|----------|
| AECs (ZeroFlap) | $46K | $60-80K | Volume + 1.6T |
| Optical DSPs | Ramping | $50-100K | 800G/1.6T |
| PCIe Retimers | Design wins | $20-40K | Gen6 production |
| SiPh PICs (DustPhotonics) | Pre-revenue | $50-100K | Vertical integration |
| **Per-rack total** | **$46K** | **$180-320K** | **4-7x today** |

### Revenue Model (Flat 35% penetration, $/rack expands):

Analysts model AECs only ($2.52B FY2027). TAM model adds 3 product vectors (optical DSP, SiPh PIC, PCIe retimer) that stack on top of AECs as $/rack goes $46K→$120K→$200K→$280K.

| Year | Racks/yr | × 35% | $/Rack | Revenue |
|------|----------|-------|--------|---------|
| FY2026 | 83K | 29K | $46K | $1.33B (actual) |
| FY2027 | 120K | 42K | $65K | $2.73B |
| FY2028 | 170K | 60K | $120K | $7.14B |
| FY2029 | 230K | 81K | $200K | $16.1B |
| FY2030 | 300K | 105K | $280K | $29.4B |

### Full Valuation Table (40% OP, 25x, ~197M shares):

| Year | Revenue | OP (40%) | × 25x | Per Share |
|------|---------|----------|-------|-----------|
| 2027 | $2.73B | $1.09B | $27.3B | $139 |
| 2028 | $7.14B | $2.86B | $71.4B | $362 |
| 2029 | $16.1B | $6.44B | $161B | $817 |
| 2030 | $29.4B | $11.76B | $294B | $1,492 |

FY2027 at $139 vs current $218 — market pricing ahead of TAM math, paying for FY2028 optical DSP + SiPh PIC ramp that hasn't started yet.

### Ceiling Derivation (Blended May 2026):

  (8/12 × $362) + (4/12 × $817) = $514

CEILING: $514 (blended 67% FY2028 + 33% FY2029)

## CRDO in the AI Connectivity Stack

```
AI GPU cluster needs connectivity at multiple scales:

SCALE-UP (GPU-to-GPU within/adjacent racks):
  └── SHORT REACH: CRDO AECs (copper, ZeroFlap) ← CRDO dominates here
  └── MEDIUM REACH: CRDO optical DSPs in transceivers

SCALE-OUT (rack-to-rack across datacenter):  
  └── LONG REACH: Optical transceivers (AAOI, COHR, LITE)
      └── with CW lasers from SIVE
      └── on SiPh chips from TSEM/SOI.PA
      └── tested by AEHR

AECs and optical are COMPLEMENTARY. CRDO wins short-reach. 
SIVE/LITE/COHR win long-reach. Both grow with AI compute.
```

## Key Risks

- **Customer concentration:** Top 3 = 88%. Loss of one = catastrophic.
- **Copper distance limits:** AECs can't replace optical for long-reach. If racks spread out, AEC TAM shrinks.
- **Competition:** Broadcom and Marvell have SerDes capabilities. Could develop competing AECs.
- **Transition risk:** 100G→200G per lane creates qualification risk at each generation.

