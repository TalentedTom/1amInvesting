# MRVL — Marvell Technology Deep Dive

**Framework Version:** v4.3.1 / Clean-State Artifact Rule  
**Status:** Active probability-led model  
**Company:** Marvell Technology  
**Ticker:** MRVL  
**Classification:** Custom AI silicon + CXL / memory fabric + optical scale-up platform  
**Reference price at update:** $296.08  
**Reference market cap at update:** ~$264.3B  
**Framework multiple:** 20x operating profit  
**Base:** 51 / 60 = 85%  
**FY2027 ceiling:** $102/share  
**FY2028 ceiling:** $163/share  
**FY2029 ceiling:** $263/share  
**FY2030 ceiling:** $378/share  

---

# Executive Summary

Marvell is a custom AI infrastructure platform for heterogeneous AI clusters.

The key update is the **Google third-route TPU breadcrumb**.

The current evidence stack suggests Google is no longer simply using multiple suppliers for the same TPU design. Google appears to be running multiple TPU architecture paths:

1. Broadcom route.
2. MediaTek route.
3. Undisclosed third route.

The undisclosed third route is not confirmed as Marvell. But the probability that it is Marvell is high enough to model now because:

- Reuters reported Google was in talks with Marvell for two AI chips: a memory-processing unit to complement TPUs and a new TPU for inference.
- Additional supply-chain reporting describes Google’s diversified TPU supply chain as including Broadcom, MediaTek, Marvell and Intel, with Marvell in talks for a memory-processing unit and inference-focused TPU.
- The user-provided TPU roadmap showed MRVL as an alternative design-service path for TPU v10ax / Merope.
- Google’s architecture problem is increasingly memory-first, and Marvell has direct exposure to CXL, memory fabric, SerDes, optical interconnect and custom silicon.

The artifact therefore models Marvell’s Google opportunity as a probability-weighted revenue layer, not as zero until confirmed.

Core conclusion:

> MRVL is one of the few merchant platforms that can help hyperscalers build custom AI infrastructure outside a single closed GPU stack. The Google third-route breadcrumb raises the probability that Marvell becomes part of Google’s TPU architecture stack before the market gets explicit confirmation.

---

# 1. Core Thesis

Marvell sits at the intersection of four AI infrastructure shifts.

## 1.1 Custom accelerator fragmentation

AI clusters are moving from one dominant GPU architecture toward multiple accelerator families:

- NVIDIA GPU systems;
- Google TPUs;
- AWS Trainium;
- Meta MTIA;
- Microsoft Maia;
- AMD accelerators;
- specialized inference chips.

More accelerator diversity increases the value of custom silicon, high-speed connectivity, memory-side chips, optical scale-up, and merchant design capability.

## 1.2 Memory-wall architecture

The limiting resource is increasingly memory bandwidth, memory capacity, and memory movement. CXL, pooled memory, memory expansion, and near-memory acceleration become more valuable as inference and KV-cache workloads scale.

Marvell’s Structera / XConn CXL portfolio gives the company direct exposure to this memory-wall architecture.

## 1.3 Optical scale-up

Celestial AI gives Marvell a photonic fabric path that can sit close to XPUs, memory, and scale-up switches. Marvell has disclosed expected Celestial contribution in H2 FY2028, a $500M annualized run-rate by Q4 FY2028, and a $1B annualized run-rate by Q4 FY2029.

## 1.4 Google TPU / MPU probability

Google is diversifying TPU design-service partners and appears to be exploring distinct architecture paths rather than merely second-sourcing the same chip. The undisclosed third route is not confirmed as Marvell, but it maps closely to the Reuters-reported Marvell MPU / inference-TPU discussions.

This raises the probability of Marvell participation in Google’s TPU ecosystem.

---

# 2. Evidence Stack

## 2.1 Google / Marvell TPU and MPU talks

Reuters reported that Google was in talks with Marvell to develop two AI chips:

- a memory-processing unit to complement Google’s TPU;
- a new TPU for running AI models more efficiently.

