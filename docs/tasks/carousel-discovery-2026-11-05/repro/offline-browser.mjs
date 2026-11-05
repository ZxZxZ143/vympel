import {chromium as installed} from '../../.cache/image-optimization/browser/node_modules/playwright-core/index.mjs';
import {readFileSync} from 'node:fs';
import {X509Certificate,createHash} from 'node:crypto';
const pem=readFileSync(new URL('./fixture.crt',import.meta.url));
const spki=createHash('sha256').update(new X509Certificate(pem).publicKey.export({type:'spki',format:'der'})).digest('base64');
export const chromium={launch(options){return installed.launch({...options,args:[...(options.args??[]),'--no-proxy-server','--disable-background-networking','--ignore-certificate-errors-spki-list='+spki,'--host-resolver-rules=MAP preview.vympel.kz:443 127.0.0.1:19767, MAP api.vympel.kz:443 127.0.0.1:19767, MAP * ~NOTFOUND']});}};
