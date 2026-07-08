# ALAB — Astera Labs | Deep Dive (Full, replaces screen-level pass)

**Date:** June 10, 2026 | External re-audit merged June 10, 2026 | June 19, 2026 (V3 CXL TAM revision) | **June 27, 2026 (v4.2 audit: 25x→20x permanent)**
**Price at dive:** $391.74 | MC ~$71B | ~195M diluted shares (FY2028E)
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
| **Base** | **45/60 (75%)** | |

---

## Ceiling — v4.2 AH-1 Full Derivation (graduated 36-38% NG OP, 20x permanent, shares 190M→205M)

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

**V3. Leo CXL / KV-cache custom silicon — REVISED Jun 19 ($16-20B CXL TAM)**
Source: Azure M-Series GA YE2026 (named); second hyperscaler KV-cache custom ships 2027 (CEO quote); Penguin Solutions Leo deployments show 75% higher GPU utilization and 2x inference throughput for CXL-attached KV-cache (company data). **CXL TAM revision: Micron (Wells Fargo) $20B+ by 2030; Jackrabbit Labs $16B by 2028; Introl $15B by 2028 ($12B+ DRAM behind CXL). MarketIntelo names ALAB at 26.8% of CXL smart memory controllers (fastest-growing segment, 31.4% CAGR) and 18.6% of CXL switches. Prior V3 modeled $300M FY2028 = <2% of a $16B TAM where ALAB holds 20-27% share — dramatically understated.** Revised to ~5% capture by FY2028, growing to ~8% by FY2030. Conservative relative to current share positioning. AH-7: MEDIUM-HIGH (upgraded from MEDIUM-LOW).

| 2026 | 2027 | 2028 | 2029 | 2030 |
|------|------|------|------|------|
| $80M | $350M | $800M | $1,200M | $1,600M |

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
| 3. Leo CXL/KV-cache (REVISED) | $80M | $350M | $800M | $1,200M | $1,600M |
| 4. Optical | $0 | $100M | $350M | $700M | $950M |
| 5. NVLink Fusion custom | $0 | $50M | $200M | $450M | $800M |
| **TOTAL** | **$1,550M** | **$2,650M** | **$4,100M** | **$5,700M** | **$7,500M** |

V3 revision note: Prior V3 modeled $300M FY2028 on a $16B TAM where ALAB holds 20-27% share of the core segments. Revised to $800M (~5% of TAM). CXL is not just V3 — it's a TAM multiplier across V1 (Scorpio CXL fabric switching), V2 (Aries CXL retimers), and V5 (NVLink Fusion CXL memory sharing). The CXL exposure is systemic, not single-vector.

### Full Valuation Table (NG OP 36-38%, 20x v4.2 permanent, shares 190/195/200/205M)

| Year | Revenue | OP | × 20x | MC | Per Share |
|------|---------|-----|-------|-----|-----------|
| 2027 | $2,650M | $954M (36%) | $19.1B | $19.1B | **$100** |
| 2028 | $4,100M | $1,517M (37%) | $30.3B | $30.3B | **$156** |
| 2029 | $5,700M | $2,166M (38%) | $43.3B | $43.3B | **$217** |
| 2030 | $7,500M | $2,850M (38%) | $57.0B | $57.0B | **$278** |

20x OP permanent (v4.2 standard). Prior 25x→20x correction. ALAB is best-of-breed merchant, not sole-source — does not qualify for a premium multiple under the framework.

### Ceiling Derivation

  FY2028: $4,100M × 37% NG OP = $1,517M × 20x = $30.3B / 195M shares = **$156**

CEILING: $156 (FY2028 column standard; v4.2 audit corrected 25x→20x. Revenue model unchanged from V3 CXL revision. FY columns: $100 / $156 / $217 / $278.)

### The Embedded-Expectations Check (why the market price fails the model)

To justify $392 on FY2028 at 20x/37%: requires $392 × 195M = $76.4B MC → $3.82B OP → **$10.3B FY2028 revenue** — a 6.6x from FY2025 in three years, i.e., ALAB winning the merchant scale-up fabric as a near-monopoly while AVGO, MRVL, and NVIDIA-native all concede. The competitive structure does not support that as a BASE case. The market has paid forward for the monopoly outcome; the model pays for the best-of-breed-in-contested-sockets outcome.

---

## Entry Analysis

- **$156:** FY2028 fair value. Above this = negative EV on FY2028.
- **$130:** 1.2x FY2028, EV = 75% × 0.20 = **+15%**. Watchlist entry.
- **$100:** 1.56x FY2028, EV = 75% × 0.56 = **+42%**. Strong buy.
- **Current $391.74:** 0.40x FY2028, EV = **-70%**. Price requires $9.6B FY2028 revenue (vs model $4.1B) to justify under 20x. Even FY2030 ceiling ($278) is well below current price.

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

*External re-audit merged Jun 10, 2026. Adopted items are incorporated in the body above; rejected items and full merge reasoning live in VERSION_LOG. Standing flag: the external dive cited a prior artifact that never existed (phantom citation) — verify claimed references against the artifact store.*

## Portfolio Cross-References (Rule 19)

- V3 KV-cache offload = third-party validation of the inference memory wall (memory pillar support; no score change)
- V4 optical = ALAB becomes a CW-laser/SiPh CONSUMER 2027+ — adds to aggregate demand flowing through SIVE/Win Semi/IQE chain
- CRDO: Taurus/AEC competition already reflected in CRDO risks; no change
- Rule 18 competition sweep: AVGO, MRVL, Credo, Cisco — all already tracked/known
