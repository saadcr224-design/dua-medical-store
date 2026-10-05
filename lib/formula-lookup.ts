export async function lookupFormula(name:string,fetcher:typeof fetch=fetch){
 const get=async(path:string)=>{const r=await fetcher('https://rxnav.nlm.nih.gov/REST/'+path,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});if(!r.ok)throw new Error('Medicine lookup is temporarily unavailable.');return r.json() as Promise<any>};
 const ids=(await get('rxcui.json?search=0&allsrc=0&name='+encodeURIComponent(name))).idGroup?.rxnormId||[];
 if(ids.length!==1||!/^\d+$/.test(ids[0]))return {formula:'',message:'No unique exact match. Enter the full product name or copy the formula from its package.'};
 const id=ids[0],p=(await get(`rxcui/${id}/properties.json`)).properties;
 if(!p||!['IN','PIN','MIN','SCD','SBD','BN'].includes(p.tty))return {formula:'',message:'Enter the full medicine name and strength to identify its ingredients.'};
 let formula='';
 if(['IN','PIN','MIN'].includes(p.tty))formula=p.name;
 else {const groups=(await get(`rxcui/${id}/related.json?tty=IN`)).relatedGroup?.conceptGroup||[];const ingredients=[...new Set<string>(groups.filter((g:any)=>g.tty==='IN').flatMap((g:any)=>(g.conceptProperties||[]).map((x:any)=>x.name)).filter(Boolean))];
 if(p.tty==='BN'&&ingredients.length!==1)return {formula:'',message:'This brand has multiple ingredients or variants. Enter the full product name and verify the package.'};
 formula=ingredients.sort().join(' + ');}
 if(!formula||formula.length>200)return {formula:'',message:'No usable ingredient match. Enter the package formula.'};
 return {formula,matchedName:p.name,source:`https://rxnav.nlm.nih.gov/REST/rxcui/${id}/properties.json`,message:'Filled from NLM RxNorm. Check your package: brands and formulations can vary by country.'};
}
