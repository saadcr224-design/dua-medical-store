import {detectMedicineDetails,normalizeUnit} from './medicine-details';
import {guessField} from './pdf-import';
import {labelledMedicine,normalizeExpiry} from './ocr-layout';
const fields=['name','formula','strength','manufacturer','category','barcode','unit','price','cost','stock','minimum','expiry','rack','needsReview','importNotes','packSize'];
const split=(line:string)=>line.split(/\t|\s*\|\s*| {2,}/).map(v=>v.trim());
const money=(s:string)=>s.replace(/^(?:PKR|Rs\.?|₨)\s*/i,'').replace(/\s*(?:PKR|Rs\.?)$/i,'').replaceAll(',','').trim();
export function readableMedicineName(value:string){
 const v=value.trim(),words=v.split(/\s+/);
 if(v.length<3||v.length>100||words.length>12||!/^\p{L}/u.test(v))return false;
 if(/[{}=<>£$]|\|/.test(v))return false;
 if((v.match(/[^\p{L}\p{N}\s.,/()+'%–-]/gu)||[]).length>2)return false;
 return !words.some(w=>(w.match(/[a-z][A-Z]/g)||[]).length>1);
}
export function medicineRecordsCSV(records:Record<string,string>[]){const quote=(s:string)=>'"'+s.replaceAll('"','""')+'"';return fields.join(',')+'\n'+records.map(r=>fields.map(k=>quote(r[k]||'')).join(',')).join('\n');}
export function autoMedicineCSV(text:string,defaultUnit='Unit',allowUnlabelled=false){
 const records:Record<string,string>[]=[];let mapping:string[]|null=null,skipped=0;
 const add=(raw:Record<string,string>,ambiguous=false)=>{const name=(raw.name||'').trim();if(!readableMedicineName(name)||!/[a-z\u0080-\uffff]/i.test(name)||/^(?:total|subtotal|grand total|page\b|note[s]?\b|disclaimer\b)/i.test(name)){skipped++;return;}
 const detected=detectMedicineDetails(name);const r:Record<string,string>={...raw,name,strength:raw.strength||detected.strength,formula:raw.formula||'',unit:raw.unit?normalizeUnit(raw.unit):detected.unit!=='Unit'?detected.unit:defaultUnit,minimum:'10',category:raw.category||'General'};const missing:string[]=[];
 if(!r.formula)missing.push('formula');if(r.unit==='Unit')missing.push('selling unit');if(ambiguous)missing.push('column alignment');
 for(const k of ['price','cost','stock']){const value=money(raw[k]||''),n=Number(value);const valid=value!==''&&/^\d+(?:\.\d+)?$/.test(value)&&Number.isFinite(n)&&n>=0&&(k==='stock'?Number.isSafeInteger(n)&&n<=100000000:Math.round(n*100)<=100000000);r[k]=valid?String(n):'0';if(!valid&&(k!=='cost'||!!raw[k]))missing.push(k);}
 const pack=Number(raw.packSize||0);r.packSize=Number.isSafeInteger(pack)&&pack>=0&&pack<=100000000?String(pack):'0';if(raw.packSize&&r.packSize==='0')missing.push('packet size');
 if(r.expiry){const original=r.expiry;r.expiry=normalizeExpiry(original);if(!r.expiry)missing.push('expiry ('+original+')');}
 for(const k of fields){if((r[k]||'').length>200){r[k]=r[k].slice(0,200);missing.push(k+' text');}}
 r.needsReview=missing.length?'1':'0';r.importNotes=missing.length?('Check missing or unclear '+Array.from(new Set(missing)).join(', ')+'. Imported from PDF/photo; zero values are placeholders.').slice(0,200):'';records.push(r);
 };
 const lines=text.split(/\r?\n/).filter(l=>l.trim());let foundTable=false;
 for(const line of lines){const cells=split(line),guessed=cells.map(guessField),active=guessed.filter(f=>f!=='ignore');const header=guessed.includes('name')&&(active.length>=2||cells.length===1);
 if(header){if(new Set(active).size!==active.length){mapping=null;continue;}mapping=guessed;foundTable=true;continue;}
 if(!mapping)continue;
 if(/^\s*(?:page\s+\d|\d+\s*\/\s*\d+|[-_=]{3,})/i.test(line))continue;
 const nameIndex=mapping.indexOf('name');if(!cells[nameIndex]){skipped++;continue;}
 if(cells.length!==mapping.length){if(cells.length===1&&mapping.length>1){skipped++;continue;}add({name:cells[nameIndex]},true);continue;}
 const raw:Record<string,string>={};mapping.forEach((key,i)=>{if(key!=='ignore')raw[key]=cells[i]||''});add(raw);
 }
 if(!foundTable){const blocks=text.split(/(?=^\s*(?:medicine(?: name)?|product(?: name)?|name)\s*[:=])/im);for(const block of blocks){const raw=labelledMedicine(block);if(raw.name)add(raw);}}
 // Unlabelled text is imported only as unverified drafts, never as confirmed product data.
 if(!records.length&&allowUnlabelled){
  const candidates:{name:string,index:number}[]=[];
  for(const [index,line] of lines.entries()){let cells=split(line).filter(Boolean);if(/^\d+[.)]?$/.test(cells[0]||''))cells.shift();const candidate=(cells[0]||'').replace(/^\s*\d+[.)-]?\s+/, '').trim();
   if(!readableMedicineName(candidate)||!/[a-z\u0080-\uffff]/i.test(candidate)||/^(?:formula|generic|active ingredient|unit|selling unit|barcode|strength|manufacturer|selling price|sale price|retail price|available stock|price|mrp|stock|quantity|qty|expiry|exp|batch|mfg|ingredients?|composition|directions?|warning|storage|keep |store |made |manufactured|address|phone|www\.|https?:|page |total|subtotal|invoice|date|supplier|medicine list|product list)\b/i.test(candidate)||/^\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg|iu)\b/i.test(candidate)){skipped++;continue;}
   candidates.push({name:candidate,index});
  }
  for(const [i,candidate] of candidates.entries()){const block=lines.slice(candidate.index,candidates[i+1]?.index??lines.length).join('\n');const before=records.length;add({...labelledMedicine(block),name:candidate.name},true);if(records.length>before){const last=records[records.length-1];last.needsReview='1';last.importNotes='Photo/PDF draft. Check the name and missing details before billing.';}}
 }
 return {csv:medicineRecordsCSV(records),records,count:records.length,needsReview:records.filter(r=>r.needsReview==='1').length,skipped};
}