Source: Reuters, “Marvell shares gain on report of deal talks with Google to develop two AI chips,” Apr. 20, 2026.  
https://www.reuters.com/business/marvell-shares-gain-report-deal-talks-with-google-develop-two-ai-chips-2026-04-20/

## 2.2 Google diversified TPU supply chain

Additional supply-chain reporting describes Google as assembling a diversified custom-chip supply chain with Broadcom, MediaTek, Marvell and Intel. The report frames Broadcom as handling high-performance TPU variants, MediaTek as designing a cost-optimized inference variant, and Marvell as being in talks for a memory-processing unit and a new inference-focused TPU.

Source: TNW, “Google assembles four-partner chip supply chain with Broadcom, MediaTek, Marvell to challenge Nvidia in inference,” Jun. 2026.  
https://thenextweb.com/news/google-inference-chips-nvidia-challenge-supply-chain

## 2.3 Third-route TPU breadcrumb

A user-provided translation of Dylan Patel’s remarks says Google still has three TPU routes internally: one with Broadcom, one with MediaTek using a different architecture, and a third with another architecture whose details were not revealed.

Model treatment:

- Not confirmed company disclosure.
- Not enough to call Marvell confirmed.
- Strong enough to increase Marvell’s Google probability because it aligns with Reuters’ MPU / inference-TPU report and the TPU roadmap breadcrumb showing MRVL as an alternative path.

## 2.4 TPU roadmap breadcrumb

The user-provided TPU roadmap image showed TPU v10ax / Merope with **BRCM or MRVL** listed for design service across compute, I/O, and back-end, and with Samsung Foundry SF2 as a possible manufacturing path.

Model treatment:

- not confirmed revenue;
- not company disclosure;
- valid probability-weighted breadcrumb;
- increases probability of MRVL participation in Google TPU / MPU / I/O / back-end paths.

## 2.5 Marvell AI revenue trajectory

Reuters reported that Marvell projected fiscal 2028 revenue approaching $15B, above Street estimates, driven by custom chips and interconnect solutions used in AI data centers. Reuters also reported that the forecast included expected contributions from Celestial AI and XConn.

Source: Reuters, “Marvell projects strong fiscal 2028 revenue on AI-driven data center boom,” Mar. 5, 2026.  
https://www.reuters.com/technology/marvell-forecasts-first-quarter-revenue-above-estimates-2026-03-05/

## 2.6 Celestial AI scale-up optics

Marvell disclosed that Celestial AI’s Photonic Fabric can be co-packaged with custom XPUs and scale-up switches. Marvell expects meaningful revenue contribution in H2 FY2028, a $500M annualized run-rate by Q4 FY2028, and a $1B annualized run-rate by Q4 FY2029.

Source: Marvell, “Marvell to Acquire Celestial AI,” Dec. 2, 2025.  
https://investor.marvell.com/news-events/press-releases/detail/1000/marvell-to-acquire-celestial-ai-accelerating-scale-up-connectivity-for-next-generation-data-centers

## 2.7 SerDes / memory-fabric relevance

TrendForce describes SerDes as pivotal for chip-to-chip bandwidth in AI infrastructure, identifies Broadcom and Marvell as leading ASIC / SerDes players, and notes MediaTek’s entry into Google’s TPU ecosystem. TrendForce also highlights Marvell’s broad IP portfolio including electrical and optical SerDes, die-to-die interconnect, advanced packaging, silicon photonics, custom HBM compute architectures, SRAM, SoC fabrics and high-speed interfaces.

Source: TrendForce, “SerDes Wars Heat Up,” Mar. 13, 2026.  
https://www.trendforce.com/news/2026/03/13/news-serdes-wars-heat-up-broadcom-marvell-mediatek-battle-for-ai-interconnect-supremacy/

---

# 3. Base Score

