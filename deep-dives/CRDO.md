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
| TAM | 8/10 | Multi-sector SerDes: AI DC $10-20B + robots $5B + auto $5B + custom chip IP $5B + edge $3B. AEC + optical + retimers + IP licensing. |
| Catalysts | 4/5 | Q4 FY2026 earnings. 5th/6th hyperscaler. PCIe Gen6 production. ZeroFlap Optics ramp. Robot/auto design wins. |
| Macro | 8/10 | 120-150 GW compute. Every GPU cluster needs connectivity. Multi-sector SerDes demand. |
| Alpha | 1/5 | 15+ analysts. ~$34B MC. Thesis well-known. |
| Risks | -3 | Customer concentration (-1). Copper distance limits (-1). AEC socket competition now live: ALAB Taurus inside a $62B platform push + Montage PCIe 6.x AECs launched (-1). |
| **Base** | **44/60 (73%)** | Jun 10 follow-through: Core +1 (Dust closed, Robin/Cardinal, full-stack), Cycle +1 (book-to-bill >4x, LTAs), Risks -1 (ALAB/Montage AEC entry). |

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

| Year | Revenue (mgmt +40% beat) | OP (48%) | × 25x | Per Share |
|------|---------|----------|-------|-----------|
| 2027 | $3.28B | $1.57B | $39.4B | $198 |
| 2028 | $5.9B | $2.83B | $70.8B | $356 |
| 2029 | $9.4B | $4.53B | $113.3B | $569 |
| 2030 | $13.2B | $6.34B | $158.4B | $796 |

Model: management guides +80% FY2027 (~$2.34B). CRDO beat FY2026 guide by ~2x. Conservative 40% revenue beat applied across all years. OP margin 48% per actual Q4 FY2026 (49.6%) and management ~50% net margin guide. 199M diluted shares. 25x multiple.

### Per-share values for Excel:
FY2027: $198 | FY2028: $356 | FY2029: $569 | FY2030: $796

## Jun 10, 2026 — Follow-Through Audit (full pass, post-architecture-week)

**Verdict: model survives. FY values UNCHANGED (198/356/569/796). Base 72 → 73.**

**The 40%-beat assumption was re-audited and RETAINED.** Evidence: FY2026 delivered 2x management's initial expectation (sourced, Q4 reporting); book-to-bill >4x with orders into CY2028 and LTAs to end of decade; supply "tightness throughout next year or longer" (mgmt). A beat assumption this aggressive needs exactly this evidence class — it has it. Re-check at Q1 FY2027 print (~September): if the beat cadence narrows below ~20%, step the assumption down.

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

