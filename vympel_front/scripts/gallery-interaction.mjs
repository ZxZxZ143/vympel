import assert from 'node:assert/strict';

const region = 'section[aria-label="Изображения товара"]';
const zoom = 'button[aria-label="Открыть увеличенное изображение товара"]';

function decodedSource(image) {
    return image.evaluate(async node => {
        await node.decode();
        return {current: node.currentSrc, srcset: node.srcset, sizes: node.sizes};
    });
}

/** Shared by the local production regression and the staging admission. RU route. */
export async function verifyGalleryInteraction(page, {originalUrl, requests}) {
    const gallery = page.locator(region);
    await page.locator(`${region}[aria-busy="false"]`).waitFor();
    const trigger = gallery.locator(zoom).first();
    const selectedUrl = new URL(originalUrl, page.url()).href;
    const responsive = selectedUrl.includes('/responsive-v1/');

    // Acknowledge application state, not simply a completed browser click.
    for (const number of [2, 1]) {
        const selector = `button[aria-label="Показать изображение ${number}"]`;
        await gallery.locator(`${selector}:visible`).click();
        await gallery.locator(`${selector}[aria-pressed="true"]:visible`).waitFor();
    }
    const source = await decodedSource(trigger.locator('img'));
    const thumbnail = await decodedSource(gallery.locator('button[aria-label="Показать изображение 1"]:visible img'));
    if (responsive) {
        for (const image of [source,thumbnail]) {
            assert.equal(new URL('.', image.current).href, new URL('.', selectedUrl).href);
            assert.match(image.current, /\/w\d+\.webp$/);
            assert.ok(image.srcset && image.sizes);
        }
        assert.match(thumbnail.current, /\/w(160|320)\.webp$/);
        assert(!requests.includes(selectedUrl), 'Original fetched before opening the lightbox');
    } else {
        assert.equal(source.current, selectedUrl);
        assert.equal(thumbnail.current, selectedUrl);
    }

    const observations = [];
    for (const input of ['pointer', 'keyboard']) {
        if (input === 'pointer') await trigger.click();
        else { await trigger.focus(); await trigger.press('Enter'); }
        const dialog = page.getByRole('dialog');
        await dialog.waitFor({state: 'visible'});
        assert.ok(await dialog.getAttribute('aria-labelledby'), 'Dialog has no accessible title');
        const image = dialog.locator('img');
        assert.equal(await image.count(), 1);
        assert.equal(await image.evaluate(async node => { await node.decode(); return node.currentSrc; }), selectedUrl);
        assert.ok(requests.includes(selectedUrl), 'Full original was not requested');
        if (input === 'pointer') await page.keyboard.press('Escape');
        else await dialog.getByRole('button', {name: 'Закрыть', exact: false}).click();
        await dialog.waitFor({state: 'hidden'});
        await page.waitForFunction(({region, zoom}) => document.activeElement === document.querySelector(region)?.querySelector(zoom), {region, zoom});
        observations.push({input, original: selectedUrl, closed: true, focusRestored: true});
    }
    return {source, thumbnail, acknowledgedThumbnails: [2, 1], observations};
}
