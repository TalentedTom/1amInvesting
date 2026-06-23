# CRDO — Credo Technology | Deep Dive
---

## Supercycle: DB1 Photonics / AI Datacenter Connectivity (AEC + Optical DSP + SerDes)

## Core Thesis: The Purple Cable That Keeps AI Training Alive

Credo's Active Electrical Cables (AECs) — the distinctive purple cables — deliver 100x the reliability of optical connections for short-reach AI datacenter links. A single unstable optical link can crash an entire AI training run, costing millions in lost compute time. Credo's AECs solve this with copper-based, zero-flap connectivity at 50% lower power and 75% less volume than alternatives. Three hyperscalers at >10% revenue, fourth ramping, two more in pipeline.

## Key Financials

- **FY2026 actual: Revenue $1.3B (+206% YoY). EPS $3.46 (+392% YoY). GM 68.1%.**
- **Q4 FY2026 (May 2026): Revenue $437M (+157% YoY, +7% QoQ). GM 68.3%. NI $227M. Net margin 51.9%.**
- Q4 revenue alone exceeded entire FY2025 revenue (~$250M).
- **FY2027 guidance: +80% YoY (~$2.4B).** H1 mid-single-digit sequential, H2 inflection.
- **$600M+ optical revenue in FY2027:** ZeroFlap Optics >$100M, SiPho PICs >$100M, Optical DSPs >$100M. Half of absolute dollar growth from optical.
- Q1 FY2027 guide: $465-475M. FY2027 net margin ~50%.
- Cash: $1.4B (Q4). DustPhotonics **CLOSED** (week of the Jun 1 call) — ~$750M cash+stock+earnouts. Prior tuck-ins: CoMira (connectivity IP), Hyperlume (microLED optical — dark-horse ultra-short-reach tech).
- 4 hyperscalers >10% revenue in Q4 (34%, 27%, 16%, 10%). 4th customer is new.
- Neo clouds expected to reach ~20% of revenue in coming years.
- AECs: deployed with 5 of 6 hyperscalers. Still early innings of penetration.
- CPO/NPO: initial revenue expected FY2028.
- Book-to-bill >4x datacenter. Orders into CY2028, LTAs to end of decade.
- Supply chain: "significant tightness... will stay popular throughout next year or longer."

## Product Portfolio

| Product | Description | Status |
|---------|------------|--------|
| **AECs (Active Electrical Cables)** | Copper with integrated retimer. 100x reliability vs optical. | **Primary revenue driver. Record growth.** |
| **Optical DSPs — Robin (100G/lane), Cardinal (200G/lane)** | DSPs for optical transceivers (800G/1.6T) | Doubling FY2026; rising design wins, "excellent customer feedback" (Q4 call). |
| **SerDes IP** | Proprietary serializer/deserializer technology | Licensed + used in own products. Core moat. |
| **PCIe Retimers** | Gen5→Gen6 retimers for CPU-to-GPU links | Design wins CY2025. Gen6 AECs sampling now, mass production H1 FY2027. |
| **PILOT Software** | Diagnostic/analytics platform | Recurring revenue. |

## Why AECs Win (The Reliability Argument)

In AI training clusters, a single link failure ("flap") can crash an entire training run across thousands of GPUs. The cost of a flap is measured in hours of lost GPU time × thousands of GPUs × hundreds of dollars per GPU-hour = millions of dollars per incident.

Optical connections flap. AECs don't ("ZeroFlap"). For scale-up networks (GPU-to-GPU within a rack or adjacent racks), the reliability advantage is worth more than the bandwidth advantage of optical.

**100x reliability × 50% less power × 75% less volume = AECs dominate short-reach AI datacenter links.**

But there's a ceiling: AECs are copper-based and limited by distance. For scale-out networks (rack-to-rack across a datacenter), optical wins. This is where the framework's photonics positions (SIVE, LITE, COHR) play. AECs and optical are COMPLEMENTARY, not competitive.

## Scoring Breakdown

| Category | Score | Evidence |
|----------|-------|---------|
| Core Thesis | 16/20 | AEC first-mover with 100x reliability. SerDes IP moat. DustPhotonics CLOSED = full stack SerDes→DSP→SiPho PIC→system→telemetry ("foundational network architecture partner" — mgmt, Q4 call). Robin/Cardinal DSP traction. CW-laser-based PICs = insulated from EML shortage (validated by Jun 2026 EML-constraint evidence). Rebellions design partnership. BUT: concentration (-2), copper distance ceiling (-1), AVGO/MRVL/ALAB/Montage compete (-1). |
| Cycle Stage | 10/10 | FY2026 tripled to $1.3B — 2x management's own initial expectation. Book-to-bill >4x, orders into CY2028, LTAs to end of decade. Every quarter a record. |
| TAM | 9/10 | Multi-sector SerDes: AI DC $10-20B + robots $5B + auto $5B + custom chip IP $5B + edge $3B. CXL expansion (Jun 19): CXL retimers (V5, every CXL link needs signal conditioning at 128GT/s), ALC for CXL scale-in (Mizuho: "micro-LED optical from Credo for XPU-to-HBM"), Weaver + CXL memory fabric connectivity. More memory tiers = more interconnect = more CRDO sockets. |
| Catalysts | 4/5 | Q4 FY2026 earnings. 5th/6th hyperscaler. PCIe Gen6 production. ZeroFlap Optics ramp. Robot/auto design wins. |
| Macro | 8/10 | 120-150 GW compute. Every GPU cluster needs connectivity. Multi-sector SerDes demand. |
| Alpha | 1/5 | 15+ analysts. ~$34B MC. Thesis well-known. |
| Risks | -3 | Customer concentration (-1). Copper distance limits (-1). AEC socket competition now live: ALAB Taurus inside a $62B platform push + Montage PCIe 6.x AECs launched (-1). |
| **Base** | **45/60 (75%)** | Jun 10: Core +1, Cycle +1, Risks -1. Jun 19: TAM 8→9 (CXL retimers + ALC scale-in + Weaver memory fabric). |