| Category | Score | Evidence |
|---|---:|---|
| Core Thesis | 18 / 20 | Custom AI silicon + CXL / memory fabric + optical scale-up platform. Google third-route breadcrumb improves fit. Penalties: Broadcom remains credible; Google not confirmed; customer concentration. |
| Cycle Stage | 9 / 10 | AI revenue ramp, custom ASIC acceleration, Celestial / XConn contribution path, TPU optionality. |
| TAM | 10 / 10 | Custom ASIC, memory fabric, optical scale-up, Ethernet switching, CXL pooling, heterogeneous AI clusters. |
| Catalysts | 5 / 5 | Google third-route TPU probability, Celestial run-rate milestones, XConn / Structera, NVLink Fusion, optical scale-up. |
| Macro | 9 / 10 | AI capex, inference scaling, memory wall, heterogeneous accelerator proliferation. |
| Alpha | 4 / 5 | Explicit probability modeling of Google / memory-side silicon captures the market’s breadcrumb repricing before confirmation. |
| Risks | -4 | Broadcom competition, Google non-confirmation, integration stack, customer concentration, valuation pull-forward. |
| **Total** | **51 / 60** | **85% Base** |

---

# 4. Core Revenue Model

All figures are USD billions. This is the core MRVL model before adding the incremental Google probability layer.

| Segment | FY2027E | FY2028E | FY2029E | FY2030E | AH-7 tag |
|---|---:|---:|---:|---:|---|
| Custom ASIC / hyperscaler AI silicon | 4.2 | 7.0 | 12.0 | 18.5 | MEDIUM |
| AI Ethernet / switching / high-speed connectivity | 2.5 | 3.1 | 4.0 | 5.2 | MEDIUM |
| Optical DSP / coherent / pluggable interconnect | 2.0 | 2.6 | 3.2 | 4.0 | MEDIUM |
| CXL / memory fabric / XConn / Structera | 0.4 | 0.9 | 1.7 | 2.6 | LOW-MEDIUM |
| Celestial / photonic fabric / scale-up optics | 0.0 | 0.5 | 1.5 | 3.0 | MEDIUM |
| Legacy / carrier / enterprise / storage / auto | 2.9 | 2.9 | 3.4 | 2.5 | MEDIUM |
| **Core revenue** | **12.0** | **17.0** | **25.8** | **35.8** |  |

---

# 5. Core Decomposed Margin Model

All figures are USD billions.

| Segment | FY2028 revenue | GM assumption | FY2028 gross profit |
|---|---:|---:|---:|
| Custom ASIC / hyperscaler AI silicon | 7.0 | 60% | 4.20 |
| AI Ethernet / switching / high-speed connectivity | 3.1 | 57% | 1.77 |
| Optical DSP / coherent / pluggable interconnect | 2.6 | 58% | 1.51 |
| CXL / memory fabric / XConn / Structera | 0.9 | 62% | 0.56 |
| Celestial / photonic fabric / scale-up optics | 0.5 | 65% | 0.33 |
| Legacy / carrier / enterprise / storage / auto | 2.9 | 48% | 1.39 |
| **Total** | **17.0** | **57.4% blended GM** | **9.75** |

FY2028 core operating-profit bridge:

**$9.75B gross profit − $2.59B opex = $7.16B operating profit**  
**FY2028 core OP margin = 42.1%**

---

# 6. Google TPU / MPU Probability Ledger

This is incremental Google-specific revenue above the core MRVL model.

| Scenario | Probability | What it means | FY2028 incremental revenue | FY2029 incremental revenue | FY2030 incremental revenue |
|---|---:|---|---:|---:|---:|
| 0. No material Google silicon win | 12% | Talks fail, or MRVL gets only immaterial NRE / support work | 0.00 | 0.00 | 0.00 |
| 1. MPU-only | 25% | MRVL wins memory-processing unit / memory-side companion chip | 0.15 | 0.65 | 1.50 |
| 2. MPU + TPU I/O / back-end role | 28% | MRVL wins MPU plus I/O / back-end / packaging-adjacent TPU content | 0.35 | 1.40 | 3.20 |
| 3. Two-chip Google inference platform | 25% | MRVL wins MPU plus meaningful inference TPU design-service role | 0.60 | 2.50 | 5.50 |
| 4. Strategic second-source platform | 10% | MRVL becomes recurring Google TPU design-service pillar beside Broadcom / MediaTek | 1.00 | 4.00 | 8.00 |

