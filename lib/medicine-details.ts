export const sellingUnits=['Tablet','Capsule','Packet','Strip','Box','Bottle','Tube','Sachet','Vial','Ampoule','Unit'];
// These are packaging hints from explicit text, not a medicine knowledge database.
export function detectMedicineDetails(text:string){
 const patterns:[RegExp,string,string][]=[[/\b(?:syrup|syp\.?|suspension|oral solution)\b/i,'Syrup / liquid','Bottle'],[/\b(?:eye drops?|ear drops?|drops?)\b/i,'Drops','Bottle'],[/\b(?:tablets?|tabs?\.?)\b/i,'Tablet','Tablet'],[/\b(?:capsules?|caps?\.?)\b/i,'Capsule','Capsule'],[/\b(?:cream|ointment|gel)\b/i,'Cream / ointment / gel','Tube'],[/\b(?:sachets?)\b/i,'Sachet','Sachet'],[/\b(?:ampoules?|ampules?)\b/i,'Ampoule','Ampoule'],[/\b(?:vials?)\b/i,'Vial','Vial'],[/\b(?:bottles?)\b/i,'Bottle','Bottle'],[/\b(?:packets?|packs?)\b/i,'Packet','Packet']];
 const found=patterns.find(([pattern])=>pattern.test(text));
 const strength=text.match(/\b\d+(?:\.\d+)?\s*(?:mcg|mg|g|iu)(?:\s*\/\s*\d*(?:\.\d+)?\s*(?:ml|g))?\b/i)?.[0]||'';
 return {form:found?.[1]||'',unit:found?.[2]||'Unit',strength};
}
export function normalizeUnit(value:string){return sellingUnits.find(u=>u.toLowerCase()===value.trim().toLowerCase())||detectMedicineDetails(value).unit;}
export function adjustedStock(stock:number,amount:number){const next=stock+amount;if(!Number.isSafeInteger(next)||next<0||next>100000000)throw new Error('Stock must stay between 0 and 100,000,000 units.');return next;}
