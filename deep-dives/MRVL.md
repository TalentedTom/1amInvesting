# MRVL — Marvell Technology | Deep Dive
---

## Supercycle: DB1 Photonics (Optical DSP + Custom ASIC + Photonic Fabric)

## TAM Expansion Lens

**Q1 (Today):** Custom AI ASICs (Amazon Trainium, Google TPU). Optical DSPs for 800G/1.6T (Inphi). Switch silicon. Storage. Data center = 75%+ of revenue.

**Q2 (3-5 Years):** Photonic Fabric (Celestial AI) for scale-up interconnects. 3.2T optical (Polariton POH). AI inference ASICs. CPO integration.

**Q3 (New Markets):** Automotive AI. Enterprise inference. Edge compute. Defense networking.

**Ford Principle:** Not "networking chips." The custom silicon + optical connectivity platform hyperscalers use to build AI infrastructure they can't buy from NVIDIA.

## The Acquisition Stack (Building the Optical-Compute Platform)

| Acquisition | Price | What | Year |
|------------|-------|------|------|
| Inphi | $10B | Coherent DSP, SiPh | 2021 |
| Innovium | $1.1B | Ethernet switch silicon | 2021 |
| **Celestial AI** | **$3.25B + $2.25B milestones** | **Photonic Fabric — scale-up optical** | **Dec 2025** |
| **XConn** | **$540M** | **PCIe/CXL switching** | **Dec 2025** |
| **Polariton** | **Undisclosed** | **POH modulators for 3.2T** | **Apr 2026** |

Most complete optical-compute stack outside Broadcom. Each acquisition fills a gap.

## The LWLG Hidden Link

Polariton's POH modulators use LWLG's Perkinamine polymer. Marvell acquired the device but NOT the material. Perkinamine is patented, not replaceable. Marvell now has structural dependency on LWLG for its 3.2T roadmap.

## Financial Trajectory

| Period | Revenue | DC Revenue | Custom ASIC |
|--------|---------|------------|-------------|
| FY2024 | $5.77B | ~$3.3B | ~$0 |
| FY2025 | $5.77B | ~$4.1B | Ramping |
| FY2026 | $8.20B (+42%) | $6.0B+ (+46%) | ~$1.5B |
| FY2027E | ~$11B (+34%) | ~$8B+ | ~$3B+ |
| FY2028E | ~$15B (+50% DC) | ~$12B+ | ~$6B+ |

- FY2027 raised THREE times in 6 months: $9.5B → $10B → **$11B**
- Custom ASIC: ~$0 → $1.5B → doubling again by FY2028
- Celestial AI CPO: **$500M annualized run rate by Q4 FY2028**
- 18 distinct design wins in FY2026 (record)
- Google co-developing TWO custom AI chips (4th hyperscaler)
- NVIDIA **$2B investment** + ecosystem integration
- 1.6T optical entered volume production H2 FY2026
- "Revenue growth to accelerate each quarter in FY2027"

## Scoring Breakdown

| Category | Score | Evidence |
|----------|-------|---------|
| Core Thesis | 15/20 | 🔒 CHOKEPOINT: Custom ASIC duopoly — only MRVL + Broadcom can design hyperscaler AI chips. 2-3yr design cycle switching cost = structural lock-in. Amazon, Google, Microsoft, Meta all locked in. Celestial CPO exclusive. NVIDIA $2B. BUT: not physics-required (-2), Broadcom is credible competitor (-2), capital barrier not physics barrier (-1). |
| Cycle Stage | 9/10 | +42% at $8.2B. Custom ASIC $0→$1.5B. FY2027 raised 3x ($9.5B→$10B→$11B). Growth accelerating. |
| TAM | 9/10 | Custom ASIC $118B by 2033 (Counterpoint). CPO via Celestial $10B+ by 2030. Optical DSP $15-20B. Multiple vectors Phase 1. |
| Catalysts | 4/5 | FY2027 $11B. Google co-dev 2 chips. Celestial CPO $500M run rate by Q4 FY2028. Polariton 3.2T. |
| Macro | 9/10 | 120-150 GW compute. Optical era confirmed. Every rack needs DSPs. |
| Alpha | 2/5 | 32 analysts. Amazon 8-K → Marvell → Celestial → SIVE chain IS supply chain archaeology consensus missed. But thesis broadly known. |
| Risks | -1 | Broadcom competes (-1). |
| **Base** | **47/60 (78%)** | |

