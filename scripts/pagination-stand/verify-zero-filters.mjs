import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin = 'http://127.0.0.1:3300';
const api = 'http://127.0.0.1:18080/api/public/product/filters/ru';
const evidence = 'docs/tasks/catalog-contextual-filters/zero-options';
await mkdir(evidence, {recursive: true});
const metadata = async category => {
    const response = await fetch(`${api}?categoryCode=${category}`);
    assert.equal(response.status, 200);
    return response.json();
};
const facet = (data, key) => data.filters.find(item => item.key === key);
const wrist = await metadata('WATCH_WRIST');
const empty = await metadata('WATCH_CLASSIC');
const interior = await metadata('WATCH_INTERIOR');
const wristKeys = ['mechanism', 'gender', 'caseMaterial', 'strapMaterial', 'glassType', 'stoneInlay'];
const zeroKeys = ['gender', 'strapMaterial', 'glassType', 'stoneInlay'];
const assertZero = options => {
    assert.ok(options.length > 0);
    assert.ok(options.every(option => option.count === 0 && option.disabled));
    assert.equal(new Set(options.map(option => option.value)).size, options.length);
};
for (const key of wristKeys) assertZero(facet(empty, key).options);
for (const key of zeroKeys) assertZero(facet(wrist, key).options);
for (const key of ['interiorCaseMaterial', 'interiorColor', 'interiorStyle', 'interiorMechanismType', 'powerType']) {
    assertZero(facet(interior, key).options);
}
assert.equal(facet(wrist, 'gender').options.length, 3);

const errors = [], results = [];
const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge', headless: true});
try {
    for (const width of [1440, 390]) {
        const context = await browser.newContext({viewport: {width, height: 1000}, reducedMotion: 'reduce'});
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${origin}/ru/catalog/WATCH_WRIST`);
        const consent = page.getByRole('button', {name: 'Только необходимые', exact: true});
        if (await consent.isVisible()) await consent.click();
        const open = () => page.getByRole('button', {name: 'Фильтры', exact: true}).click();
        await open();
        const form = page.locator('form').filter({has: page.getByRole('button', {name: 'Применить', exact: true})});
        const check = async (data, key) => {
            await form.getByRole('button', {name: facet(data, key).label, exact: true}).click();
            for (const option of facet(data, key).options) {
                const checkbox = form.getByRole('checkbox', {name: `${option.label}(0)`, exact: true});
                await checkbox.waitFor();
                assert.equal(await checkbox.isEnabled(), false);
                assert.equal(await checkbox.isChecked(), false);
            }
            assert.equal(await form.getByRole('checkbox').count(), facet(data, key).options.length);
        };
        for (const key of zeroKeys) {
            await check(wrist, key);
            if (key === 'gender') await form.screenshot({path: `${evidence}/gender-${width}.png`});
        }
        await page.goto(`${origin}/ru/catalog/WATCH_CLASSIC`);
        await open();
        for (const key of wristKeys) await check(empty, key);
        await form.getByRole('button', {name: facet(empty, 'caseSize').label, exact: true}).click();
        await form.getByText('Сейчас нет доступных вариантов.', {exact: true}).waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        results.push({width, genderOptions: 3, zeroGroups: zeroKeys, emptyCategoryGroups: wristKeys, emptyNumericMessage: true, overflow: false});
        await context.close();
    }
    assert.deepEqual(errors, []);
    await writeFile(`${evidence}/browser-results.json`, JSON.stringify({passed: true, mocked: false, results, errors, wrist, empty, interior}, null, 2));
    console.log('Passed: all dictionary options visible and disabled at zero; empty categories, gender, material roles and interior facets; desktop/mobile without overflow.');
} finally {
    await browser.close();
}
