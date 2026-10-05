import {db,json} from './store-server';
export const CATALOG_TARGET=4000000;
export async function ensureMetrics(){
 const d=db();if(await d.prepare("SELECT key FROM settings WHERE key='inventory_metrics_ready'").first())return;
 // Data backfill is separate from schema migration. The batch serializes initialization with writers.
 await d.batch([d.prepare("INSERT INTO inventory_metrics(expiry,count,low,out,value) SELECT expiry,COUNT(*),SUM(stock<=minimum),SUM(stock=0),SUM(cost*stock) FROM medicines WHERE deleted=0 AND NOT EXISTS(SELECT 1 FROM settings WHERE key='inventory_metrics_ready') GROUP BY expiry ON CONFLICT(expiry) DO UPDATE SET count=excluded.count,low=excluded.low,out=excluded.out,value=excluded.value"),d.prepare("INSERT INTO settings(key,value) VALUES ('inventory_metrics_ready','1') ON CONFLICT DO NOTHING")]);
}
export async function inventorySummary(){
 const end=new Date(Date.now()+90*86400000).toISOString().slice(0,10);
 const row=await db().prepare("SELECT COALESCE(SUM(count),0) AS count,COALESCE(SUM(low),0) AS low,COALESCE(SUM(out),0) AS out,COALESCE(SUM(value),0) AS value,COALESCE(SUM(CASE WHEN expiry!='' AND expiry<=? THEN count ELSE 0 END),0) AS expiry FROM inventory_metrics").bind(end).first();
 return {...row,target:CATALOG_TARGET};
}
export async function catalog(req:Request){
 const p=new URL(req.url).searchParams;
 if(p.has('barcode')||(p.get('field')==='barcode'&&p.get('q'))){const m=await db().prepare('SELECT * FROM medicines WHERE barcode=? AND deleted=0').bind((p.get('barcode')||p.get('q')||'').trim().slice(0,200)).first();return json({medicines:m?[m]:[],next:null});}
 const q=(p.get('q')||'').trim().toLowerCase().replace(/\s+/g,' ').slice(0,200),field=p.get('field')==='formula'?'lower(formula)':'identity';
 const filter=p.get('filter')||'All medicines',expiry=filter==='Near expiry';
 const clauses=['deleted=0'],args:any[]=[];
 if(q){clauses.push(`${field}>=? AND ${field}<?`);args.push(q,q+'\uffff');}
 if(filter==='Needs details')clauses.push('needsReview=1');
 if(filter==='Low stock')clauses.push('stock<=minimum');
 if(filter==='Out of stock')clauses.push('stock=0');
 if(expiry){clauses.push("expiry!='' AND expiry<=?");args.push(new Date(Date.now()+90*86400000).toISOString().slice(0,10));}
 const sort=expiry?'expiry':q&&field!=='identity'?field:'identity';
 let cursor:any=null;
 try{if(p.get('after'))cursor=JSON.parse(p.get('after')!);}catch{return json({error:'Invalid page cursor.'},400);}
 if(cursor){if(!Array.isArray(cursor)||cursor.length!==2||cursor.some(x=>typeof x!=='string'||x.length>1000))return json({error:'Invalid page cursor.'},400);if(sort==='identity'){clauses.push('identity>?');args.push(cursor[1]);}else{clauses.push(`(${sort},identity)>(?,?)`);args.push(...cursor);}}
 const requested=Number(p.get('limit')||50);const limit=p.get('export')==='1'?1000:(Number.isInteger(requested)?Math.max(1,Math.min(50,requested)):50);
 const rows=(await db().prepare(`SELECT * FROM medicines WHERE ${clauses.join(' AND ')} ORDER BY ${sort}${sort==='identity'?'':',identity'} LIMIT ?`).bind(...args,limit+1).all()).results as any[];
 const more=rows.length>limit;const medicines=rows.slice(0,limit),last=medicines.at(-1);
 return json({medicines,next:more?JSON.stringify([sort==='expiry'?last.expiry:sort==='identity'?last.identity:last.formula.toLowerCase(),last.identity]):null});
}

export async function inventoryAlerts(){const d=db();const [low,expiry]=await d.batch([d.prepare('SELECT * FROM medicines WHERE deleted=0 AND stock<=minimum ORDER BY identity LIMIT 5'),d.prepare("SELECT * FROM medicines WHERE deleted=0 AND expiry!='' AND expiry<=? ORDER BY expiry,identity LIMIT 5").bind(new Date(Date.now()+90*86400000).toISOString().slice(0,10))]);return [...low.results,...expiry.results];}