Probability-weighted incremental Google revenue:

| Year | Revenue |
|---|---:|
| FY2028 | 0.386 |
| FY2029 | 1.580 |
| FY2030 | 3.446 |

Per-share value assumptions:

| Variable | Assumption |
|---|---:|
| Incremental OP margin | 42% |
| Framework multiple | 20x OP |
| FY2028 diluted shares | 900M |
| FY2029 diluted shares | 915M |
| FY2030 diluted shares | 930M |

| Year | Weighted Google revenue | OP @ 42% | 20x OP value | Per-share add |
|---|---:|---:|---:|---:|
| FY2028 | 0.386 | 0.162 | 3.24 | +$3.60 |
| FY2029 | 1.580 | 0.663 | 13.27 | +$14.50 |
| FY2030 | 3.446 | 1.447 | 28.95 | +$31.10 |

---

# 7. Probability-Weighted Ceiling Derivation

Core model plus Google probability layer.

| Year | Core revenue | Google probability revenue | Total modeled revenue | Core OP | Google OP | Total OP | 20x OP value | Diluted shares | Per-share ceiling |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| FY2027 | 12.00 | 0.00 | 12.00 | 4.56 | 0.00 | 4.56 | 91.2 | 890M | **$102** |
| FY2028 | 17.00 | 0.386 | 17.386 | 7.16 | 0.162 | 7.32 | 146.4 | 900M | **$163** |
| FY2029 | 25.80 | 1.580 | 27.380 | 11.35 | 0.663 | 12.01 | 240.3 | 915M | **$263** |
| FY2030 | 35.80 | 3.446 | 39.246 | 16.14 | 1.447 | 17.59 | 351.7 | 930M | **$378** |

AH-1 chain:

**FY2027:** $12.00B revenue × 38.0% OP = $4.56B OP × 20x = $91.2B / 890M shares = **$102/share**

**FY2028:** $17.386B revenue with decomposed OP of $7.32B × 20x = $146.4B / 900M shares = **$163/share**

**FY2029:** $27.380B revenue with decomposed OP of $12.01B × 20x = $240.3B / 915M shares = **$263/share**

**FY2030:** $39.246B revenue with decomposed OP of $17.59B × 20x = $351.7B / 930M shares = **$378/share**

**Framework ceiling:** **FY2028 = $163/share**

---

# 8. Tail Sensitivity

The probability-weighted layer is the base framework output. Tail scenarios are not the ceiling unless evidence shifts the probability tree.

| Case | FY2030 incremental Google revenue | OP @ 42% | 20x value | Per-share add | FY2030 total ceiling if case becomes base |
|---|---:|---:|---:|---:|---:|
| Scenario 3: two-chip Google inference platform | 5.50 | 2.31 | 46.2 | +$50 | $397 |
| Scenario 4: strategic second-source platform | 8.00 | 3.36 | 67.2 | +$72 | $419 |

---

# 9. Probability Upgrade Triggers

Raise the Google probability layer if any of the following occur:

1. Independent report confirms MRVL tapeout / NRE for Google MPU.
2. Dylan / SemiAnalysis / local supply-chain reporting explicitly identifies the third TPU route as Marvell.
3. The TPU v10ax design-service line becomes explicitly MRVL.
4. Samsung SF2 / TPU v10ax reporting names MRVL as design-service partner.
5. Marvell management hints at a new major custom ASIC customer.
6. Google TPU disclosures become more memory-processor / pooled-memory intensive.
7. CXL memory pooling appears in Google TPU infrastructure disclosures.
8. MediaTek keeps v10x while MRVL appears in v10ax or memory-side infrastructure.
9. Broadcom commentary suggests Google design-share diversification.
10. Marvell raises AI revenue targets again.

