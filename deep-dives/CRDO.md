# CRDO — Credo Technology | Deep Dive
**Date:** April 24, 2026
**Framework Version:** v3.6.2
**Score:** 62 | Base 72% (43/60) | Entry 48 (19/40)
**Price at Analysis:** $195.04
**Ceiling:** $300-$360 (2027-2028)
**Market Cap:** ~$34B
**Q3 FY2026 Revenue:** $407M (+4x YoY) | 9-Month: $898M
**Non-GAAP GM:** 67.6%

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

## Ceiling

```
REVENUE (with DustPhotonics + multi-sector expansion):
  FY2026: ~$1.3-1.5B (Q3 $407M annualizes to $1.6B)
  FY2027: $2.5-3.5B (guided 50%+ growth + optical doubling + PCIe)
  FY2028: $4-6B (multi-sector: robots, auto, custom chips, edge)

EARNINGS:
  $2.5B, 40% OP = $1.0B × 35x = $35B → ~$200 (≈ current price)
  $3.5B, 42% OP = $1.47B × 35x = $51.5B → ~$294
  $5B, 44% OP = $2.2B × 35x = $77B → ~$440
  Bull $7B, 45% OP = $3.15B × 35x = $110B → ~$630

CEILING: $300-$500
```

**Entry:** $195.04 vs midpoint $400 = 2.05x → **Entry 48**

## Total: (72 × 0.6) + (48 × 0.4) = 43 + 19 = 62

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

## Why The Score Is 62 Despite 72% Base

The base quality is genuinely strong — 68.6% GM, SerDes IP moat, 100x reliability, 4+ hyperscaler customers, 5x revenue growth, DustPhotonics acquisition creating the most complete connectivity stack outside Broadcom. Multi-sector expansion (robots, auto, edge, custom chips) significantly expands TAM beyond just AEC.

But the Entry at $195.04 gives only 2.05x to ceiling midpoint. The framework needs 2.5x+ for WL. And at $34B market cap with 15+ analysts, information edge is limited.

The DustPhotonics acquisition (SiPh PIC vertical integration) and multi-sector SerDes thesis are the upgrades from the original scoring — this is no longer just "an AEC company," it's becoming a universal connectivity platform. Baker's comment ("PIC has early RF black magic vibes") suggests the optical integration could be a larger moat than currently appreciated.

Compare to the photonics positions that CRDO complements:

| | SIVE (90 HC) | CRDO (56) |
|---|---|---|
| Market cap | $1B | $11B |
| Analysts | 3 | 15+ |
| Upside ratio | 6.6x | 1.9x |
| Information edge | Maximum | Zero |
| Technology moat | Physics (CW laser) | IP (SerDes) + first-mover (AEC) |

## Key Risks

- **Customer concentration:** Top 3 = 88%. Loss of one = catastrophic.
- **Copper distance limits:** AECs can't replace optical for long-reach. If racks spread out, AEC TAM shrinks.
- **Competition:** Broadcom and Marvell have SerDes capabilities. Could develop competing AECs.
- **Transition risk:** 100G→200G per lane creates qualification risk at each generation.
- **Stock already ran:** $10→$80+ = most of the re-rating complete.

## Verdict

62. Credo has evolved from an AEC-focused company into the most complete connectivity stack outside Broadcom — SerDes IP + AEC + optical DSP + SiPh PIC (DustPhotonics) + PCIe retimers + software (PILOT). The multi-sector SerDes thesis (DC + robots + auto + edge + custom chips) significantly expands the addressable market. 68.6% GM and 5x revenue growth validate execution. But at $195/$34B with 15+ analysts and 2.05x Entry ratio, the asymmetry the framework seeks is limited. If multi-sector revenue materializes (robot/auto design wins), rescore to 65+ warranted.
