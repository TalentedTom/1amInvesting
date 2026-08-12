# AAOI — Applied Optoelectronics | Deep Dive

**Date:** 2026-08-11 | Q2 2026 anchor (reported 2026-08-06)
**Framework:** v6.0 (AH-11 decomposed vectors, AH-14 clean state, AH-15 latest-earnings anchor, AH-16 rolling forward-4Q ceiling)
**Status:** **HELD** ✓ | ⚡ TEMPORAL BOTTLENECK — US-anchored 800G and 1.6T pluggable ramp
**Base:** **72%** (42/60)
**Multiple:** 20× operating profit
**Diluted shares:** 92.8M at Q3 2026, rising to 113.5M by 2030 on the ATM
**Price:** $135.63
**Q3 2027 ceiling (ranking cell):** **$495.37** | Upside **3.7×** | **EV 2.66** | rank **3 of 102**
**Model tab:** `AAOI_Q_Model`

---

## 1. Core thesis

AAOI is the US-anchored, vertically integrated 800G and 1.6T pluggable transceiver ramp, with a CPO laser and ELSFP module option layered on top.

The thesis is temporal rather than monopolistic. Demand exceeds qualified supply, AAOI is expanding US module and laser capacity, and the company has a window to convert capacity into revenue before the standardised module layer normalises.

The strongest evidence is vertical integration into lasers, where gross margin is 55–65% against a roughly 40% blended corporate objective. The weakest is competitive position: AAOI is the fourth supplier qualified at one large hyperscaler for 1.6T, which buys allocation rather than pricing power.

## 2. Latest earnings anchor (AH-15)

Q2 2026, reported 2026-08-06.

| Metric | Value |
|---|---:|
| Revenue | **$191.9M** (+86% YoY, +27% sequential) |
| Data center | **$107.7M** (56%), +140.4% YoY |
| CATV | **$80.6M** (42%), +43.8% YoY |
| FTTH, telecom, other | ~$3.6M (2%) |
| Non-GAAP gross margin | **29.8%** (guide 29–30%) |
| Non-GAAP operating expenses | **$67.6M**, 35% of revenue |
| **Non-GAAP operating loss** | **$(10.3)M**, −5.4% margin |
| Non-GAAP EPS | $0.06 |
| GAAP net loss | $(22.8)M |
| Weighted diluted shares | 88.1M |

**Data center mix:** 100G 38.3%, 200G/400G 45.0%, 800G 11.9%, 10G/40G 4.4%. 400G revenue $48.4M (+27.4% sequential). 800G revenue $12.8M, up more than tenfold year over year.

Concentration is extreme: top 10 customers are 99% of revenue, with one CATV customer at 42% and two data center customers at 26% and 24%.

### Guidance

**Q3 2026:** revenue $255–290M, EPS $0.11–0.26, non-GAAP gross margin 29–30.5%, opex $70–80M per quarter. CATV $100–110M. 800G to grow nearly 5× sequentially. 100G to decline $20–25M on the memory shortage.

**Q4 2026:** more than $500M of revenue, roughly 60% growth. 800G plus 1.6T around $330M, of which 1.6T is $70–80M. Exit gross margin 32–33%.

**FY2026:** around $1.1B, explicitly limited by production capacity and supply chain rather than demand.

**Q1 2027:** 1.6T revenue doubles or more versus Q4 2026.

### Capacity, as disclosed

| Point | 800G + 1.6T units per month |
|---|---:|
| End of Q1 2026 | 100,000 |
| Current | **200,000** |
| End of 2026 | 650,000 |
| End of 2027 | **930,000**, over half from Texas |

Capacity is **completely booked from now until Q2 2027**. That is a bookings disclosure, not a demand forecast. Customer demand runs 20–40% above capacity and forecast demand exceeds capacity through mid-2027.

Texas footprint is over 1.6 million square feet. The 210,000 sq ft facility begins initial production late in Q3 2026; Pearland and Houston come online in early 2027.

### Management's mid-2027 target

| Product | Monthly revenue by mid-2027 |
|---|---:|
| 100G and 400G | ~$90M |
| 800G | ~$217M |
| 1.6T | ~$164M |
| **Total data center transceiver** | **~$471M per month** |

