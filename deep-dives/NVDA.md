# NVIDIA Corporation (NVDA) — Deep Dive Artifact

**Score:** 53 FAIL | Base 85% | Entry 6%
**Price:** ~$224
**Ceiling:** $240-340 (FY2027-FY2028)
**Market Cap:** ~$5.5T
**Exchange:** NASDAQ
**Sector:** AI GPU + Networking + Software

---

## Core Thesis: The AI Infrastructure Monopoly

NVIDIA is the most dominant technology company since peak Microsoft. It designs the GPUs, networking (InfiniBand/Spectrum-X/NVLink), and software stack (CUDA) that power virtually all frontier AI training and increasingly inference. There is no substitute at scale.

### Pillar 1 — Data Center GPU

Q1 FY2027 DC revenue: $75.2B. Hyperscalers $38B (+12% Q/Q), ACIE (AI clouds, industrial, enterprise) $37B (tripled YoY). Blackwell drives 70% of DC compute. Every hyperscaler is a customer. Every sovereign AI program buys NVIDIA.

Rubin architecture shipping H2 2026. Rubin Ultra NVL576 (8 racks) is the CPO-enabling platform. GB300 Ultra moving from sampling to production.

### Pillar 2 — Networking

NVLink, InfiniBand, Spectrum-X. Networking revenue surging as GPU clusters scale. NVL72 requires 36 switches. NVL576 (Rubin Ultra) requires CPO-enabled switches. SIG channel checks: 2:1 transceiver:GPU ratio confirmed for Rubin. InfiniBand peaking 2026, Spectrum-X taking over.

NVIDIA drives the optical interconnect demand the entire portfolio feeds on.

### Pillar 3 — Software/CUDA

The true moat. CUDA ecosystem has 5M+ developers. ROCm (AMD) improving but years behind. Every AI framework defaults to CUDA. Switching cost measured in years of developer retraining. Jensen: "CUDA is a $50B ecosystem."

---

## Financials (Q1 FY2027 — Reported May 20, 2026)

**Q1 FY2027:** $81.62B revenue (beat $79.18B consensus by 3.1%)
- Non-GAAP EPS: $1.87 (beat $1.77 consensus)
- GAAP EPS: $2.39
- Data Center: $75.2B (beat $73B consensus)
- Hyperscalers: $38B (+12% Q/Q)
- ACIE: $37B (AI clouds tripled YoY)
- GAAP gross margin: 74.9%
- Raised quarterly dividend to $0.25/share
- Added $80B to share repurchase authorization

**Q2 FY2027 guide:** $91.0B ± 2% (beat consensus $87.3B by 4.2%)

**FY2026 full year:** $215.9B revenue (+65% YoY), $193.7B Data Center

---

## Revenue Trajectory (Base Case)

| Year | Revenue | OP Margin | Operating Profit | EPS |
|---|---|---|---|---|
| FY2026 | $215.9B | 62% | $134B | $5.47 |
| FY2027E | $367B | 65% | $239B | $9.75 |
| FY2028E | $470B | 65% | $306B | $12.49 |
| FY2029E | $550B | 65% | $358B | $14.61 |

Growth rates: FY27 +70%, FY28 +28%, FY29 +17%. Decelerating from hyper-growth but still massive absolute dollar increases.

---

## Ceiling Derivation

FY2027 base: $367B x 65% OP = $239B x 25x = $5.97T -> **$244/share**
FY2028 base: $470B x 65% OP = $306B x 23x = $7.04T -> **$287/share**
FY2029 discounted: $550B x 65% OP x 20x = $7.15T -> $292 x 0.85 = **+$58**

**Ceiling: $240-340**

P/E at $224: ~23x/18x (FY2027/FY2028 modeled EPS)

---

## Scoring

**Base: 85%**
- Product Moat: 15/15 — GPU monopoly + CUDA + networking. No substitute at scale. Perfect score.
- TAM: 15/15 — $765B AI capex (2026), $1.01T (2027). NVIDIA captures 30-40% of total.
- Cycle Stage: 10/10 — Revenue doubling. Blackwell ramping. Rubin next. Perfect execution.
- Catalysts: 9/10 — Q2 guide $91B beat, Rubin H2 2026, sovereign AI, China potential reopening.
- Alpha: 1/10 — 42 analysts, $5.5T MC. Most covered stock on earth. Zero informational edge.
- Risks: 6/10 — China export restrictions, AMD/custom ASIC competition long-term, hyperscaler concentration.

