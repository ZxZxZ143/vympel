import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

// Validate real CDP/DOM observations, not screenshots or the implementation's
// own eligibility function. Inputs come from the matched local browser protocol.
const [baselineDirectory, candidateDirectory] = process.argv.slice(2);
assert(baselineDirectory && candidateDirectory,
    'Usage: node scripts/check-carousel-discovery-evidence.mjs BASELINE_DIR CANDIDATE_DIR');
const identity = c => JSON.stringify([c.route, c.width, c.ect, c.slow, c.cache]);
const family = url => url.includes('/responsive-v1/') ? url.slice(0, url.lastIndexOf('/') + 1) : url;
async function observations(directory) {
    const files = (await fs.readdir(directory)).filter(name => /^\d\d\.json$/.test(name));
    const entries = await Promise.all(files.map(async name => JSON.parse(await fs.readFile(path.join(directory, name)))));
    const result = new Map(entries.map(c => [identity(c), c]));
    assert.equal(result.size, entries.length, 'Duplicate measured tuple');
    return result;
}

function check(before, after) {
    assert.equal(identity(after), identity(before), 'Mismatched conditions');
    assert.equal(after.dom.connection, after.ect.toLowerCase());
    assert.equal(after.ectBefore, after.ect.toLowerCase());
    assert.deepEqual(after.errors, []);
    assert.deepEqual(after.dom.broken, []);
    assert.equal(after.dom.rails.length, before.dom.rails.length);
    let farRequestsBefore = 0;
    const forbidden = [];
    for (let railIndex = 0; railIndex < before.dom.rails.length; railIndex++) {
        const b = before.dom.rails[railIndex], a = after.dom.rails[railIndex];
        assert.deepEqual(a.cards.map(c => c.href), b.cards.map(c => c.href), 'Product order/links changed');
        assert.deepEqual(a.cards.map(c => c.text), b.cards.map(c => c.text), 'Card text changed');
        const eligible = new Set([0, 1, 2, 3]);
        for (const card of a.cards.filter(c => c.horizontal)) {
            for (const i of [card.index - 1, card.index, card.index + 1]) if (i >= 0 && i < a.cards.length) eligible.add(i);
        }
        for (const card of a.cards) {
            const original = b.cards[card.index];
            assert(Math.abs(card.rect.width - original.rect.width) < 1, 'Card width changed');
            assert(Math.abs(card.rect.height - original.rect.height) < 1, 'Card height changed');
            if (eligible.has(card.index)) {
                assert(card.img, 'Eligible image missing');
                assert.equal(card.img.srcset, original.img.srcset, 'Responsive family changed');
                assert.equal(card.img.sizes, original.img.sizes, 'Responsive sizes changed');
                assert.equal(card.img.alt, original.img.alt, 'Accessible image name changed');
            } else {
                assert.equal(card.img, null, 'Far image became discoverable');
                assert(card.noscript, 'Missing progressive image fallback');
                const prefix = family(original.img.src);
                forbidden.push(prefix);
                const isImage = r => r.type === 'Image' && r.url.startsWith(prefix);
                assert(!after.network.some(isImage), 'Far image URL was actually requested');
                farRequestsBefore += before.network.filter(isImage).length;
            }
        }
    }
    return {farRequestsBefore, forbidden};
}

const baseline = await observations(baselineDirectory), candidate = await observations(candidateDirectory);
assert.equal(baseline.size, 48, 'Require all three pages × widths × transports × ECT × cache states');
assert.deepEqual([...candidate.keys()].sort(), [...baseline.keys()].sort());
let farRequestsBefore = 0, negativeControl;
for (const [tuple, before] of baseline) {
    const after = candidate.get(tuple), result = check(before, after);
    farRequestsBefore += result.farRequestsBefore;
    if (!negativeControl && result.forbidden.length) negativeControl = {before, after, url: result.forbidden[0]};
}
assert(farRequestsBefore > 0, 'Baseline did not reproduce unnecessary discovery');
assert(negativeControl);
const leaked = structuredClone(negativeControl.after);
leaked.network.push({type: 'Image', url: negativeControl.url});
assert.throws(() => check(negativeControl.before, leaked), /Far image URL was actually requested/,
    'The evidence gate must reject an injected network leak');
const shifted = structuredClone(negativeControl.after);
shifted.dom.rails[0].cards[0].rect.width += 10;
assert.throws(() => check(negativeControl.before, shifted), /Card width changed/,
    'The evidence gate must reject a geometry regression');
console.log(JSON.stringify({status: 'PASS',matchedObservations: baseline.size,farRequestsBefore,
    farRequestsAfter: 0,negativeControls: ['network leak rejected', 'geometry change rejected']}));
