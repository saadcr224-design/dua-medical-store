import {authorized,json} from '@/lib/store-server';
import {lookupFormula} from '@/lib/formula-lookup';
export async function GET(req:Request){try{if(!await authorized(req))return json({error:'Please sign in.'},401);const name=new URL(req.url).searchParams.get('name')?.trim()||'';if(name.length<3||name.length>200)return json({error:'Enter a medicine name (3–200 characters).'},400);return json(await lookupFormula(name));}catch{return json({error:'Internet lookup unavailable. You can enter the formula yourself or save and edit later.'},503)}}