That is roughly $1,413M per quarter, and the model lands on it at Q3 2027. Every line inside it matches:

| Line | Management mid-2027 | Model, Q3 2027 |
|---|---:|---:|
| 100G and 400G (incl. 10G/40G) | $270M | $271M |
| 800G | $651M | $651M |
| 1.6T | $492M | $492M |
| **Total** | **$1,413M** | **$1,414M** |

**The ceiling is built to management's stated trajectory rather than haircut.** The ceiling is forward TAM math: what the company earns if the thesis works. Probability lives in the Base score, which at 72 already removes 28%. Cutting the revenue path as well for qualification, utilisation, yield and ASP would charge the same risk twice, since those are exactly the categories Base scores. Departures from a stated trajectory are permitted only for mechanical reasons, such as a disclosed capacity cap or an arithmetic constraint, never for probability.

Q3 2026 and Q4 2026 are hard company guidance and are carried at guidance rather than scaled.

### Other disclosures

- A **$200M purchase order for 1.6T**, described as "just the very beginning"
- 1.6T demand of more than 500,000 transceivers per month by end of 2027
- AAOI expects the largest AI-focused data center transceiver production capacity in the United States
- **Laser gross margin 55–65%**; ELSFP above 50%
- **ELSFP ramping later in 2026 toward about 400,000 pieces per month in 2028**
- To serve CPO demand, the laser market must grow **8–10×**; equipment lead times of 21–24 months mean the industry cannot respond quickly
- Long-term non-GAAP gross margin objective of around 40%
- Substrate supply secured into next year across two suppliers in Europe, two in Japan and three in China; now at four-inch volume manufacturing; pursuing partnership or possible joint venture with two or three
- The current bottleneck is **DSP and TIA**, not lasers
- AAOI will be the **fourth** supplier qualified by one large hyperscaler for 1.6T

## 3. CPO laser physics, as disclosed

| Application | Laser power |
|---|---:|
| 800G transceiver | 70mW |
| 1.6T transceiver | 100mW |
| **CPO / ELSFP** | **300mW** |

Next-generation ELSFP moves from 1310nm single-wavelength to DWDM, where tight wavelength spacing makes yield loss "easily 40–50%" relative to 1310nm. CPO laser die size is about six times larger or higher.

Chinese suppliers manage maybe 70mW, very few reach 100mW, and are two to three years from 300mW DWDM.

## 4. The memory read-through

Management attributed the switch shortage directly to the memory shortage and said 100G weakness persists until memory supply recovers.

| | |
|---|---|
| 100G revenue impact | **$20–25M** in the quarter |
| Effect on Q3 guidance | Growth would exceed 50% rather than the guided 35–45% |
| Management's expected recovery | Within a few months, by end of this year or early next |

This is memory scarcity suppressing end demand two layers downstream: memory shortage constrains switch production, which constrains 100G transceiver demand. It is supportive of the memory positions and a genuine, quantified headwind to AAOI.

## 5. Eight-line decomposed model (AH-11)

AAOI discloses data center revenue **by data rate**, so the model carries eight lines each with its own gross margin. Blended gross margin and operating margin are derived by formula and never entered. Opex is modelled as a percentage of revenue with explicit leverage.

The lines move in opposite directions: 100G is declining $20–25M a quarter on the memory shortage while 800G grew more than tenfold year over year and 1.6T starts from zero. A blended margin reports that mix shift as flat.

### Revenue by line, $M

