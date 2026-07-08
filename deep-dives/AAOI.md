# AAOI — Applied Optoelectronics | Deep Dive

**Date:** May 7, 2026 (Q1 rescore) | May 28, 2026 (sanctioned valuation model) | June 10, 2026 (restructured — single generation) | July 2, 2026 (link-tier substitution class added → Base 72; AMD negotiation rider; ceiling unchanged) | July 5, 2026 (margin cell corrected: 38% "OP" was a gross-margin garble → sourced 33% OP path; ceiling $536→$466) | **July 6, 2026 (network-flattening risk class added: RNG+MRC confirmed → Base 70; ceiling unchanged)**
**Framework Version:** v4.2
**Status:** HELD (✓) | **Base 70% (42/60)**
**Price at last update:** $139.16 | 80.2M shares outstanding (SEC filing, May 13 2026) → ~85M modeled at full ATM execution
**Ceiling:** FY2028 $466 (FY-column standard; see corrected margin path + queued reach-tier + topology-tier decomposition)

---

## Supercycle: DB1 Photonics (Transceiver Assembly + CW Laser Fab — Layer 1)

## Core Thesis: "Buy ALL Production"

A hyperscaler told AAOI management they would buy ALL production. CFO: "Revenue limited by production capacity and supply chain, not market demand, which we believe is much larger." Customer demand $1.4-1.5B = 30%+ above capacity = sold out through mid-2027.

Two structural upgrades layered on the assembler base:

**1. Full InP laser vertical integration (corrected Jun 13).** AAOI internally fabricates BOTH CW and EML lasers using a proprietary MBE+MOCVD process unique in the industry, with 350% laser capacity expansion by 2027 (tripling Texas laser manufacturing). This creates a two-tier transceiver market: Tier 1 (own lasers: AAOI, LITE, COHR) can produce through the shortage; Tier 2 (buy lasers: Innolight, Eoptolink, CIG) is gated by external availability — and LITE confirmed (May 5) the external CW market is sold out. **In an InP-scarce regime (China deliberately maintaining the bottleneck per Reuters Jun 2026), vertical integration IS the moat: AAOI is a net beneficiary of the very scarcity that constrains its non-integrated competitors.** Third-party confirmation Jun 10: Fabrinet states the industry constraint is "lasers, not assembly" — the assembler with its own lasers holds the scarce input. Three multi-year CPO/laser agreements remain IN NEGOTIATION; any signing reclassifies AAOI from pluggable-only to laser + transceiver dual-revenue. Rosenblatt channel check (via Serenity, Jul 2 2026) names AMD as a counterparty in the CPO/laser negotiations — trigger unchanged, fires on signing. **Filing-grade demand anchor (added Jul 5, via Damnang):** Amazon is a disclosed customer whose subsidiary holds AAOI warrants vesting on **cumulative Amazon purchases reaching $4B over ten years** — a structural claim mechanism on AAOI supply, and the standing answer to "who takes the merchant pool."

**2. US manufacturing advantage.** Houston/Sugar Land/Pearland footprint approaching 900K sqft; $20M Texas subsidy; CHIPS-eligible. Pax Silica / "buy American" procurement pressure gives the premier US-based high-volume transceiver producer a structural edge with US hyperscalers and sovereign/government demand. $1.1B total ATM ($500M amended Mar 12 + $600M filed May 14) funds the expansion.

## Q1 2026 Actuals + Guidance (reported May 7)

- Q1 revenue $151.1M — fourth consecutive record. Three customers >10%.
- FY2026 guidance RAISED: >$1.1B revenue (internal target $1.2B), >$140M non-GAAP OP.
- Q3 guided +60-80% sequential — the hockey stick. Q4 2026 gross margin target: 40%+.
- Orders: $124M 800G from lead hyperscaler since mid-March; $200M+ first 1.6T volume order (Mar 9); second hyperscaler took first 10,000 units of 800G; 1.6T LPO shipping since March. CEO: 1.6T = "$2B+ business" in 2027.

