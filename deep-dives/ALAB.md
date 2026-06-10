# ALAB — Astera Labs | Deep Dive (Full, replaces screen-level pass)

**Date:** June 10, 2026 | External re-audit merged June 10, 2026 (see merge note)
**Price at dive:** $341.70 | MC ~$62B | ~184M diluted shares (Q1 2026 10-Q basis)
**Exchange:** NASDAQ
**Supercycle:** DB1 — AI Interconnect (scale-out + scale-up fabric, signal conditioning, CXL memory, optical 2027+)
**Classification:** ⚡ BOTTLENECK-ADJACENT PLATFORM (best-of-breed merchant, NOT sole-source in any socket)

---

## Core Thesis

Astera is the leading **merchant** AI connectivity platform: #1 PCIe retimers (Aries), PCIe Gen 6 fabric switches (Scorpio P scale-out, Scorpio X scale-up), Ethernet AECs/SCMs (Taurus), CXL memory controllers (Leo), unified by COSMOS fleet-management software. The thesis inflection: transition from component supplier (retimer cycle) to **fabric platform** — Scorpio becomes largest product line by YE2026 (was 15% of FY2025 revenue), UALink switches carry "substantially higher ASPs than PCIe switches," optical (aiXscale acquisition) ships NPO chipsets 2027 and CPO switches 2028, and custom silicon programs (NVLink Fusion with NVIDIA; KV-cache CXL offload) layer on top.

The structural caveat that caps the score: **ALAB is not sole-source anywhere.** Every socket is contested — AVGO (PEX switches, SUE scale-up, Tomahawk), MRVL (custom, retimers), CRDO (AECs), Cisco, and above all NVIDIA-native NVLink in the majority of racks. The moat is qualification depth + software + speed-to-spec, not physics. Hyperscaler warrant agreements (Amazon 2024; a SECOND major customer warrant executed Q2 2026 per guidance disclosure) are the customer-alignment evidence — hyperscalers take equity-linked positions in suppliers they intend to scale. The Amazon warrant mechanics (sourced, re-audit): up to 3.26M shares at $142.82 strike, vesting tied to purchase milestones up to **$6.5B cumulative** — a hard demand anchor from a single customer.

**System-qualification lock-in (re-audit addition):** ALAB expanded its Taiwan Cloud-Scale Interop Lab with AMD, Arm, Intel, NVIDIA, Gigabyte, Ingrasys/Foxconn, Inventec, Quanta, and Wiwynn as named validation partners. Rack-scale AI moves at the speed of qualification; once a hyperscaler qualifies a rack around ALAB silicon + COSMOS telemetry + interop tooling, switching cost exceeds "swap the chip." A soft moat, but a real one — worth +1 on Core Thesis, not the physics premium.

---

## Q1 2026 Actuals (reported May 5, 2026 — source: company release/8-K)

- Revenue $308.4M, +93% YoY, +14% QoQ (beat consensus $292M)
- Non-GAAP GM 76.4%; Non-GAAP OM 36.2%; Non-GAAP EPS $0.61; GAAP OM 20.1%
- PCIe Gen 6 >1/3 of total revenue
- Cash $1.18B, no structural debt issues
- Q2 guide: $355-365M (+15-18% QoQ), NG EPS $0.68-0.70, GM ~73% including ~200bps non-cash impact from NEW customer warrant agreement

## Confirmed Forward Drivers (sourced, earnings call May 5 2026 + GTC 2026)

- Scorpio X 320-lane: initial volumes now, production ramp H2 2026, largest product line by YE2026
- TWO additional major hyperscalers begin receiving Scorpio P late 2026
- Leo CXL: Microsoft Azure M-Series private beta → GA by YE2026; SECOND custom KV-cache offload design at a new hyperscaler, ships for revenue 2027 (CEO: "working with them on at-scale performance tests")
- Optical roadmap (aiXscale Photonics acquired): pluggable connectors + NPO-based chipsets volume 2027, fully optical CPO switches 2028; "all necessary foundational IP — mixed-signal, electronic ICs, photonic ICs"
- NVLink Fusion: custom scale-up connectivity program in development with NVIDIA for hybrid racks (XPU ↔ NVIDIA ecosystem); Trainium 4 incorporates NVLink Fusion + UALink (TAM expansion read, not displacement)
- UALink 2.0 spec advanced; UALink switches = "substantially higher ASPs than PCIe switches" (radix, complexity, optical media)

