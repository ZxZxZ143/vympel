// Read-only staging gate. Start it on the approved retry release only after the guarded update.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {verifyGalleryInteraction} from '../../vympel_front/scripts/gallery-interaction.mjs';

const [manifestPath, evidencePath] = process.argv.slice(2);
assert(manifestPath && evidencePath, 'Provide the reviewed manifest and a fresh evidence path');
const raw = await readFile(manifestPath);
assert.equal(createHash('sha256').update(raw).digest('hex'), '0effd7c78b16ece3ee0362a1d24bdfce64fd4bb3417324c89118e129492d725f');
const manifest = JSON.parse(raw);
const original = manifest.images.find(f => f.oldKey === 'product/d28811e6-f5ab-4cb4-9858-ffb017a94dcf.png');
assert(original);
const origin = 'https://preview.vympel.kz';
const credentials = {origin, username:process.env.VYMPEL_PREVIEW_USER, password:process.env.VYMPEL_PREVIEW_PASSWORD};
assert(credentials.username && credentials.password, 'Process-only preview credentials required');
const module = process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright';
const {chromium} = await import(module);
const browser = await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge',headless:true});
const receipt = {startedAt:new Date().toISOString(),status:'FAIL',cases:[]};
try {
    for (const width of [390,1440]) {
        const context = await browser.newContext({viewport:{width,height:width===390?844:1000},deviceScaleFactor:width===390?2:1,httpCredentials:credentials});
        try {
            const page = await context.newPage();
            const requests=[], errors=[];
            page.on('request',r=>{if(r.resourceType()==='image') requests.push(r.url());});
            page.on('pageerror',e=>errors.push(e.message));
            const response = await page.goto(origin+'/ru/product/46',{waitUntil:'domcontentloaded'});
            assert.equal(response.status(),200);
            const consent = page.getByRole('button',{name:'Только необходимые',exact:true});
            if (await consent.isVisible()) await consent.click();
            const result = await verifyGalleryInteraction(page,{
                originalUrl:'https://api.vympel.kz/media/vympel-staging/'+original.originalKey, requests,
            });
            assert.deepEqual(errors,[]);
            receipt.cases.push({width,...result});
        } finally { await context.close(); }
    }
    receipt.status='PASS';
} catch (error) {
    receipt.reason=error.message; process.exitCode=1;
} finally {
    await browser.close();
    await writeFile(evidencePath, JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({status:receipt.status,cases:receipt.cases.length,reason:receipt.reason}));
}