## Capacity Roadmap (management, single source of truth)

| Milestone | Capacity / Run-rate |
|---|---|
| Now (Q1 2026) | 100K units/month (800G) |
| End-2026 | 500K units/month (800G+1.6T); Sugar Land operational Q4 |
| Mid-2027 | $471M/month revenue ≈ $5.65B annualized |
| **End-2027 (added Jun 10)** | **~930K units/month** ≈ $6B annualized at blended ASP |

Demand exceeds capacity through mid-2027 (management, reiterated June 2026). Industry context: 800G/1.6T port demand runs 27-30% above industry supply with the absolute gap WIDENING through 2027 (13M → 17M ports) — AAOI's expansion gets absorbed without pricing pressure.

## Why AAOI Is NOT a Monopoly (Framework Honest)

| Layer | Company | Position | Moat |
|-------|---------|----------|------|
| Layer 0 (laser) | SIVE, LITE, COHR | Monopoly/near-monopoly | Physics-required |
| **Layer 1 (transceiver)** | **AAOI, Innolight, Eoptolink, CIG** | **Competitive** | **Capacity + speed + CW self-supply** |

Innolight's DC revenue is ~14x AAOI's. The moat is execution speed, customer relationships, and now CW self-supply — not physics. "Competitive companies go up in supercycles. Monopolies go up MORE." The S-curve is visible: pluggables peak FY2029 then decline as CPO takes switch-level optics. ⚡ BOTTLENECK (trade), not a compounder.

## Scoring Breakdown (reconciled Jun 10 — table now matches the May 7 rescore the Excel carries)

| Category | Score | Evidence |
|----------|-------|---------|
| Core Thesis | 14/20 | "Buy ALL production" + CW vertical integration (two-tier moat) + US manufacturing edge. Competitive Layer 1 market (-3), concentration (-2), pricing-decline risk (-1). |
| Cycle Stage | 9/10 | Four consecutive records; Q3 guided +60-80% sequential; sold out to mid-2027. |
| TAM | 7/10 | Transceivers $23.8B → $80-120B; pluggable phase only, S-curve peak FY2029. |
| Catalysts | 5/5 | Hockey-stick H2; Sugar Land Q4; 40% GM target Q4; CPO/laser negotiations; 1.6T $2B path. |
| Macro | 8/10 | Every GPU cluster needs transceivers; 27-30% industry undersupply through 2027. |
| Alpha | 3/5 | Rule 7 "buy all production" signal; ~12 analysts; thesis known but execution doubted. |
| Risks | -4 | Concentration 91% from 3 (-1). LightCounting price-decline warning end-2026 (-1). **Link-tier substitution (Jul 2):** CRDO ALC micro-LED ≤30m, production mid-2027 / volume 2028, weighted 20-30% (-1). **Network-flattening structural risk (Jul 6):** AWS RNG (production-deployed flat DC networks, arxiv May 2026) + OpenAI MRC (deployed on GB200 Stargate/Fairwater) — flatter topologies eliminate aggregation/spine switch tiers; weighted 25-40% on direction, <20% on B. Riley's 40-50% magnitude claim; primary-source math: multi-plane breakout (8×100G per 800G NIC) increases per-endpoint connections even as switch count falls 45%, net transceiver reduction ~20-30% in aggregation tier only; FY28 ceiling insulated (capacity-gated, not multiplier-gated) (-1). [Vertical-integration penalty REMOVED May 7.] |
| **Base** | **42/60 (70%)** | Jul 6: Risks −3→−4 (network-flattening class). Prior: Jul 2 −2→−3 (ALC), Jul 5 margin correction. |

## Ceiling — v4.2 AH-1 Full Derivation (corrected margin path: 40% LT GM − opex at scale → 33% OP, 20x, 85M shares, FY-column standard)

