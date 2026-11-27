const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {visit} = require('../research-tools.js');

function storage() {
    const values = new Map();
    return {getItem:key => values.get(key), setItem:(key,value) => values.set(key,value)};
}

test('a return visit detects new articles and preserves unread status on reload', () => {
    const local = storage(), firstTab = storage(), nextTab = storage();
    const first = visit(['archive'],local,firstTab,100);
    assert.equal(first.first,true);
    assert.equal(first.isNew('archive'),false);
    const newer = visit(['revision','archive'],local,nextTab,200);
    assert.equal(newer.isNew('revision'),true);
    const reload = visit(['revision','archive'],local,nextTab,300);
    assert.equal(reload.isNew('revision'),true);
    reload.markRead();
    assert.equal(visit(['revision','archive'],local,nextTab,400).isNew('revision'),false);
});

test('an idle tab starts a fresh visit and recognizes a late-posted bulletin', () => {
    const local = storage(), session = storage();
    visit(['original'],local,session,100);
    const later = visit(['original','late'],local,session,31 * 60000);
    assert.equal(later.isNew('original'),false);
    assert.equal(later.isNew('late'),true);
});

function readPublicData(file) {
    const script = fs.readFileSync(path.join(__dirname,'..',file),'utf8');
    return JSON.parse(script.slice(script.indexOf('{'),script.lastIndexOf('}')+1));
}

test('every listing has one short sentence in each language and a public model baseline', () => {
    const companies = readPublicData('data.js').en.filter(row => row.Ticker);
    const profiles = readPublicData('company-descriptions.js');
    const history = readPublicData('model-snapshots.js');
    for (const row of companies) {
        const [english,mandarin] = profiles[row.Ticker];
        assert.match(english,/^[^.!?]+[.]$/,row.Ticker);
        assert.match(mandarin,/^[^。！？]+。$/u,row.Ticker);
        assert.ok(english.split(/\s+/).length<=25 && mandarin.length<=65,row.Ticker);
        const records = history[row.Ticker];
        assert.ok(records.length>0 && records.every(record => Number.isFinite(Date.parse(record.at))),row.Ticker);
        const latest = records.at(-1).inputs;
        if (row._synthetic) assert.ok(latest.weights,row.Ticker);
        else if (latest.target !== null) assert.equal(latest.target,Number(row[latest.quarter]),row.Ticker);
    }
});
