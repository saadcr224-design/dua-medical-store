import {createWorker} from 'tesseract.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {pathToFileURL} from 'node:url';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dua-ocr-'));
fs.writeFileSync(path.join(temp,'layout.mjs'),ts.transpileModule(fs.readFileSync('lib/ocr-layout.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText);
const {tsvToTable,labelledMedicine}=await import(pathToFileURL(path.join(temp,'layout.mjs')));
const worker=await createWorker('eng',1,{langPath:path.resolve('public/ocr/lang'),cacheMethod:'none'});
try{const {data}=await worker.recognize(path.resolve('tests/fixtures/ocr-label.png'),{},{text:true,tsv:true});const text=tsvToTable(data.tsv);const draft=labelledMedicine(text);assert.match(draft.name,/QA PRODUCT/);assert.match(draft.formula,/Verified label/i);assert.equal(draft.price,'25');assert.equal(draft.stock,'10');assert.equal(labelledMedicine('Unknown package text').formula,'');assert.equal(tsvToTable('level\tpage_num\n'),'');console.log('PASS: photo OCR, labelled-field extraction, and missing fields remain blank.');}finally{await worker.terminate();fs.rmSync(temp,{recursive:true,force:true})}