---

## Scoring Breakdown

| Category | Score | Evidence |
|----------|-------|---------|
| Core Thesis | 15/20 | Best-of-breed merchant platform across 5 product families + COSMOS software + two hyperscaler warrant alignments ($6.5B Amazon milestones) + Taiwan Interop Lab system-qualification lock-in. BUT: zero sole-source sockets — AVGO/MRVL/CRDO/Cisco/Montage/NVIDIA-native contest everything. Qualification moat, not physics. |
| Cycle Stage | 10/10 | +93% YoY record revenue, beat-and-raise, Scorpio inflecting NOW, 36% NG OM at scale, $1.18B cash. Re-audit is right: this is 10/10 cycle evidence. |
| TAM Expansion | 9/10 | Three NEW vectors since prior screen: UALink high-ASP switches (2027+), optical NPO/CPO (2027/2028), KV-cache CXL custom (2027). Management pegs merchant scale-up switching alone at $20B by 2030. |
| Catalysts | 5/5 | Scorpio X H2 ramp; 2 new hyperscalers late 2026; Azure Leo GA YE2026; KV-cache ship 2027; UALink 2.0 deployments; NPO volume 2027; Q2 print Aug 4 (Scorpio ≥25% test). |
| Macro | 9/10 | Same supercycle as the book; merchant XPU buildout (Trainium/TPU/MTIA) is its specific engine. |
| Alpha | 1/5 | $62B MC, 25+ analysts, 49x NTM EV/EBITDA, institutional darling. Zero informational edge. (Rule 1: the prior run is NOT the penalty — the absence of edge is.) |
| Risks | -4 | Not sole-source (-1). Customer concentration + insourcing scares (Trainium 4 headline = -13% day) (-1). NVIDIA-native NVLink owns the majority of scale-up sockets (-1). Montage CXL/retimer entry + multiple-compression risk at 49x NTM EV/EBITDA vs 31x peer mean (-1). |
| **Base** | **45/60 (75%)** | Screen 70 → dive 73 → re-audit merge 75. |

---

## Ceiling — v4.1 AH-1 Full Derivation (graduated 36-38% NG OP, 28x, shares 184M→200M)

### Revenue Vectors

**V1. Scorpio fabric switches (P scale-out + X scale-up + UALink/custom 2027+)**
Source: management — largest line by YE2026 (from 15% of FY2025 ≈ $108M); X production H2 2026; 2 new hyperscalers late 2026; UALink ASP uplift commentary; management $20B merchant scale-up switch TAM by 2030; Amazon warrant $6.5B cumulative purchase milestones. FY2030 = 14.5% capture of management's own TAM. AH-7: MEDIUM-HIGH through 2027, MEDIUM beyond.

| 2026 | 2027 | 2028 | 2029 | 2030 |
|------|------|------|------|------|
| $520M | $1,100M | $1,600M | $2,150M | $2,900M |

**V2. Signal conditioning (Aries retimers Gen6→Gen7 + Taurus AEC/SCM)**
Source: Q1 actuals (majority of current revenue), Gen 6 >1/3 of company revenue, 800G/1.6T Ethernet cycle. Share declines as fabric ramps; CRDO competition in AECs. AH-7: MEDIUM.

| 2026 | 2027 | 2028 | 2029 | 2030 |
|------|------|------|------|------|
| $950M | $1,050M | $1,150M | $1,200M | $1,250M |