## Ceiling — v4.2 AH-1 Full Derivation (explicit vector model with 16b probability-weighted breadcrumbs, 48% OP, 25x, ~199M shares)

### Vector Model (AH-9) — each product line independently sourced and probability-weighted per Rule 16b

**CONFIRMED VECTORS (in management guide / shipping):**

**V1 AECs (ZeroFlap copper, 88% market share per 650 Group) — AH-7: HIGH** (the base business; 1.6T gen ramping; NVL576 keeps copper intra-rack): $1.60B / $2.00B / $2.30B / $2.50B (FY2027-30). 16b: 85% (shipping at scale, 88% share, guided).

**V2 Optical DSPs (Cardinal) — AH-7: HIGH** (mgmt: >$100M in FY2027 within $600M optical; ramping with 800G/1.6T): $0.35B / $0.70B / $1.10B / $1.50B. 16b: 80% (shipping, guided breakdown).

**V3 ZeroFlap Optics (optical transceivers) — AH-7: HIGH** (mgmt: >$100M in FY2027; ZF reliability extends to optical; **Jun 19: Google chose MediaTek 336G linear over Broadcom 448G DSP because DSP needs 2nm (delayed to 2028-2029). Linear architecture wins 2026-2027 window by default. ZeroFlap removes the DSP — validated by Google's own timeline failure**): $0.35B / $0.85B / $1.20B / $1.50B. 16b: 75% (guided, architecture validated by Google downspec).

**V4 SiPh PICs (DustPhotonics, acquired) — AH-7: MEDIUM** (400G-3.2T roadmap; L3C architecture uses CW lasers = EML-shortage-immune; mgmt: >$100M FY2027): $0.15B / $0.50B / $1.00B / $1.50B. 16b: 65% (acquisition closed, products in development, revenue nascent).

**V5 Retimers (Blue Heron PCIe Gen6, production Q3 FY2027 + CXL retiming) — AH-7: MEDIUM** (first scale-up-market exposure + CXL 4.0 at 128GT/s needs retiming at distance): $0.05B / $0.40B / $0.80B / $1.20B. 16b: 70% (design wins confirmed, production dated, CXL uplift Jun 19).

| Vector | FY2027 | FY2028 | FY2029 | FY2030 |
|--------|--------|--------|--------|--------|
| V1 AECs (88% share) | $1.60B | $2.00B | $2.30B | $2.50B |
| V2 Optical DSPs | $0.35B | $0.70B | $1.10B | $1.50B |
| V3 ZeroFlap Optics | $0.35B | $0.85B | $1.20B | $1.50B |
| V4 SiPh PICs | $0.15B | $0.50B | $1.00B | $1.50B |
| V5 Retimers + CXL | $0.05B | $0.40B | $0.80B | $1.20B |
| **CONFIRMED BASE** | **$2.50B** | **$4.45B** | **$6.50B** | **$8.30B** |

**PROBABILITY-WEIGHTED BREADCRUMB VECTORS (Rule 16b — priced at probability, not certainty):**

**V6 OmniConnect Weaver ($2,000-3,000 revenue per GPU, CEO-guided, CEO performance awards tied to revenue milestones) — AH-7: MEDIUM** (FY2028 ramp; at $2,500 midpoint × deployment scale): $0.0B / $0.5B / $1.2B / $2.0B. 16b: **50%** (management hint + performance awards = credible but unverified at scale).

**V7 NPO/CPO initial revenue — AH-7: LOW** (industry timeline dependent; mgmt flagged FY2028): $0.0B / $0.2B / $0.5B / $1.0B. 16b: **40%** (industry-dependent, not CRDO-specific).

**V8 ALC / CXL Physical Layer (NEW Jun 19) — AH-7: LOW** (Mizuho Jun 16: "micro-LED optical from Credo in ALC for scale-in XPU-to-HBM." CXL 4.0 at 128GT/s may exceed copper for rack-scale memory pooling distances. Hyperlume acquisition provides micro-LED tech. ALAB makes the CXL controller, CRDO makes the physical connection.): $0.0B / $0.15B / $0.40B / $0.80B. 16b: **30%**.

| Breadcrumb Vector | Full Value | × Probability | Weighted Add |
|-------------------|-----------|---------------|-------------|
| V6 Weaver FY28 | $0.50B | × 50% | $0.25B |
| V6 Weaver FY29 | $1.20B | × 50% | $0.60B |
| V6 Weaver FY30 | $2.00B | × 50% | $1.00B |
| V7 NPO/CPO FY28 | $0.20B | × 40% | $0.08B |
| V7 NPO/CPO FY29 | $0.50B | × 40% | $0.20B |
| V7 NPO/CPO FY30 | $1.00B | × 40% | $0.40B |
| V8 ALC/CXL FY28 | $0.15B | × 30% | $0.05B |
| V8 ALC/CXL FY29 | $0.40B | × 30% | $0.12B |
| V8 ALC/CXL FY30 | $0.80B | × 30% | $0.24B |

| | FY2027 | FY2028 | FY2029 | FY2030 |
|--|--------|--------|--------|--------|
| Confirmed base | $2.50B | $4.45B | $6.50B | $8.30B |
| + Weighted adds | $0.00B | $0.38B | $0.92B | $1.64B |
| **TOTAL REVENUE** | **$2.50B** | **$4.83B** | **$7.42B** | **$9.94B** |

### Valuation (48% OP per Q4 FY2026 actual + mgmt ~50% net margin guide; 25x; 199M diluted shares)

| Year | Revenue | OP (48%) | × 25x | Per Share |
|------|---------|----------|-------|-----------|
| 2027 | $2.50B | $1.20B | $30.0B | **$151** |
| 2028 | $4.83B | $2.32B | $57.9B | **$291** |
| 2029 | $7.42B | $3.56B | $89.1B | **$448** |
| 2030 | $9.94B | $4.77B | $119.3B | **$599** |

  FY2028: $4.83B × 48% OP = $2.32B × 25x = $57.9B / 199M shares = **$291**

CEILING: $291 (FY2028 column standard; revised from $276 on V3 ZeroFlap pullforward — Google/MediaTek 336G validates linear over DSP for 2026-2027 window)

**Model change note (Jun 13):** replaced the prior "mgmt +40% beat" single-multiplier approach with explicit vector decomposition. The 40% beat was a proxy standing in for five product ramps, each with different timelines and probabilities. Decomposing it via Rule 16b reveals the confirmed base ($2.40B FY2027 = management's own guide) plus probability-weighted upside from Weaver and NPO/CPO. The result is lower than the prior model but structurally honest — each number traces to a named product, a management source, and a probability weight. Escalation paths pre-registered: Weaver deployment confirmation → 50%→75%; NPO/CPO order → 40%→60%; each escalation lifts the weighted adds and re-derives the ceiling.

### Per-share values for Excel:
FY2027: $151 | FY2028: $291 | FY2029: $448 | FY2030: $599

## Jun 10, 2026 — Follow-Through Audit (full pass, post-architecture-week)

**Verdict: Base 72 → 73. Jun 13: model REBUILT from "mgmt +40% beat" to explicit 7-vector decomposition with Rule 16b probability weights. FY values revised: 198/356/569/796 → 145/267/410/555.**

**The 40%-beat assumption was retired in favor of vector-level pricing.** The beat was a single multiplier standing in for five confirmed product ramps plus two breadcrumb vectors (Weaver $2-3K/GPU, NPO/CPO), each with different timelines and probabilities. Decomposing it reveals that some vectors (AECs at 88% share, optical DSPs) are near-certain but maturing, while others (Weaver, CPO) are high-upside but 40-50% probability. The blended result is lower but structurally honest — each number traces to a named product, a source, and a probability weight. Escalation paths are pre-registered: each vector's probability ratchets upward on verification prints.

**What the architecture week validated (no numbers moved):**
- CRDO was green on BOTH bloodbath days (Friday rotation + Jun 9) — the market independently identified it as an NPO-transition winner
- LITE's formal timeline (scale-up ship 2H27, volume 2028) aligns exactly with our "CPO/NPO initial revenue FY2028" line
- Convequity: NVL576 keeps copper intra-rack — AEC TAM extends through the largest scale-up domains
- DustPhotonics L3C architecture uses CW lasers → insulated from the EML shortage that constrains LITE (Paradis); the week's EML-scarcity evidence is a CRDO tailwind
- Pending breadcrumb: Google ~12M NPO module order unattributed — CRDO DSPs/PICs are candidate CONTENT inside whichever module maker wins (second-derivative exposure regardless of attribution)

**New since the rebuild (adopted above):** Robin/Cardinal DSP traction, Rebellions design partnership (note: Rebellions is one of the Korean NPU startups AVGO is now pitching turn-key services to — CRDO is already designed in), CoMira/Hyperlume tuck-ins, Gen6 AEC mass production H1 FY2027, DustPhotonics closed.

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
- **Competition:** Broadcom and Marvell have SerDes capabilities. AND (Jun 10, Rule 18 catch): ALAB's Taurus SCM/AEC line ships today inside ALAB's hyperscaler platform push; Montage has launched PCIe 6.x AECs. The AEC socket is now actively contested, not hypothetically.
- **Transition risk:** 100G→200G per lane creates qualification risk at each generation.