| Quarter | 10G/40G | 100G | 200G/400G | 800G | 1.6T | ELSFP | CATV | Other | Revenue |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Q3 2026 | 4 | 19 | 60 | 64 | 18 | 0 | 105 | 2.5 | 272.5 |
| Q4 2026 | 3 | 12 | 45 | 255 | 75 | 6 | 110 | 2 | 508 |
| Q1 2027 | 4 | 16 | 93 | 325 | 240 | 18 | 85 | 2 | 783 |
| Q2 2027 | 3 | 16 | 172 | 431 | 367 | 42 | 85 | 2 | 1,118 |
| **Q3 2027** | 3 | 16 | 252 | 651 | 492 | 84 | 85 | 2 | **1,585** |
| Q4 2027 | 3 | 14 | 283 | 820 | 647 | 150 | 90 | 2 | 2,009 |
| Q1 2028 | 3 | 14 | 290 | 848 | 683 | 264 | 85 | 2 | 2,189 |
| Q2 2028 | 3 | 14 | 294 | 876 | 721 | 384 | 85 | 2 | 2,379 |
| Q3 2028 | 3 | 14 | 297 | 904 | 760 | 456 | 85 | 2 | 2,521 |
| Q4 2028 | 3 | 14 | 300 | 933 | 800 | 480 | 90 | 2 | 2,622 |
| Q1 2029 | 1 | 13 | 300 | 961 | 845 | 492 | 85 | 2 | 2,699 |
| Q2 2029 | 1 | 13 | 297 | 989 | 904 | 504 | 85 | 2 | 2,795 |
| Q3 2029 | 1 | 13 | 294 | 1,010 | 971 | 516 | 85 | 2 | 2,892 |
| Q4 2029 | 1 | 13 | 290 | 1,017 | 1,010 | 528 | 90 | 2 | 2,951 |
| Q1 2030 | 1 | 11 | 276 | 961 | 941 | 528 | 85 | 2 | 2,805 |
| Q2 2030 | 1 | 11 | 261 | 904 | 899 | 516 | 85 | 2 | 2,679 |
| Q3 2030 | 1 | 11 | 247 | 869 | 878 | 504 | 85 | 2 | 2,597 |
| Q4 2030 | 1 | 11 | 233 | 820 | 842 | 492 | 90 | 2 | 2,491 |

### Gross margin by line, and the derived blend

| Quarter | 10G/40G | 100G | 200G/400G | 800G | 1.6T | ELSFP | CATV | Other | **Blended** | Opex % | **OP $M** | **OP margin** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Q3 2026 | 12.1% | 20.2% | 31.0% | 26.0% | 24.0% | — | 35.2% | 20.2% | **29.9%** | 27.52%¹ | 6 | 2.3% |
| Q4 2026 | 12.2% | 20.5% | 32.5% | 33.0% | 30.0% | 50.0% | 35.5% | 20.5% | **32.8%** | 16.14% | 85 | 16.6% |
| Q1 2027 | 12.3% | 20.8% | 33.5% | 35.0% | 33.0% | 50.5% | 35.8% | 20.8% | **34.2%** | 15.38% | 147 | 18.8% |
| Q2 2027 | 12.4% | 21.0% | 34.2% | 36.5% | 35.0% | 51.2% | 36.0% | 21.0% | **35.9%** | 12.06% | 266 | 23.8% |
| **Q3 2027** | 12.4% | 21.0% | 34.8% | 38.0% | 36.8% | 52.2% | 36.2% | 21.2% | **37.5%** | 9.56% | **443** | **28.0%** |
| Q4 2027 | 12.3% | 20.8% | 35.0% | 39.2% | 38.2% | 53.2% | 36.5% | 21.3% | **39.0%** | 8.38% | 616 | 30.6% |
| Q1 2028 | 12.2% | 20.5% | 34.8% | 39.8% | 39.2% | 54.2% | 36.6% | 21.4% | **40.4%** | 8.36% | 701 | 32.0% |
| Q2 2028 | 12.1% | 20.2% | 34.4% | **40.0%** | 39.8% | 55.0% | 36.7% | 21.3% | **41.4%** | 8.13% | 791 | 33.3% |
| Q3 2028 | 12.0% | 20.0% | 34.0% | 39.7% | 39.6% | 55.6% | 36.6% | 21.2% | **41.6%** | 8.03% | 847 | 33.6% |
| Q4 2028 | 11.9% | 19.8% | 33.5% | 39.2% | 39.1% | **55.8%** | 36.4% | 21.0% | **41.3%** | 8.01% | 873 | 33.3% |
| Q1 2029 | 11.8% | 19.6% | 33.0% | 38.5% | 38.4% | 55.6% | 36.2% | 20.8% | **40.8%** | 8.03% | 884 | 32.8% |
| Q2 2029 | 11.7% | 19.4% | 32.6% | 37.7% | 37.7% | 55.2% | 36.0% | 20.6% | **40.2%** | 8.00% | 899 | 32.2% |
| Q3 2029 | 11.6% | 19.2% | 32.2% | 37.0% | 37.0% | 54.7% | 35.8% | 20.5% | **39.5%** | 7.92% | 914 | 31.6% |
| Q4 2029 | 11.5% | 19.0% | 32.0% | 36.3% | 36.3% | 54.2% | 35.6% | 20.4% | **39.0%** | 7.93% | 916 | 31.0% |
| Q1 2030 | 11.4% | 18.9% | 31.8% | 35.6% | 35.7% | 53.8% | 35.4% | 20.3% | **38.6%** | 8.45% | 846 | 30.1% |
| Q2 2030 | 11.3% | 18.8% | 31.6% | 35.0% | 35.1% | 53.4% | 35.3% | 20.2% | **38.2%** | 8.97% | 782 | 29.2% |
| Q3 2030 | 11.2% | 18.7% | 31.4% | 34.5% | 34.6% | 53.0% | 35.2% | 20.1% | **37.8%** | 9.40% | 737 | 28.4% |
| Q4 2030 | 11.1% | 18.6% | 31.2% | 34.0% | 34.1% | 52.7% | 35.1% | 20.0% | **37.4%** | 9.93% | 685 | 27.5% |