**V3. Leo CXL / KV-cache custom silicon**
Source: Azure M-Series GA YE2026 (named); second hyperscaler KV-cache custom ships 2027 (CEO quote); Penguin Solutions Leo deployments show 75% higher GPU utilization and 2x inference throughput for CXL-attached KV-cache (company data). Inference memory wall = structural tailwind. HELD at demo-stage sizing per the re-audit's own risk: CXL pooling needs production deployments, not demos — tagged uncertainty must discount the number (FOCI lesson). AH-7: MEDIUM-LOW.

| 2026 | 2027 | 2028 | 2029 | 2030 |
|------|------|------|------|------|
| $40M | $150M | $300M | $450M | $600M |

**V4. Optical (aiXscale): connectors/NPO chipsets 2027 → CPO switches 2028**
Source: management roadmap, acquisition IP claims. No volume customer named yet. AH-7: LOW-MEDIUM.

| 2026 | 2027 | 2028 | 2029 | 2030 |
|------|------|------|------|------|
| $0 | $100M | $350M | $700M | $950M |

**V5. NVLink Fusion custom silicon**
Source: program confirmed with NVIDIA (Dec 2025 + GTC 2026); hybrid-rack scope (XPU racks bridging into NVLink ecosystems — Trainium 4 incorporates NVLink Fusion + UALink). Revenue sizing is inference; FY2030 raised modestly on the hybrid-rack anchor. AH-7: LOW.

| 2026 | 2027 | 2028 | 2029 | 2030 |
|------|------|------|------|------|
| $0 | $50M | $200M | $450M | $800M |

### Combined Revenue

| Vector | 2026 | 2027 | 2028 | 2029 | 2030 |
|--------|------|------|------|------|------|
| 1. Scorpio/UALink/custom | $520M | $1,100M | $1,600M | $2,150M | $2,900M |
| 2. Signal conditioning | $950M | $1,050M | $1,150M | $1,200M | $1,250M |
| 3. Leo CXL/KV-cache | $40M | $150M | $300M | $450M | $600M |
| 4. Optical | $0 | $100M | $350M | $700M | $950M |
| 5. NVLink Fusion custom | $0 | $50M | $200M | $450M | $800M |
| **TOTAL** | **$1,510M** | **$2,450M** | **$3,600M** | **$4,950M** | **$6,500M** |

Cross-check: FY2026 consistent with Q1 $308M + Q2 guide ~$360M + H2 ramp (≈ +81-110% YoY vs analyst ~81%). FY2027 +59% consistent with TIKR quarterly path ($360M Q2'26 → ~$540M Q2'27 = +50% YoY mid-year, accelerating on UALink/optical layering). FY2028+ tagged MEDIUM-LOW/LOW; conservative alternative (TIKR mid-case shape) would run ~$2.9B/$3.8B/$4.6B for 2028-2030 — noted, not used, because it ignores the three new vectors entirely.

### Full Valuation Table (NG OP 36/37/38/38%, 28x, shares 190/195/200/200M)

| Year | Revenue | OP | × 28x | MC | Per Share |
|------|---------|-----|-------|-----|-----------|
| 2027 | $2,450M | $882M (36%) | $24.7B | $24.7B | **$130** |
| 2028 | $3,600M | $1,332M (37%) | $37.3B | $37.3B | **$191** |
| 2029 | $4,950M | $1,881M (38%) | $52.7B | $52.7B | **$263** |
| 2030 | $6,500M | $2,470M (38%) | $69.2B | $69.2B | **$337** |

28x FLAT justification: between AVGO at 25x (slower growth, customer-churn risk) and the 30x+ reserved for sole-source monopolies. The re-audit's 30x→26x declining-multiple path was rejected — forecasting multiple compression is analyst behavior, not TAM math (Rule 2 adjacent); multiples hold flat or graduate UP on proof. Margins graduate UP (36→38%), not down — 76% GM + COSMOS software mix + visible opex leverage; warrant amortization hits gross margin against specific revenue, it does not erode the operating model. Pre-rounding per AH-2: 129.98 / 191.26 / 263.34 / 337.37.

### Ceiling Derivation

  FY2028: $3,600M × 37% NG OP = $1,332M × 28x = $37.30B / 195M shares = **$191**