**Sanctioned model (May 28): Yahoo-midpoint FY2027 + exit-rate logic.** Vector map for sources (revenue decomposition superseded by exit-rate model — see restructure note):
- V1 800G pluggables — peaking 2027-28, HIGH confidence (shipping, sold out)
- V2 1.6T pluggables — CEO "$2B+ in 2027," HIGH confidence, replaces 800G as driver
- V3 CATV/DOCSIS — Mediacom multi-year, contracted floor, HIGH confidence
- V4 CW laser external sales — three agreements in negotiation, LOW-MEDIUM
- V5 CPO modules — dependent on V4 closing, LOW

**Margin correction (Jul 5, 2026 audit — the MRVL-cells class):** the prior "38% OP per management" cell was a gross-margin garble — management's disclosed targets are 29.1% GM current → 35% GM year-end-2026 → **40% GM long-term**, with the 2026 guide at $1.1B revenue / >$140M non-GAAP operating income ≈ 12.7% OP; a ~38% figure sitting between the GM milestones was multiplied into the 20x as if it were operating margin, skipping opex entirely (38% OP at 40% GM implies 2% opex — impossible at a company running ~34% opex and expanding a 900K-sqft facility; no transceiver maker prints 38% OP; InnoLight cycle-peak ≈ low-30s). **Sourced path:** 40% LT GM achieved on glide by FY2028 − ~5% opex at scale (~$300M on $6B) = **33% OP FY2028-30**; FY2027 = 24% (crossover year — guided 12.7% entering, H2-exit-weighted).

| Year | Revenue | OP % | OP | × 20x | Per Share |
|------|---------|------|-----|-------|-----------|
| 2027 | $3.04B | 24% | $0.73B | $14.6B | **$172** (171.6) |
| 2028 | $6.0B | 33% | $1.98B | $39.6B | **$466** (465.9) |
| 2029 | $7.5B | 33% | $2.48B | $49.5B | **$582** (582.4) |
| 2030 | $6.5B | 33% | $2.15B | $42.9B | **$505** (504.7) |

Derivation logic: FY2027 = Yahoo consensus midpoint $3.04B (avg $2.57B / high $3.5B), back-loaded into ~$1.27B/qtr H2 exit. Exit velocity = FY2028 floor: end-2027 capacity (930K/month ≈ $6B annualized) IS the FY2028 revenue — the model assumes capacity full, which "demand 30% above capacity" supports. Peak FY2029 $7.5B, decline FY2030 $6.5B as the pluggable S-curve rolls and CPO cannibalizes (timing matches LITE's 2H27-ship/2028-volume scale-up schedule and Serenity's "past 2029" cannibalization read). 20x reflects competitive-layer economics at supercycle growth. Multiple held flat; no beat assumption (unlike CRDO — AAOI's execution record doesn't earn one).

  FY2028: $6.0B × 33% OP = $1.98B × 20x = $39.6B / 85M shares = **$466**

CEILING: $466 (FY2028 column standard; rolling FY28/FY29 blend applied in Excel per portfolio methodology — harmonized Jun 10 from prior blended-single-number convention)

## Supply Chain Role (Rule 19 cross-references)

AAOI revenue IS demand for Layer 0 positions: InP substrates likely sourced from AXT (third-party analysis draws the AAOI→AXT relationship directly; the pre-restructure artifact noted "AXTI origin"; AXT holds ~35% of global InP substrate capacity per Reuters and dominates the external market since Sumitomo ~40% consumes much internally). Epitaxy tools via AIXA MOCVD, WLBI test via AEHR. **AAOI manufactures BOTH CW and EML lasers in-house** using a proprietary MBE+MOCVD process unique in the industry — full vertical integration from epitaxy to finished transceiver module, all at Sugar Land TX (US manufacturing). This insulates AAOI from the laser-scarcity regime that gates non-integrated assemblers — but the substrate input is likely AXT-sourced (China-gated), meaning AAOI's own laser output is constrained by the same substrate availability as the rest of the industry. **Net effect: everyone gets less flour, but AAOI owns the bakery.** The competitive moat widens (Tier 2 assemblers can't source finished lasers) while the production ceiling is shared.

