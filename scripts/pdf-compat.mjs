import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
const dir='dist/client/_next/static/chunks';
if(!existsSync('dist/client/vendor/pdfjs-6.3.289/pdf.min.mjs'))throw new Error('PDF reader missing from build');
mkdirSync(dir,{recursive:true});
for(const file of ['pdf-CJeOODTT.js','pdf-BUNsfDqH.js'])writeFileSync(dir+'/'+file,"export * from '/vendor/pdfjs-6.3.289/pdf.min.mjs';\n");