**Entry: 6%** — Ratio 1.29x (barely above 1.2x threshold). Price near ceiling LOW.

**Total: (85 x 0.6) + (6 x 0.4) = 51 + 2.4 = 53**

---

## Portfolio Relevance — THE DEMAND ENGINE

NVIDIA is the single most important company for the portfolio. Every GPU sold generates downstream demand for:
- **SIVE (#2, 112):** CPO-enabled switches need CW lasers. NVL576 = 4-5x optical content.
- **LPK.DE (#1, 113):** Advanced packaging drives glass substrate demand.
- **AEHR (#3, 97):** SiPh PIC + SiC burn-in test demand from NVIDIA supply chain.
- **MSScorps (#4, 95):** SiPh PIC inspection for NVIDIA CPO modules.
- **ShunSin (#5, 95):** CPO packaging for NVIDIA switch ASICs via Foxconn.
- **SOI.PA (#7, 83):** Photonics-SOI wafers for TSMC COUPE CPO (NVIDIA).
- **PCL (#9, 80):** Broadcom ELSFP modules for NVIDIA Spectrum-X networking.
- **AAOI (#12, 77):** 800G/1.6T transceivers for NVIDIA cluster interconnect.
- **Win Semi (#13, 77):** InP lasers fabbed for NVIDIA optical supply chain.

NVIDIA's Q2 guide of $91B and Rubin commentary directly determines the demand trajectory for ALL optically-exposed held positions. Tracking NVIDIA earnings is non-optional for portfolio management.

---

## Key Architecture Data (Framework Intelligence)

- NVL72: 72 GPUs / 36 switches. Pluggable optics. 800G transceivers.
- NVL576 (Rubin Ultra): 8 racks. First CPO on switch ASICs (not GPU). 4-5x optical content increase.
- Feynman (next): copper backplane intra-rack + CPO inter-rack. NVL1152 (8x Kyber racks).
- Transceiver:GPU ratio: 2:1 for Rubin (confirmed SIG channel checks May 19).
- CPO enabled switches ramping Q3 2026, C27 volumes 3-4x higher (Jefferies Taiwan).
- Blackwell capacity: 600K/month flat from Q4 FY2026. Rubin very small today, ramps Q4 2026.

---

## Key Risks

1. **China export controls:** Q1 excluded China DC compute revenue. Reopening = upside. Tightening = downside.
2. **Custom ASIC competition:** Google TPU (9.87M units 2027), AMD MI450/MI500, Broadcom custom. Long-term GPU share may compress from 90% to 70%.
3. **Hyperscaler concentration:** Top 4 customers = majority of DC revenue. Any single pullback = meaningful impact.
4. **Valuation:** At $5.5T and 23x FY2027 earnings, stock is priced for sustained 65% OP margins and $400B+ annual revenue. Little room for disappointment.
5. **Groq/alternative architectures:** Inference-optimized hardware could erode GPU share in specific workloads. Early but monitoring.

---

## Entry Analysis

NVIDIA becomes more interesting at:
- **$180:** Ratio crosses 1.5x, score enters ~60s
- **$140:** Score reaches ~70 (WL)
- **$100:** Score reaches ~80+ (HC)

The stock was $18.97 at 52-week low (May 2025). At that price, score would have been 95+ (highest in portfolio). The 12x move consumed all Entry. Same AMD/INTC pattern: mega-cap thesis-to-price convergence is complete.

---

## Changelog

- **May 20, 2026: 53 FAIL — INITIAL DEEP DIVE.** Added for portfolio completeness as NVIDIA is the demand engine for all optically-exposed positions. Highest Base in portfolio (85%) but minimal Entry (6%, ratio 1.29x). Q1 FY2027 just reported: $81.62B rev (beat), DC $75.2B, EPS $1.87, Q2 guide $91B (beat $87.3B consensus). Stock slides despite beat (fell on 4 of last 5 beats). FY2026 full year: $215.9B. Would have scored 95+ at $19 twelve months ago. $80B added to buyback. CPO switch ramp Q3 2026 confirmed by Jefferies.
