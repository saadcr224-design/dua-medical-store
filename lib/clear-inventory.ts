import {db,json} from './store-server';
export async function catalogState(){const d=db();const r=await d.prepare("SELECT key,value FROM settings WHERE key IN ('catalog_epoch','inventory_clear')").all();const values=Object.fromEntries((r.results as any[]).map(r=>[r.key,r.value]));return {catalogEpoch:values.catalog_epoch||'',clearJob:values.inventory_clear||''};}
export async function clearInventory(b:any){
 if(b.confirm!=='REMOVE ALL'||typeof b.opId!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(b.opId))return json({error:'Type REMOVE ALL to confirm.'},400);
 const d=db(),receipt='clear:'+b.opId;
 if(await d.prepare('SELECT id FROM operations WHERE id=?').bind(receipt).first())return json({done:true,remaining:0});
 await d.batch([d.prepare("INSERT INTO settings(key,value) VALUES ('inventory_clear',?) ON CONFLICT(key) DO NOTHING").bind(b.opId),d.prepare("INSERT INTO settings(key,value) SELECT 'catalog_epoch',? WHERE EXISTS(SELECT 1 FROM settings WHERE key='inventory_clear' AND value=?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(b.opId,b.opId)]);
 const state=await catalogState();if(state.clearJob!==b.opId)return json({error:'Another removal is running. Refresh to resume it.'},409);
 await d.batch([d.prepare("DELETE FROM medicines WHERE id IN (SELECT id FROM medicines ORDER BY id LIMIT 1000) AND EXISTS(SELECT 1 FROM settings WHERE key='inventory_clear' AND value=?)").bind(b.opId),d.prepare("INSERT INTO operations(id,created) SELECT ?,? WHERE NOT EXISTS(SELECT 1 FROM medicines) ON CONFLICT DO NOTHING").bind(receipt,Date.now()),d.prepare("DELETE FROM settings WHERE key='inventory_clear' AND value=? AND EXISTS(SELECT 1 FROM operations WHERE id=?)").bind(b.opId,receipt)]);
 const totals:any=await d.prepare('SELECT COALESCE(SUM(count),0) AS count FROM inventory_metrics').first();const more=await d.prepare('SELECT id FROM medicines LIMIT 1').first();return json({done:!more,remaining:totals.count});
}