## Key Risks

- **Customer concentration:** 3 customers = 91% (Microsoft ~29%). One slowdown is catastrophic to the hockey stick.
- **InP substrate sourcing (corrected Jun 13).** AAOI's vertical integration (in-house CW + EML via proprietary MBE+MOCVD) means the laser-scarcity regime is a competitive ADVANTAGE — non-integrated assemblers are gated while AAOI controls its own laser supply. But the substrate input is likely AXT-sourced (third-party analysis; pre-restructure artifact noted "AXTI origin"; AXT dominates external InP substrate market). AXT manufactures in China, inside the export-approval gate — the same named dependency Reuters attributed to COHR. AAOI's exposure is identical at the substrate level; the advantage is one layer up (owning the laser fab). **China's indium export control policy expires November 10, 2026** — renewal/tightening = substrate scarcity extends (widens AAOI's competitive moat but constrains output); lapse = substrate availability improves for everyone. InP wafer price +250% to ~$5,000 since controls began. Watch substrate sourcing commentary in earnings.
- **Pricing:** LightCounting warns capacity catch-up could sharpen ASP declines by end-2026; the widening industry gap (Jun 2026 data) argues against it near-term.
- **Link-tier substitution — CRDO AEC/ALC (added Jul 2, 2026).** CRDO's ALC (Active LED Cables — micro-LED optical, reach ≤30m, AEC-class reliability) targets the short-reach tier; CRDO management claims ramp dynamics "very much similar" to AEC. Production start mid-2027, volume 2028 (CRDO's own dated roadmap via the Jun 2 call + Saso thread convergence). Weighted **20-30%**: single interested source, micro-LED unproven at datacom volume (our own CRDO file classifies Hyperlume "dark-horse"), and the actual reliability claim on the call was 100x (not the 1000x circulating). Bounding: AAOI's backlog is 800G/1.6T scale-out (>30m — thread's own convergence: "no immediate threat"); the <7m tier was copper before AECs existed; FY28 columns insulated by sold-out-through-mid-2027 + widening 27-30% undersupply; the threat lands on FY29-30, which already model rollover (CPO cannibalization from above — ALC would be a second front from below). Cross-file note: the book holds the other side — CRDO V8 ALC/CXL priced Jun 19; this entry is the Rule 20 mirror.
  **QUEUED AAOI CHANGE #1 (not applied):** reach-tier decomposition of the FY28 $6.0B / FY29 $7.5B columns (≤30m vs >30m mix) — sources: management mix disclosure at earnings, LightCounting port-class data, backlog composition commentary. Once the split is knowable, per-tier probability weights (LPK chain-table pattern); FY29 is where a haircut would execute.
  **Pre-registered tells:** ① CRDO confirms mid-2027 ALC production start on schedule → weight up; ② first hyperscaler ALC deployment PO → FY29 haircut executes; ③ AAOI reach-mix disclosure → decomposition executes; ④ COUNTER: ALC slips from CRDO FY2027 guidance or micro-LED reliability data disappoints → class de-escalates, Risks review −3→−2.
- **Dilution:** $1.1B total ATM ($500M + $600M) funds expansion; 80.2M shares outstanding as of May 13 (SEC prospectus); 85M modeled at full execution — sensitivity: each additional 1M shares above 85M reduces FY2028 ceiling by ~$6.
- **Execution history:** AAOI has missed ramps before; this is why no beat assumption is applied and the position is a trade, not a compounder.

*Restructured Jun 10, 2026 — prior version: /mnt/user-data/outputs/versions/AAOI_artifact_pre_restructure_2026-06-10.md | ALC class + AMD rider added Jul 2, 2026 — snapshot: versions/AAOI_DeepDive_2026-07-02_pre-ALC-class.md*
