export type Discount={type:'percent'|'fixed';value:number;amount?:number};
export function billTotals(subtotal:number,discounts:Discount[]=[]){
 if(!Number.isSafeInteger(subtotal)||subtotal<0)throw new Error('Invalid bill subtotal.');
 if(!Array.isArray(discounts)||discounts.length>2)throw new Error('A bill supports up to two discounts.');
 let total=subtotal;const applied=discounts.map(d=>{if(!d||!['percent','fixed'].includes(d.type)||!Number.isFinite(d.value)||d.value<0)throw new Error('Enter a valid discount.');if(d.type==='percent'&&d.value>100)throw new Error('Percentage discounts cannot exceed 100%.');const amount=d.type==='percent'?Math.round(total*Math.round(d.value*100)/10000):Math.round(d.value*100);if(!Number.isSafeInteger(amount)||amount>total)throw new Error('Discount cannot exceed the remaining bill amount.');total-=amount;return {...d,amount}});
 return {subtotal,total,discount:subtotal-total,discounts:applied};
}
export const money=(n:number)=>'Rs '+(n/100).toLocaleString('en-PK',{maximumFractionDigits:2});
export function decodeBill(x:any){return {...x,items:typeof x.items==='string'?JSON.parse(x.items):x.items,discounts:typeof x.discounts==='string'?JSON.parse(x.discounts):x.discounts||[],subtotal:x.subtotal||x.total+(x.discount||0),billType:x.bill_type||x.billType||'normal'};}
