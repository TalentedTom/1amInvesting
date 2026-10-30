const test = require('node:test');
const assert = require('node:assert/strict');
const links = require('../report-links.js');
const publicReports = new Map([['SIVE.ST', {format:'pdf'}], ['MU', {format:'pdf'}], ['AAOI', {format:'md'}]]);
test('only an explicit, single report query is a report request', () => {
    assert.equal(links.requested('https://example.com/#news-story'), null);
    assert.equal(links.requested('https://example.com/?report=SIVE.ST'), 'SIVE.ST');
    assert.equal(links.requested('https://example.com/?report=MU&report=SIVE.ST'), '');
});
test('links resolve case-insensitively to public manifest PDFs only', () => {
    assert.equal(links.resolve('sive.st', publicReports), 'SIVE.ST');
    for (const ticker of ['AAOI', 'PRIVATE', '../MU', 'https://example.com/MU.pdf', '', null])
        assert.equal(links.resolve(ticker, publicReports), null);
});
test('reader routes preserve existing news permalinks and other page parameters', () => {
    const original = 'https://example.com/?view=table#news-story';
    const opened = links.route(original, 'SIVE.ST');
    assert.equal(opened, 'https://example.com/?view=table&report=SIVE.ST#news-story');
    assert.equal(links.route(opened, null), original);
});
test('copied links omit filters, article fragments and version hashes', () => {
    assert.equal(links.share('https://www.1aminvesting.com/?view=table&v=old#story', 'SIVE.ST'),
        'https://www.1aminvesting.com/r/SIVE.ST/');
    assert.equal(links.share('https://example.com/?report=MU&v=new#other', 'SIVE.ST'),
        'https://example.com/r/SIVE.ST/');
});
test('X is first and all social composers receive the same clean report link', () => {
    const title = 'Sivers & partners · Research';
    const targets = links.social('https://www.1aminvesting.com/?v=old#story', 'SIVE.ST', title);
    const link = 'https://www.1aminvesting.com/r/SIVE.ST/';
    assert.deepEqual(targets.map(t => t.id), ['x','facebook','whatsapp','linkedin','telegram','email']);
    const x = new URL(targets[0].url);
    assert.equal(x.origin + x.pathname, 'https://x.com/intent/tweet');
    assert.equal(x.searchParams.get('url'), link); assert.equal(x.searchParams.get('text'), null);
    assert.equal(new URL(targets[1].url).searchParams.get('u'), link);
    assert.equal(new URL(targets[2].url).searchParams.get('text'), title + '\n' + link);
    assert.equal(new URL(targets[3].url).searchParams.get('url'), link);
    assert.equal(new URL(targets[4].url).searchParams.get('url'), link);
    const email = new URL(targets[5].url);
    assert.equal(email.protocol, 'mailto:'); assert.equal(email.searchParams.get('subject'), title);
    assert.equal(email.searchParams.get('body'), title + '\n\n' + link);
});