¹ Q3 2026 opex of $75M sits inside the guided $70–80M range; the percentage falls sharply as revenue scales.

### Margin shape

Every laser and transceiver line rises into the 2027–2028 shortage and peaks around Q2 to Q4 2028. **800G and 1.6T end above their starting margins** because those starts are ramp margins and yield learning is permanent, while the shortage premium is not.

The two declining legacy lines are deliberately allowed to fade **below** their starting margins. The shortage-peak treatment protects bottlenecks, and 100G and 10G/40G are commoditising products being actively cannibalised.

Blended gross margin peaks at 41.6% in Q3 2028, against management's stated long-term objective of around 40%. The model sits modestly above that objective for five quarters at the shortage peak and returns below it by 2030.

### Calibration to the disclosed actual

| | Model | Disclosed |
|---|---:|---:|
| Revenue | $191.9M | $191.9M |
| Data center | $107.3M | $107.7M |
| CATV | $80.6M | $80.6M |
| 100G share of DC | 38.5% | 38.3% |
| 200G/400G share of DC | 45.2% | 45.0% |
| 800G share of DC | 12.0% | 11.9% |
| 10G/40G share of DC | 4.4% | 4.4% |
| Blended gross margin | 29.80% | 29.8% |
| Non-GAAP operating loss | $(10.41)M | $(10.3)M |

### Guidance validation

| Guidance | Model |
|---|---|
| Q3 revenue $255–290M | $272.5M, the midpoint |
| Q3 gross margin 29–30.5% | 29.85% |
| Q3 opex $70–80M | $75M |
| Q3 800G "nearly 5× sequential" | $64M |
| Q3 100G down $20–25M | $19M |
| Q4 revenue "more than $500M" | $508M |
| Q4 800G plus 1.6T ~$330M | $330M |
| Q4 1.6T $70–80M | $75M |
| Q4 exit gross margin 32–33% | 32.79% |
| Q1 2027 1.6T "doubles or more" | $240M |
| Mid-2027 DC transceivers $1,413M/qtr | $1,414M, line by line |
| ELSFP 400k pcs/mo in 2028 | $480M/qtr at a $400 ASP |

### Confidence

AAOI discloses the data center mix by data rate for the anchor quarter only. The forward line-level splits and every per-line gross margin are modelled, constrained to reproduce the disclosed segment totals and the disclosed blend.

**Line-level revenue and margin carry LOW confidence individually. The segment sums and the blend carry HIGH confidence because they are calibrated to disclosure.** No single line figure should be quoted as if it were reported.

The 200G/400G line dips in Q4 2026 and recovers through 2027. That is deliberate: capacity is completely booked until Q2 2027 and scarce capacity goes to 800G and 1.6T first, so 400G volume only returns as the Texas footprint comes online.

## 6. Rolling forward-4Q ceiling (AH-16)

> Ceiling = [OP(Q) + OP(Q+1) + OP(Q+2) + OP(Q+3)] × 20 ÷ diluted shares