Probability rule:

> If MRVL is explicitly named in the third TPU architecture route or a Google TPU / MPU design path, move Scenario 3 from probability-weighted to base-case modeling immediately.

---

# 10. Probability Downgrade Triggers

Lower the Google probability layer if any of the following occur:

1. The third TPU route is identified as a non-Marvell path.
2. Broadcom is confirmed as sole v10ax design-service partner.
3. MediaTek wins all v10x / v10ax I/O and back-end content.
4. Samsung SF2 TPU reports mention Broadcom only.
5. Google delays or cancels the MPU path.
6. Marvell management reduces custom ASIC revenue targets.
7. CXL / memory expansion adoption lags in AI inference.
8. Celestial ramp slips beyond H2 FY2028.
9. TPU roadmap shifts toward in-house Google design with no merchant silicon partner.
10. Marvell’s AI revenue mix becomes optical / networking only, without custom silicon expansion.

---

# 11. Cross-Book Impact

| Name | Impact | Reason |
|---|---|---|
| AVGO | Mixed but still positive | Google diversification weakens exclusivity, but TPU pie grows. Broadcom remains a leading custom silicon winner. |
| MediaTek | Positive | TPU roadmap validates MediaTek as a Google ASIC design-service partner. |
| Samsung | Strong positive | TPU v10ax / SF2 breadcrumb strengthens Samsung foundry + HBM + packaging optionality. |
| SK Hynix / MU | Neutral to positive | More TPU scale means more HBM / memory demand; Samsung may get relative share, but memory TAM expands. |
| ALAB | Positive | Heterogeneous compute and memory pooling increase value of CXL / PCIe / fabric. |
| CRDO | Positive | More custom clusters need high-speed connectivity and AECs. |
| SIVE / LITE / optical chain | Positive indirect | More TPU clusters = more optical ports, more laser and photonics demand. |
| TSMC | Slight relative negative, not thesis negative | Google wants diversification, but leading-edge AI silicon remains structurally strong. |

---

# 12. Key Risks

1. **Google non-confirmation risk** — the probability layer is not a signed contract.
2. **Third-route ambiguity** — the undisclosed third architecture could be Marvell, Google internal, Qualcomm, Samsung, Intel, or another partner.
3. **Broadcom competition** — Broadcom remains fully credible and may retain most Google custom silicon share.
4. **MediaTek competition** — MediaTek may take more I/O / back-end / inference TPU roles than MRVL.
5. **Double-counting risk** — Google revenue must remain incremental to the core model.
6. **Valuation pull-forward** — market can price FY2030 optionality before the revenue is visible.
7. **Integration risk** — Celestial, XConn, and Polariton must integrate without execution drift.
8. **Customer concentration** — a small number of hyperscalers drive the custom AI silicon opportunity.
9. **Margin risk** — 42% incremental OP margin assumes high-value custom silicon / memory fabric economics.
10. **Timing risk** — Google MPU or TPU design-service revenue may land closer to FY2030 than FY2028.

---

# 13. Current Verdict

MRVL is a high-conviction AI infrastructure platform whose value depends on custom silicon, memory fabric, and optical scale-up converging.

The Google third-route breadcrumb increases the odds that Marvell is not merely a speculative option but a live architecture path in Google’s TPU roadmap.

| Field | Current model |
|---|---:|
| Base | **85%** |
| FY2027 ceiling | **$102** |
| FY2028 ceiling | **$163** |
| FY2029 ceiling | **$263** |
| FY2030 ceiling | **$378** |
| Google FY2030 probability-weighted revenue | **$3.45B** |
| Google FY2030 probability-weighted value add | **+$31/share** |

Action:

> Keep MRVL on active watch. The model should update before confirmation when independent breadcrumbs change the probability tree. If the third TPU architecture is explicitly identified as Marvell, the Google scenario should move from probability-weighted to base-case modeling immediately.
