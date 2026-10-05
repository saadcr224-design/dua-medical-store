import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const require=createRequire(import.meta.url),temp=fs.mkdtempSync(path.join(os.tmpdir(),'dua-pdf-'));
const source=fs.readFileSync('lib/pdf-import.ts','utf8').replace("'/vendor/pdfjs-6.3.289/pdf.min.mjs'",JSON.stringify(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href));
fs.writeFileSync(path.join(temp,'pdf.mjs'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
const {extractPDF,guessField,mappedCSV}=await import(pathToFileURL(path.join(temp,'pdf.mjs')));
function makePDF(content){const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`];let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});const start=Buffer.byteLength(pdf);pdf+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;return new File([pdf],'test.pdf',{type:'application/pdf'})}
const worker=pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
const text=await extractPDF(makePDF('BT /F1 12 Tf 1 0 0 1 40 730 Tm (Name) Tj 1 0 0 1 220 730 Tm (Formula) Tj 1 0 0 1 440 730 Tm (Price) Tj 1 0 0 1 40 700 Tm (QA product) Tj 1 0 0 1 220 700 Tm (Verified label) Tj 1 0 0 1 440 700 Tm (Rs 10) Tj ET'),()=>{},worker);
const lines=text.split('\n').map(x=>x.split('\t'));assert.deepEqual(lines[0],['Name','Formula','Price']);assert.deepEqual(lines[1],['QA product','Verified label','Rs 10']);const mapped=mappedCSV(lines,lines[0].map(guessField),true,'Tablet');assert.ok(mapped.includes('"10"'));assert.ok(mapped.includes('"Verified label"'));assert.throws(()=>mappedCSV(lines,['name','ignore','price'],true,'Tablet'));
await assert.rejects(()=>extractPDF(makePDF(''),()=>{},worker),/browser text recognition/);
console.log('PASS: searchable PDF extraction, column mapping, currency normalization, missing formula rejection, and image-only/empty-page rejection.');fs.rmSync(temp,{recursive:true,force:true});