CEILING: $191 (FY2028 column standard; rolling blend in Excel)

### The Embedded-Expectations Check (why the market price fails the model)

To justify $342 on FY2028 at 28x/37%: requires $342 × 195M = $66.7B MC → $2.38B OP → **$6.4B FY2028 revenue** — a 4.3x from FY2026 in two years, i.e., ALAB winning the merchant scale-up fabric as a near-monopoly while AVGO, MRVL, and NVIDIA-native all concede. The competitive structure does not support that as a BASE case. The market has paid forward for the monopoly outcome; the model pays for the best-of-breed-in-contested-sockets outcome.

---

## Entry Analysis

- **$191:** FY2028 fair value. Above this = negative EV on FY2028.
- **$159:** 1.2x FY2028, EV = 75% × 0.20 = **+15%**. Watchlist entry.
- **$123:** 1.55x FY2028, EV = 75% × 0.55 = **+41%**. Strong buy. (Dec 2025 price was $152 — the entry existed six months ago.)
- **Current $341.70:** 0.56x FY2028, EV = **-33%**. Even FY2030 ($337) sits below the current price.

## Re-Rate Triggers (either direction)

- UALink switch volume orders at disclosed ASPs (would lift V1 materially)
- Optical NPO chipset customer named with volume (V4 confidence LOW-MEDIUM → MEDIUM-HIGH)
- Third hyperscaler warrant or KV-cache program (V3 expansion)
- Q2 print (Aug 4): Scorpio ≥25% of revenue confirms largest-line trajectory
- NVIDIA-native NVLink extending into XPU hybrid racks at scale = V1/V5 threat

## Key Risks

1. Not sole-source in any socket; AVGO SUE and NVIDIA-native NVLink contest the scale-up fabric prize directly. Montage has launched PCIe 6.x/CXL 3.x retimers and AECs (re-audit catch); MRVL's Structera/XConn stack targets CXL pooling head-on.
2. Customer concentration; a single hyperscaler architecture decision moves the stock -13% in a session (Trainium 4 episode).
3. Multiple risk independent of execution: 49x NTM EV/EBITDA vs 31x peer mean (TIKR) — compression alone is -35% with zero revenue miss.
4. Gross margin mix-down as hardware-heavy fabric/optical scales (73% Q2 guide vs 76.4% Q1).
5. Optical vectors (V4) compete with COHR/LITE/AAOI module incumbents and depend on external CW laser supply — same constrained ecosystem the book already owns upstream.

## Jun 10, 2026 — External Re-Audit Merge Note

A second independent dive (external) was merged same-day. ADOPTED (sourced): Amazon warrant mechanics ($6.5B milestones / 3.26M shares @ $142.82), management $20B merchant scale-up TAM by 2030, Penguin Solutions Leo performance data, Taiwan Interop Lab ODM roster (system-qualification lock-in → Core Thesis +1), Montage as named competitor (Risks -1). REJECTED with reasoning: 30x multiple (monopoly pricing on a self-described non-monopoly), declining 30→26x multiple path (compression forecasting ≠ TAM math), declining 36→33% margin path (contradicts GM/software mix/opex leverage), Leo at $2.1B FY2030 (violates its own "demos ≠ deployments" risk — tagged uncertainty must discount the number). Both models agreed on the verdict sign at current price: external -21%, ours -33%, merge -33%. Provenance flag: the external dive cited an "old artifact (Base 70, ceiling $250-290)" that does not exist in the artifact store — ALAB was Excel-range-only before today.

## Portfolio Cross-References (Rule 19)

- V3 KV-cache offload = third-party validation of the inference memory wall (memory pillar support; no score change)
- V4 optical = ALAB becomes a CW-laser/SiPh CONSUMER 2027+ — adds to aggregate demand flowing through SIVE/Win Semi/IQE chain
- CRDO: Taurus/AEC competition already reflected in CRDO risks; no change
- Rule 18 competition sweep: AVGO, MRVL, Credo, Cisco — all already tracked/known