| Ceiling quarter | Window priced | Forward-4Q OP $M | Shares M | **Ceiling** |
|---|---|---:|---:|---:|
| Q3 2026 | Q3 26 → Q2 27 | 504 | 92.8 | **$108.70** |
| Q4 2026 | Q4 26 → Q3 27 | 941 | 96.0 | **$196.12** |
| Q1 2027 | Q1 27 → Q4 27 | 1,472 | 99.0 | **$297.47** |
| Q2 2027 | Q2 27 → Q1 28 | 2,026 | 101.0 | **$401.20** |
| **Q3 2027** | **Q3 27 → Q2 28** | **2,551** | **103.0** | **$495.37** |
| Q4 2027 | Q4 27 → Q3 28 | 2,954 | 105.0 | **$562.74** |
| Q1 2028 | Q1 28 → Q4 28 | 3,212 | 106.0 | **$606.02** |
| Q2 2028 | Q2 28 → Q1 29 | 3,395 | 107.0 | $634.58 |
| Q3 2028 | Q3 28 → Q2 29 | 3,503 | 108.0 | $648.64 |
| Q4 2028 | Q4 28 → Q3 29 | 3,570 | 109.0 | $655.11 |
| **Q1 2029** | Q1 29 → Q4 29 | 3,613 | 110.0 | **$656.90** — peak |
| Q2 2029 | Q2 29 → Q1 30 | 3,574 | 111.0 | $644.03 |
| Q3 2029 | Q3 29 → Q2 30 | 3,458 | 111.5 | $620.25 |
| Q4 2029 | Q4 29 → Q3 30 | 3,280 | 112.0 | $585.76 |
| Q1 2030 | Q1 30 → Q4 30 | 3,049 | 112.5 | $542.07 |

**AH-1 chain, ranking cell:** 443 + 616 + 701 + 791 = 2,551. Ceiling = 2,551 × 20 ÷ 103.0 = **$495.37**.

The ceiling peaks in Q1 2029 and declines afterward as pluggable cannibalisation by CPO and NPO begins while the share count continues rising.

## 7. Base score — 42/60 = 72%

| Category | Score | Evidence |
|---|---:|---|
| Cycle Stage | 10/10 | Capacity completely booked through Q2 2027, a bookings disclosure rather than demand commentary, and the Q1-to-Q2 capacity doubling was delivered |
| Core Thesis | 13/20 | Vertically integrated from laser to module, US-anchored with a Texas footprint, laser gross margin 55–65%, and the claim to the largest AI-focused transceiver capacity in the US. This is a temporal bottleneck rather than a monopoly, and AAOI is the **fourth** qualified 1.6T supplier at one large hyperscaler |
| TAM Expansion | 8/10 | Mid-2027 target of ~$471M monthly of data center transceiver revenue, plus a CPO laser market that must grow 8–10× and carries 55–65% gross margin |
| Catalysts | 5/5 | Texas initial production in Q3 2026, the Q4 revenue step, 1.6T qualification, the $200M purchase order scaling, ELSFP first shipments |
| Macro | 9/10 | Optical interconnect is a genuine constraint, and demand runs 20–40% above capacity through mid-2027 |
| Alpha | 2/5 | Widely followed and heavily traded. The edge is ceiling-ladder timing rather than discovery |
| Risks | −5 | Five classes below |
| **Base** | **42/60 = 72%** | |

## 8. Key risks (each scored)

1. **The Q4 2026 step (−1).** Reaching around $1.1B for the year requires roughly $500M in Q4, a large sequential increase. It is capacity-consistent and it is unproven. **Kill switch:** Q4 revenue below $400M.
2. **Fourth-supplier position in 1.6T (−1).** Being the fourth qualified supplier at a large hyperscaler means allocation, not pricing power, and it invites ASP pressure as the module layer standardises. **Kill switch:** 1.6T gross margin below the corporate average when disclosed.
3. **ELSFP conversion (−1).** The ELSFP line carries the largest single contribution to the ceiling and the weakest evidence. Management states AAOI **cannot** serve first-generation CPO because lasers must go to its own transceivers first, and that next-generation DWDM ELSFP carries 40–50% yield loss. Independent technical assessment holds that AAOI cannot meet the 300mW DWDM spec and is two to three years away. **Kill switch:** no ELSFP revenue disclosed by Q4 2027, or a stated slip of the 400k/month target beyond 2028.
4. **Dilution (−1).** Diluted shares went from 88.1M to a guided 92.8M in one quarter. The ATM has raised $538.8M net, Q2 capital investment was $565.5M, and management expects higher second-half capex funded partly by equity. **Kill switch:** share count rising more than 10% in any twelve-month period.
5. **Memory-driven 100G weakness (−1).** Quantified at $20–25M this quarter, with management expecting recovery within months while every memory source in this book points past 2027. **Kill switch:** the 100G drag persisting into H2 2027.

