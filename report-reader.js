/* A website reading screen for public stock reports.
   PDF.js is loaded only when a visitor opens the report. */
(function () {
    'use strict';
    const CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/';
    let libraryPromise;
    function library() {
        if (!libraryPromise) {
            const css = new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = CDN + 'web/pdf_viewer.css';
                link.onload = resolve;
                link.onerror = () => { link.remove(); reject(new Error('Reader styles unavailable')); };
                document.head.appendChild(link);
            });
            libraryPromise = Promise.all([import(CDN + 'legacy/build/pdf.mjs'), css])
                .then(([pdf]) => {
                    pdf.GlobalWorkerOptions.workerSrc = CDN + 'legacy/build/pdf.worker.mjs';
                    return pdf;
                }).catch(error => { libraryPromise = null; throw error; });
        }
        return libraryPromise;
    }

    function mount(host, url, { translate: tr, isCurrent, toolsHost }) {
        let closed = false, task, pdf, observer, resizeObserver, resizeTimer;
        let zoom = 1, currentPage = 1, width = 0;
        const blocks = [], active = new Set();
        const alive = () => !closed && isCurrent();
        const root = document.createElement('div');
        root.className = 'report-reader';
        const toolbar = document.createElement('div');
        toolbar.className = 'report-tools';
        const progress = document.createElement('span');
        progress.className = 'report-progress';
        progress.textContent = tr('modal_loading');
        const controls = document.createElement('div');
        controls.className = 'report-zoom';
        function button(text, label, click) {
            const b = document.createElement('button');
            b.type = 'button'; b.textContent = text; b.title = label;
            b.setAttribute('aria-label', label);
            b.addEventListener('click', click); controls.appendChild(b);
            return b;
        }
        const smaller = button('A−', tr('report_smaller'), () => changeZoom(-0.25));
        const fit = button(tr('report_fit'), tr('report_fit'), () => changeZoom(1 - zoom));
        const larger = button('A+', tr('report_larger'), () => changeZoom(0.25));
        toolbar.append(progress, controls);
        const scroll = document.createElement('div');
        scroll.className = 'report-scroll';
        scroll.tabIndex = 0; scroll.setAttribute('aria-label', tr('report_scroll'));
        const pages = document.createElement('div');
        pages.className = 'report-pages';
        scroll.appendChild(pages);
        if (toolsHost) toolsHost.replaceChildren(toolbar);
        else root.appendChild(toolbar);
        root.appendChild(scroll);
        host.replaceChildren(root);

        function updateProgress() {
            if (pdf) progress.textContent = tr('report_page', { n: currentPage, total: pdf.numPages });
            smaller.disabled = zoom <= 0.75; larger.disabled = zoom >= 2.5;
        }
        function release(block) {
            ++block.token;
            block.renderTask?.cancel();
            block.textTask?.cancel();
            block.renderTask = block.textTask = null;
            for (const canvas of block.el.querySelectorAll('canvas')) canvas.width = canvas.height = 0;
            block.el.replaceChildren();
            block.el.classList.remove('report-rendered');
            block.rendering = false;
        }
        function layout() {
            if (!alive() || !blocks.length) return;
            const available = Math.max(240, scroll.clientWidth - (scroll.clientWidth < 600 ? 16 : 32));
            const nextWidth = Math.round(Math.min(1040, available) * zoom);
            if (nextWidth === width) return;
            const anchor = blocks[currentPage - 1];
            const fraction = anchor ? Math.max(0, (scroll.scrollTop - anchor.el.offsetTop) / anchor.el.clientHeight) : 0;
            width = nextWidth;
            for (const block of blocks) {
                release(block);
                block.el.style.width = width + 'px';
                block.el.style.height = width * block.ratio + 'px';
            }
            if (anchor) scroll.scrollTop = anchor.el.offsetTop + fraction * anchor.el.clientHeight;
            for (const block of active) render(block);
        }
        function changeZoom(amount) {
            zoom = Math.max(0.75, Math.min(2.5, zoom + amount));
            layout(); updateProgress();
        }
        async function links(page, viewport, container, token, block) {
            const annotations = await page.getAnnotations();
            if (!alive() || token !== block.token) return;
            const layer = document.createElement('div');
            layer.className = 'report-link-layer';
            for (const annotation of annotations) {
                if (annotation.subtype !== 'Link' || !annotation.rect) continue;
                let safeUrl;
                if (annotation.url) {
                    try {
                        const parsed = new URL(annotation.url);
                        if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) safeUrl = parsed.href;
                    } catch (_) {}
                }
                if (!safeUrl && !annotation.dest) continue;
                const link = document.createElement('a');
                const rect = [
                    ...viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]),
                    ...viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3])
                ];
                Object.assign(link.style, {
                    left: Math.min(rect[0], rect[2]) + 'px', top: Math.min(rect[1], rect[3]) + 'px',
                    width: Math.abs(rect[2] - rect[0]) + 'px', height: Math.abs(rect[3] - rect[1]) + 'px'
                });
                if (safeUrl) {
                    link.href = safeUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
                    link.setAttribute('aria-label', safeUrl);
                } else {
                    link.href = '#'; link.setAttribute('aria-label', tr('report_section'));
                    link.addEventListener('click', async event => {
                        event.preventDefault();
                        try {
                            const destination = typeof annotation.dest === 'string' ? await pdf.getDestination(annotation.dest) : annotation.dest;
                            if (!destination || !alive()) return;
                            const index = typeof destination[0] === 'number' ? destination[0] : await pdf.getPageIndex(destination[0]);
                            blocks[index]?.el.scrollIntoView({ block: 'start' });
                        } catch (_) {}
                    });
                }
                layer.appendChild(link);
            }
            container.appendChild(layer);
        }
        async function render(block) {
            if (!alive() || block.rendering || block.el.classList.contains('report-rendered')) return;
            block.rendering = true;
            const token = ++block.token;
            try {
                const page = await pdf.getPage(block.number);
                if (!alive() || token !== block.token) return;
                const natural = page.getViewport({ scale: 1 });
                const viewport = page.getViewport({ scale: width / natural.width });
                block.ratio = natural.height / natural.width;
                block.el.style.height = viewport.height + 'px';
                block.el.style.setProperty('--scale-factor', viewport.scale);
                block.el.style.setProperty('--total-scale-factor', viewport.scale);
                const canvas = document.createElement('canvas');
                canvas.setAttribute('aria-hidden', 'true');
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                canvas.width = Math.ceil(viewport.width * dpr);
                canvas.height = Math.ceil(viewport.height * dpr);
                canvas.style.width = viewport.width + 'px'; canvas.style.height = viewport.height + 'px';
                const text = document.createElement('div'); text.className = 'textLayer';
                block.el.replaceChildren(canvas, text);
                block.renderTask = page.render({
                    canvasContext: canvas.getContext('2d'), viewport,
                    transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0]
                });
                await block.renderTask.promise;
                if (!alive() || token !== block.token) return;
                // getTextContent() uses ReadableStream async iteration, which
                // some Safari releases lack. TextLayer consumes getReader()
                // directly and also cancels its stream when the page is released.
                try {
                    block.textTask = new block.lib.TextLayer({ textContentSource: page.streamTextContent(), container: text, viewport });
                    await block.textTask.render();
                } catch (error) {
                    if (!alive() || token !== block.token) return;
                    text.replaceChildren();
                    console.warn('Research text selection unavailable:', error.message);
                }
                if (!alive() || token !== block.token) return;
                // Optional overlays must never erase a successfully drawn page.
                try { await links(page, viewport, block.el, token, block); }
                catch (error) {
                    if (!alive() || token !== block.token) return;
                    console.warn('Research links unavailable:', error.message);
                }
                if (!alive() || token !== block.token) return;
                block.el.classList.add('report-rendered');
            } catch (error) {
                if (!alive() || token !== block.token || error.name === 'RenderingCancelledException' || error.name === 'AbortException') return;
                console.warn('Research page could not be rendered:', error.message);
                for (const canvas of block.el.querySelectorAll('canvas')) canvas.width = canvas.height = 0;
                block.el.replaceChildren();
                const fallback = document.createElement('div'); fallback.className = 'report-page-error';
                const message = document.createElement('p'); message.textContent = tr('report_page_error');
                const retry = document.createElement('button');
                retry.type = 'button'; retry.className = 'report-page-retry'; retry.textContent = tr('report_retry');
                retry.addEventListener('click', () => render(block));
                const original = document.createElement('a'); original.textContent = tr('report_original');
                const target = new URL(url, window.location.href); target.hash = 'page=' + block.number;
                original.href = target.href; original.target = '_blank'; original.rel = 'noopener noreferrer';
                fallback.append(message, retry, original); block.el.appendChild(fallback);
            } finally {
                if (token === block.token) block.rendering = false;
            }
        }
        scroll.addEventListener('scroll', () => {
            const top = scroll.getBoundingClientRect().top;
            const visible = blocks.find(block => block.el.getBoundingClientRect().bottom > top + 10);
            if (visible && visible.number !== currentPage) { currentPage = visible.number; updateProgress(); }
        }, { passive: true });
        const ready = (async () => {
            try {
                const lib = await library();
                if (!alive()) return;
                task = lib.getDocument({
                    url, isEvalSupported: false,
                    cMapUrl: CDN + 'cmaps/', cMapPacked: true,
                    standardFontDataUrl: CDN + 'standard_fonts/', wasmUrl: CDN + 'wasm/'
                });
                pdf = await task.promise;
                if (!alive()) return;
                const first = await pdf.getPage(1);
                if (!alive()) return;
                const natural = first.getViewport({ scale: 1 });
                for (let n = 1; n <= pdf.numPages; n++) {
                    const el = document.createElement('section');
                    el.className = 'report-page'; el.dataset.page = n;
                    el.setAttribute('aria-label', tr('report_page', { n, total: pdf.numPages }));
                    pages.appendChild(el);
                    blocks.push({ el, number: n, lib, ratio: natural.height / natural.width, token: 0, rendering: false });
                }
                active.add(blocks[0]); layout(); updateProgress();
                observer = new IntersectionObserver(entries => {
                    if (!alive()) return;
                    for (const entry of entries) {
                        const block = blocks[Number(entry.target.dataset.page) - 1];
                        if (entry.isIntersecting) { active.add(block); render(block); }
                        else { active.delete(block); release(block); }
                    }
                }, { root: scroll, rootMargin: '600px 0px' });
                blocks.forEach(block => observer.observe(block.el));
                resizeObserver = new ResizeObserver(() => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(layout, 120);
                });
                resizeObserver.observe(scroll);
            } catch (_) {
                if (!alive()) return;
                host.replaceChildren();
                toolbar.remove();
                const message = document.createElement('p'); message.className = 'report-error'; message.textContent = tr('report_error');
                const link = document.createElement('a'); link.textContent = tr('report_original');
                link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
                message.append(' ', link); host.appendChild(message);
            }
        })();
        return {
            ready,
            destroy() {
                closed = true; observer?.disconnect(); resizeObserver?.disconnect(); clearTimeout(resizeTimer);
                toolbar.remove();
                blocks.forEach(release);
                if (task) Promise.resolve(task.destroy()).catch(() => {});
            }
        };
    }
    window.ReportReader = { mount };
})();
