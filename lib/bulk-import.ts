// A bounded-memory CSV reader. Quoted cells may span chunks and lines.
export async function* csvRecords(file:Blob){
 const reader=file.stream().getReader(),decoder=new TextDecoder();let row:string[]=[],cell='',quoted=false,afterQuote=false,skipLF=false,size=0;
 try{while(true){const {value,done}=await reader.read();const text=decoder.decode(value,{stream:!done});for(const c of text){if(skipLF){skipLF=false;if(c==='\n')continue;}size++;if(size>65536)throw new Error('A CSV row exceeds 64 KB. Check column separators and quotation marks.');
 if(quoted){if(c==='"'){quoted=false;afterQuote=true;}else cell+=c;continue;}
 if(afterQuote&&c==='"'){cell+='"';quoted=true;afterQuote=false;continue;}
 if(c===','){row.push(cell);cell='';afterQuote=false;continue;}
 if(c==='\n'||c==='\r'){row.push(cell);if(row.some(v=>v.trim()))yield row;row=[];cell='';afterQuote=false;size=0;skipLF=c==='\r';continue;}
 if(afterQuote){if(c===' '||c==='\t')continue;throw new Error('Unexpected text after a quoted CSV cell.');}
 if(c==='"'){if(cell.trim())throw new Error('Unexpected quote in CSV.');cell='';quoted=true;}else cell+=c;
 }if(done)break;}
 if(quoted)throw new Error('Unclosed quote in CSV.');row.push(cell);if(row.some(v=>v.trim()))yield row;
 }finally{await reader.cancel();reader.releaseLock();}
}
export async function* medicineRows(file:Blob){
 let headers:string[]|undefined,line=1;
 for await(const cells of csvRecords(file)){if(!headers){headers=cells.map(v=>v.trim().toLowerCase().replace(/^\uFEFF/,''));if(!['name','formula','price'].every(k=>headers!.includes(k)))throw new Error('CSV needs name, formula and price columns. Download the template.');if(new Set(headers).size!==headers.length)throw new Error('CSV has repeated column headings.');continue;}
 line++;const r=Object.fromEntries(headers.map((h,i)=>[h,(cells[i]||'').trim()]));
 const m:any={packSize:Number(r.packsize||0),needsReview:r.needsreview==='1'?1:0,importNotes:r.importnotes||'',name:r.name,formula:r.formula,strength:r.strength||'',manufacturer:r.manufacturer||'',category:r.category||'General',barcode:r.barcode||'',unit:r.unit||'Tablet',expiry:r.expiry||'',rack:r.rack||'',price:Math.round(Number(r.price)*100),cost:Math.round(Number(r.cost||0)*100),stock:Number(r.stock||0),minimum:Number(r.minimum===''||r.minimum===undefined?10:r.minimum)};
 const invalid=cells.length!==headers.length||!m.name||(!m.formula&&!m.needsReview)||r.price===''||Object.values(m).some(v=>typeof v==='string'&&v.length>200)||['price','cost','stock','minimum','packSize'].some(k=>!Number.isSafeInteger(m[k])||m[k]<0||m[k]>100000000)||(m.expiry&&(!/^\d{4}-\d{2}-\d{2}$/.test(m.expiry)||!Number.isFinite(Date.parse(m.expiry))));
 yield {line,medicine:m,error:invalid?`Row ${line}: check columns, name, formula, price, quantities and expiry.`:''};
 }
}
// Hash all bytes in fixed chunks, with bounded memory. Different file contents get a different resume ID.
export async function fileFingerprint(file:Blob,epoch=''){let previous=epoch?new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(epoch))):new Uint8Array(32);for(let start=0;start<file.size;start+=1048576){const chunk=new Uint8Array(await file.slice(start,start+1048576).arrayBuffer()),input=new Uint8Array(previous.length+chunk.length);input.set(previous);input.set(chunk,previous.length);previous=new Uint8Array(await crypto.subtle.digest('SHA-256',input));}return Array.from(previous,b=>b.toString(16).padStart(2,'0')).join('');}
