import http from 'node:http';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {openApi} from './api-adapter.mjs';
const manifest=JSON.parse(fs.readFileSync('/fixture/manifest.json'));
const api=openApi('/fixture/data',manifest,process.env.FIXTURE_MODE,console.log);
http.createServer(api).listen(19746,'127.0.0.1',()=>createRequire('/app/server.js')('/app/server.js'));