## ASIC Duopoly Chokepoint (April 2026)

Reclassified from ⚡ BOTTLENECK to 🔒 CHOKEPOINT. Custom ASIC is a duopoly — only MRVL and Broadcom can design hyperscaler-custom silicon. 2-3 year design cycle = structural switching costs. No new entrant can replicate this in less than 5 years.

Four hyperscalers locked in: Amazon (Graviton/Trainium), Google (TPU), Microsoft (Maia), Meta (MTIA). Each on multi-year design contracts. Once a hyperscaler commits to MRVL for custom silicon, they can't switch mid-generation.

## Revenue Raised — ASIC Doubling + Celestial CPO (April 2026)

FY2030 revenue raised from $20-22B to $30-35B. Two drivers:

1. Custom ASIC revenue doubling as hyperscalers shift from merchant GPU to custom silicon for inference efficiency
2. Celestial CPO platform: $10B+ TAM. MRVL's CPO ASIC (Celestial) is the switch chip inside CPO modules — every CPO deployment needs Marvell silicon

Combined: MRVL is both the custom compute chip AND the CPO switch chip. Dual chokepoint.

## Ceiling — v4.0 AH-1 Full Derivation (MRVL Q1 FY2027 Earnings Call, 40% OP, 30x, blended)

### Revenue Model (Earnings call guided + extrapolated):

MRVL CEO May 27, 2026: FY2027 raised to $11.5B (+40%), FY2028 raised to $16.5B (+$1.5B vs prior). Custom silicon $10B+ FY2029 confirmed. Interconnect >70% YoY. Scale-up optics $300M+ (Celestial + MRVL). "Every program we looked at a year ago is larger when we look a year later."

| Year | Revenue | Growth | Source |
|------|---------|--------|--------|
| FY2027 | $11.5B | +40% | Guided on earnings call |
| FY2028 | $18.0B | +57% | Guided $16.5B + upward bias from "every program larger" |
| FY2029 | $26.0B | +44% | Custom $10B+ confirmed, interconnect + scale-up optics |
| FY2030 | $35.0B | +35% | Decelerating |

### Full Valuation Table (40% OP, 30x ASIC duopoly, ~915M shares):

Q1 FY2027 non-GAAP OP margin 35%. Management targets upper end of 38-40% by FY2028. 40% flat reflects Broadcom-convergence as ASIC becomes dominant revenue. Broadcom at 45%+ validates trajectory.

| Year | Revenue | OP (40%) | × 30x | Per Share |
|------|---------|----------|-------|-----------|
| 2027 | $11.5B | $4.60B | $138B | $151 |
| 2028 | $18.0B | $7.20B | $216B | $236 |
| 2029 | $26.0B | $10.40B | $312B | $341 |
| 2030 | $35.0B | $14.00B | $420B | $459 |

FY2027 at $151 vs current $197. Market pricing ~18 months forward.

### Ceiling Derivation (Blended May 2026):

  (8/12 × $236) + (4/12 × $341) = $271

CEILING: $271 (blended 67% FY2028 + 33% FY2029)

## Key Risks

- Broadcom competes for same hyperscaler ASIC wins
- $137B market cap = need to become top-10 global company for meaningful returns
- Three acquisitions in 6 months = integration risk
- Custom ASIC customer concentration (Amazon, Google dominant)