*Not scored:* substrate supply. Management states supply is secured into next year across seven suppliers in three regions, the company is not currently constrained, and it is pursuing a partnership or possible joint venture.

## 9. ELSFP sensitivity

ELSFP contributes **$478M of gross profit inside the ranking-cell window**, out of $2,551M of forward-4Q operating profit. It is the single largest discretionary input in the model.

| ELSFP assumption | Q3 2027 ceiling | Upside | EV | Rank |
|---|---:|---:|---:|---:|
| Line at zero | ~$418 | 3.1 | ~2.23 | ~6 |
| Half the management figure | ~$457 | 3.4 | ~2.45 | ~4 |
| **Management's 400k/month at a $400 ASP** | **$495.37** | **3.7** | **2.66** | **3** |

Scale check: 400,000 modules a month is roughly 2.5× the peak ELS module volume this book models for Lumentum in 2030, two years earlier, and Lumentum holds a single ELS module order. That comparison is model against claim rather than disclosure against disclosure, and the gap is large.

Against that, the 400k figure is management-stated, Chinese suppliers manage maybe 70mW with very few at 100mW, and AAOI is vertically integrated in lasers in a way pure assemblers are not.

**Rank 3 is conditional on ELSFP. Rank 6 is the floor.**

## 10. Inflection watch

| Quarter | What must happen |
|---|---|
| Q3 2026 | Revenue within $255–290M; Texas initial production begins |
| **Q4 2026** | **More than $500M delivered.** The single most important test in the model |
| Q1 2027 | 1.6T revenue doubles or more versus Q4; utilisation rises without margin compression |
| Q2 2027 | 800G at full capacity, ELSFP contributing, gross margin above 30% |
| Mid-2027 | Progress toward the ~$471M monthly data center run rate |
| Q4 2027 | First disclosed ELSFP revenue. The gate on the entire ELSFP vector |
| Q1–Q2 2028 | The $2.2B quarterly run rate proves durable |
| Q1–Q2 2029 | Peak-cycle check: does 1.6T offset 800G ASP erosion |

## 11. Cross-book

- **Memory complex (SNDK, MU, Samsung, SK Hynix, all held).** AAOI is the clearest quantified case of memory scarcity destroying downstream demand, at $20–25M a quarter in 100G.
- **LITE and COHR.** Direct competitors in the high-power CPO laser and ELS module layer. Lumentum holds a first ELS module order for 2H 2027 delivery; AAOI's ELSFP target is larger and later-evidenced.
- **AXTI, IQE.L.** InP substrate and epitaxy into the same chain. AAOI's seven-supplier substrate arrangement and possible joint venture is a demand-side signal for both.
- **TSEM.** Silicon photonics foundry capacity, an alternative architecture to AAOI's InP-anchored approach.

## 12. Open rulings

1. **Base holds at 72.** Core Thesis at 13/20 is the line to challenge: the fourth-supplier position in 1.6T is what holds it there.
2. **ELSFP inclusion.** The line moves the rank from 6 to 3 and rests on a management capacity statement contradicted by independent technical assessment. Confirm whether it stays at the full management figure, at half, or at zero.
3. **Blended gross margin exceeds management's stated long-term objective** of around 40% for five quarters at the shortage peak, reaching 41.6%. That is the shortage-peak treatment applied to a company that has published a ceiling on its own ambition.

**Footer:** snapshot `/mnt/user-data/outputs/v5.0.61_AAOI_ceiling_at_target.xlsx`, tab `AAOI_Q_Model`.
