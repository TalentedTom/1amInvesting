/* Compact, dated news teasers only. Never derive revisions from live prices.
 * Full approved articles remain unchanged. Future model-change lists can use
 * data-news-ticker + .news-revision to populate the strip automatically.
 */
(function (root) {
    'use strict';
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const RESEARCH = {
"beijing-ingenic-review-separates-memory-repricing-from-capacity-risk-20261022": {"en":[{"company":"Beijing Ingenic (300223.SZ)","change":"−9%","metric":"Q4’27 model: CNY 216 → CNY 197","reason":"Memory repricing balanced against fabrication capacity, paid costs and qualification; research estimate."},{"company":"Beijing Ingenic (300223.SZ)","change":"+6%","metric":"Q4’26 model → CNY 194","reason":"Nearer-term specialty memory repricing; outsourced wafer, packaging, testing and support costs remain paid."},{"company":"Beijing Ingenic (300223.SZ)","change":"−27%","metric":"Q1’30 model → CNY 173","reason":"Longer-term memory-price normalization; peak margins not extended indefinitely, allocation remains conditional."}]},
"pcl-acquisition-review-raises-q4-2027-forecast-valuation-20261022": {"en":[{"company":"PCL Technologies (4977.TW)","change":"+78%","metric":"Q4’27 model: TWD 86 → TWD 153","reason":"Pingood profit drives forecast; Malaysia ramp remains a cost, acquisition accounting and funding uncertain."}]},
"yoke-materials-review-raises-q4-2027-forecast-valuation-20261022": {"en":[{"company":"Yoke Technology (002409.SZ)","change":"+9%","metric":"Q4’27 model: CNY 108 → CNY 118","reason":"Stronger product mix and revised costs offset lower sales; qualification, financing and capacity remain conditional."}]},
"lam-and-meta-stronger-demand-different-earnings-outcomes-20261021": {"en":[{"company":"Lam Research (LRCX)","change":"+3%","metric":"Q4’27 model ceiling: $321 → $331","reason":"Memory/logic demand and services, after overlap and costs; customer acceptance timing still matters."},{"company":"Meta (META)","change":"−17%","metric":"Q4’27 model ceiling: $960 → $800","reason":"Data-center depreciation, operating costs and compensation; separate legal cash exposure remains uncertain."}]},
"unisplendour-forecast-weighs-profit-capture-and-financing-needs-20261021": {"en":[{"company":"Unisplendour (000938.SZ)","change":"−30%","metric":"Q4’27 research model → CNY 41","reason":"Equipment margins, customer acceptance and financing costs; slower execution may require conditional funding."}]},
"twist-customer-project-supports-ai-service-demand-estimate-stays-at-10-20261021": {"en":[{"company":"Twist Bioscience (TWST)","change":"0%","metric":"Q4’27 research ceiling remains ≈$10","reason":"Customer project supports AI-service demand; settlement, repeat orders and profit margin remain unverified."}]},
"intel-q4-2027-estimate-holds-at-99-costs-and-funding-remain-risks-20261021": {"en":[{"company":"Intel (INTC)","change":"0%","metric":"Q4’27 research ceiling remains ≈$99","reason":"CPU/packaging opportunities already modeled; production yields, equity claims and funding remain uncertain."}]},
"samsung-electro-mechanics-pricing-evidence-lifts-the-q4-2027-model-forecast-1-20261021": {"en":[{"company":"Samsung Electro-Mechanics (009150.KS)","change":"≈+1%","metric":"Q4’27 model → KRW 1,350,473","reason":"More weight on existing margin/repricing outcomes, no extra volume; costs paid and manufacturer pricing uncertain."}]},
"seagate-stx-q4-2027-model-forecast-rises-2-20261021": {"en":[{"company":"Seagate (STX)","change":"+2%","metric":"Q4’27 modeled ceiling → ≈USD 1,327","reason":"USD 40/TB endpoint; 30% probability on 10% of qualified shipped capacity, finite period and costs paid."}]},
"western-digital-q4-2027-model-forecast-rises-2-as-hdd-pricing-checks-strengthen-20261021": {"en":[{"company":"Western Digital (WDC)","change":"+2%","metric":"Q4’27 research model → ≈USD 819","reason":"USD 40/TB endpoint; 30% probability on 10% of qualified capacity, finite period; manufacturer pricing uncertain."}]},
"hammond-power-amazon-and-alphabet-expansion-costs-reshape-our-forecasts-20261021": {"en":[{"company":"Hammond Power (HPS-A.TO)","change":"≈−31%","metric":"Q4’27 model → CAD 338","reason":"Expansion and AEG costs precede qualified output; factory timing, recovery and funding uncertain."},{"company":"Amazon (AMZN)","change":"≈−14%","metric":"Q4’27 model → $269","reason":"Cloud expansion, depreciation and hardware costs; conditional Globalstar costs and dilution included."},{"company":"Alphabet (GOOGL)","change":"≈−13%","metric":"Q4’27 model → $363","reason":"Fuller depreciation, rented-capacity and hardware costs; paid AI adoption and funding uncertain."}]},
"fluence-sakai-and-longsys-forecast-updates-20261021": {"en":[{"company":"Fluence (FLNC)","change":"≈−73%","metric":"Q4’27 model value → $7","reason":"Slower Houston recovery and factory/support costs; qualified output, payments and funding remain uncertain."},{"company":"Sakai Chemical (4078.T)","change":"≈−43%","metric":"Q4’27 model value → JPY 4,171","reason":"Earlier expansion/profit assumptions cut; weighted capacity needs costs and uncertain commissioning."},{"company":"Longsys (301308.SZ)","change":"≈+1%","metric":"Q4’27 model value → CNY 773","reason":"Weighted Qualcomm gains and option expiry; early margins restrained, operating-profit bridge estimated."}]},
"shunsin-x-fab-and-amkor-forecast-updates-20261021": {"en":[{"company":"ShunSin (6451.TW)","change":"≈−95%","metric":"Q4’27 model value → TWD 71","reason":"Earlier profit assumptions reassessed; Vietnam costs and customer qualification remain uncertain."},{"company":"X-Fab (XFAB)","change":"≈−25%","metric":"Q4’27 model value → EUR 17","reason":"Factory costs persist during qualification; data-center/photonics timing and allocation uncertain."},{"company":"Amkor (AMKR)","change":"≈−3%","metric":"Q4’27 model value → $79","reason":"Arizona Phase 2 pre-production costs; production modeled from 2030, subject to qualification."}]},
"lam-arm-and-dell-forecast-updates-20261021": {"en":[{"company":"Dell (DELL)","change":"≈−8%","metric":"Q4’27 model value → $884","reason":"Lower-margin AI-server mix; detailed product-margin allocation remains an estimate."},{"company":"Arm (ARM)","change":"≈+5%","metric":"Q4’27 model value → $61","reason":"Probability-weighted extra merchant-CPU shipments, after costs; supply and customer acceptance required."},{"company":"Lam Research (LRCX)","change":"≈+3%","metric":"Q4’27 model value → $321","reason":"Weighted memory/logic tool-spending acceleration; acceptance, customer timing and costs constrain profit."}]},
"spacex-raises-the-stakes-for-ai-infrastructure-20261020": {"en":[{"company":"SpaceX (SPCX)","change":"≈+197%","metric":"Q4’27 research model → $296","reason":"Management compute plan drives uplift; construction, financing and share issuance remain conditional. Not company guidance."}]},
"ouster-forecast-weighs-stronger-sensing-competition-and-nearer-term-cost-guidance-20261020": {"en":[{"company":"Ouster (OUST)","change":"≈−8%","metric":"Q1’30 model ceiling → $45","reason":"30%-probability competition scenario; future expansion at risk, no lost order announced."},{"company":"Ouster (OUST)","metric":"Q4’27 model: ≈$51m operating loss","reason":"Loss widened from ≈$48m; no positive operating-earnings ceiling in this window."}]},
"tobacco-research-iqos-strength-velo-growth-and-altria-s-replacement-challenge-20261020": {"en":[{"company":"Philip Morris (PM)","metric":"Initial Q4’27 model ceiling: $187/share","reason":"IQOS mix upside; ZYN competition and customer-acquisition/production costs absorb growth."},{"company":"BAT (BTI)","metric":"Initial Q4’27 model ceiling: $75/US ADS","reason":"Velo growth; promotions, market access and Canadian-settlement costs remain risks."},{"company":"Altria (MO)","metric":"Initial Q4’27 model ceiling: $74/share","reason":"on! growth must replace declining tobacco profit; NJOY’s commercial return remains conditional."}]},
        'teradyne-forecast-rises-with-stronger-ai-testing-demand-20261020': {
            en: [{company:'Teradyne (TER)', change:'≈+4%', metric:"Q4’27 model target → $310",
                reason:'25%-probability AI/HBM test-demand scenario; extra costs and customer acceptance remain risks.'}],
            'zh-CN': [{company:'泰瑞达 (TER)', change:'约+4%', metric:'2027Q4模型目标价 → $310',
                reason:'计入25%概率的AI/HBM测试需求情景；额外成本和客户验收仍是风险。'}]
        },
        'aaoi-aixtron-and-microsoft-forecast-updates-20261019': {
            en: [
                {company:'AAOI', change:'≈−4%', metric:"Q4’26 model target → $236",
                    reason:'25% chance of a one-quarter 800G production delay; factory costs remain.'},
                {company:'AAOI', change:'↓ <1%', metric:"Q4’27 model target → ≈$463",
                    reason:'Temporary 800G ramp delay; accepted shipments remain the key test.'},
                {company:'AIXTRON (AIXA)', change:'↑ <1%', metric:"Q4’27 model target → ≈EUR 100",
                    reason:'Probability-weighted new-order pricing benefit after costs; fixed-price orders unchanged.'},
                {company:'Microsoft (MSFT)', change:'≈−2%', metric:"Q4’26 model target → $486",
                    reason:'Guidance-aligned margins; FY’27 modeled operating profit ≈−2%; Q4’27 target ≈$571 unchanged.'}
            ],
            'zh-CN': [
                {company:'AAOI', change:'约−4%', metric:'2026Q4模型目标价 → $236',
                    reason:'800G量产延迟一季度的概率为25%；工厂成本仍需承担。'},
                {company:'AAOI', change:'↓ <1%', metric:'2027Q4模型目标价 → 约$463',
                    reason:'800G量产暂时延迟；客户验收的出货量仍是关键验证。'},
                {company:'爱思强 (AIXA)', change:'↑ <1%', metric:'2027Q4模型目标价 → 约EUR 100',
                    reason:'新订单提价收益按概率加权并扣除成本；既有固定价订单不变。'},
                {company:'微软 (MSFT)', change:'约−2%', metric:'2026Q4模型目标价 → $486',
                    reason:'利润率对齐公司指引；2027财年模型营业利润约降2%；2027Q4目标约$571不变。'}
            ]
        }
    };
    const SHORT_REASONS = {
        model_news_lite: ['30%-probability scenario for higher optical circuit-switching revenue.', '计入30%概率的光电路交换收入上行情景。'],
        model_news_mediatek: ['30%-probability uplift from higher custom AI-chip revenue forecasts.', '定制AI芯片收入预测提高，按30%概率加权上调。'],
        model_news_nrgv: ['Probability-weighted Goshe power-project earnings, allowing for costs.', '计入Goshe发电项目概率加权盈利，并扣除相关成本。'],
        model_news_nbis: ['October GPU pricing +20%; two assumed +15% increases in 2027.', '10月GPU价格上涨20%；假设2027年再两次各提价15%。'],
        model_news_sivers: ['Higher customer-conversion probabilities as new optics boost laser demand.', '新光学架构提升激光需求，上调客户转化概率。'],
        model_news_lpkf: ['Probability-weighted glass-tool capture outweighs modeled production delay.', '玻璃设备业务获取的概率加权提升，超过模型投产延迟影响。'],
        model_news_aaoi: ['Probability-weighted 800G/1.6T utilization uplift; capacity/pricing unchanged.', '800G/1.6T利用率按概率加权上调；产能与定价假设不变。'],
        model_news_avgo: ['25%-probability uplift from higher AI-semiconductor revenue forecasts.', 'AI半导体收入预测提高，按25%概率加权上调。'],
        model_news_amd: ['Estimated acquisition-related share dilution; operating forecasts unchanged.', '计入收购相关预计股份稀释，经营预测不变。'],
        model_news_micron: ['Stronger supply agreements: artifact Base 88→90; ceiling and Excel Base 99 unchanged.', '供应协议覆盖增强：报告Base 88→90；目标价与Excel Base 99不变。']
    };
    function tone(change) {
        const text = String(change || '');
        if (/[−\-↓]/.test(text)) return 'negative';
        if (/[+↑]/.test(text)) return 'positive';
        return 'neutral';
    }
    function render(entry) {
        const change = entry.change
            ? '<span class="news-revision news-revision-' + tone(entry.change) + '">' + escape(entry.change) + '</span>' : '';
        return '<span class="news-headline-top"><strong>' + escape(entry.company) + (change ? ' ' + change : '') + '</strong>' +
            (entry.metric ? '<span class="news-headline-context">' + escape(entry.metric) + '</span>' : '') + '</span>' +
            (entry.reason ? '<span class="news-headline-reason">' + escape(entry.reason) + '</span>' : '');
    }
    function fromSlide(slide, language) {
        const chinese = language === 'zh-CN', pick = (en, zh) => chinese ? zh : en;
        const supplied = RESEARCH[slide.id]?.[language] || RESEARCH[slide.id]?.en;
        if (supplied) return supplied.map(item => ({...item, lang:RESEARCH[slide.id]?.[language] ? language : 'en'}));
        if (slide.id === 'oct7-expansion-news') return [{
            company: pick('58 new stocks', '新增58只股票'), metric: pick('Coverage expansion', '股票覆盖扩展'),
            reason: pick('131→189 stocks + DRAM; SKHY Base 93→99; no stocks removed.', '131→189只股票，另加DRAM；SKHY Base 93→99；无股票移除。')
        }];
        if (slide.id === 'quarter-rollover-news') return [{
            company: pick('Upside + EV Upside', 'Upside + EV Upside'), metric:'Q3’27 → Q4’27',
            reason: pick('Horizon rolled forward; Base/forecasts unchanged. Next roll: Jan 1, 2027.', '参考季度向前滚动；Base与预测不变。下次滚动：2027年1月1日。')
        }];
        if (slide.id === 'portfolio-news') return [{
            company: pick('10 new stocks', '新增10只股票'), metric: pick('Base-score updates', 'Base评分更新'),
            reason: pick('Kioxia Base 80→90; META 80→99; coverage 108→118 stocks.', '铠侠Base 80→90；META 80→99；股票覆盖108→118只。')
        }];
        const quarter = (slide.querySelector('.news-title')?.textContent + ' ' +
            slide.querySelector('.news-ceilings-heading h2')?.textContent).match(/Q([1-4])\s+(20\d{2})/);
        const metric = (quarter ? 'Q' + quarter[1] + '’' + quarter[2].slice(2) + ' ' : '') +
            pick('model target', '模型目标价');
        const revisions = Array.from(slide.querySelectorAll('.news-model-list li[data-news-ticker]')).flatMap(item => {
            const revision = item.querySelector('.news-revision'), strong = item.querySelector('strong');
            if (!revision || !strong) return [];
            const title = strong.cloneNode(true);
            title.querySelectorAll('.news-revision').forEach(el => el.remove());
            const body = item.cloneNode(true);
            body.querySelector('strong')?.remove();
            return [{
                company: title.textContent.replace(/[:：.\s]+$/, '').trim(),
                change: revision.textContent.trim(), metric,
                reason: SHORT_REASONS[item.dataset.i18n]?.[chinese ? 1 : 0] || body.textContent.trim()
            }];
        });
        if (revisions.length) return revisions;
        const ceilings = Array.from(slide.querySelectorAll('.news-ceilings .news-ceiling-card')).flatMap(card => {
            const revision = card.querySelector('.news-revision');
            if (!revision) return [];
            const target = card.querySelector('.news-values strong')?.textContent.trim();
            const currency = card.querySelector('.news-ticker')?.textContent.split('·')[1]?.trim() || '';
            return [{
                company: card.querySelector('h3')?.textContent.trim() || card.querySelector('.news-ticker')?.textContent.trim(),
                change: revision.textContent.trim(),
                metric: metric + (target ? ' → ' + target + (currency ? ' ' + currency : '') : ''),
                reason: slide.id === 'nand-news'
                    ? pick('Higher TrendForce NAND forecasts; fixed 20× model baseline, not stock returns.',
                        'TrendForce上调NAND价格预测；固定20倍模型基准，非股价回报。')
                    : slide.querySelector('.news-story')?.textContent.trim()
            }];
        });
        if (ceilings.length) return ceilings;
        // No supplied percentage: retain the actual headline and approved opening
        // paragraph. Never manufacture a change from rounded targets or live data.
        return [{company:slide.querySelector('.news-title')?.textContent.trim() || '',
            reason:slide.querySelector('.news-story')?.textContent.trim() || ''}];
    }
    const api = {tone, render, fromSlide};
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.NewsHeadlines = api;
})(typeof window !== 'undefined' ? window : globalThis);
