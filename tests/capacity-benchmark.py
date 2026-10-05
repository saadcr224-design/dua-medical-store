"""Local synthetic SQLite benchmark; not a hosted D1 load/quota test. No real medicines."""
import sqlite3, pathlib, tempfile, time, os, json
path=os.path.join(tempfile.mkdtemp(prefix='dua-capacity-'),'catalog.sqlite')
db=sqlite3.connect(path)
db.execute('PRAGMA journal_mode=WAL')
for migration in sorted(pathlib.Path('drizzle').glob('*.sql')): db.executescript(migration.read_text())
db.execute("INSERT INTO settings VALUES ('inventory_metrics_ready','1')")
start=time.monotonic()
for offset in range(0,4_000_000,100_000):
 db.execute("""WITH RECURSIVE n(i) AS (SELECT ? UNION ALL SELECT i+1 FROM n WHERE i<?)
 INSERT INTO medicines(id,name,formula,strength,manufacturer,category,barcode,identity,unit,price,cost,stock,minimum,expiry,rack)
 SELECT printf('fixture-%07d',i),printf('Scale record %07d',i),printf('Test field %03d',i%1000),'Fixture only','Synthetic QA','Test',printf('B%07d',i),printf('scale record %07d|fixture only|synthetic qa|unit',i),'Unit',10000,5000,10,2,'2030-01-01','QA' FROM n""",(offset,offset+99999))
 db.commit()
 if (offset+100000)%500000==0: print(f'{offset+100000:,} synthetic records inserted',flush=True)
assert db.execute('SELECT count(*) FROM medicines').fetchone()[0]==4_000_000
assert db.execute('SELECT SUM(count) FROM inventory_metrics').fetchone()[0]==4_000_000
queries={
 'deep_page':("SELECT * FROM medicines WHERE deleted=0 AND identity>? ORDER BY identity LIMIT 51",('scale record 3999000|fixture only|synthetic qa|unit',)),
 'name_prefix':("SELECT * FROM medicines WHERE deleted=0 AND identity>=? AND identity<? ORDER BY identity LIMIT 51",('scale record 3999','scale record 3999\uffff')),
 'formula_prefix':("SELECT * FROM medicines WHERE deleted=0 AND lower(formula)>=? AND lower(formula)<? ORDER BY lower(formula),identity LIMIT 51",('test field 999','test field 999\uffff')),
 'barcode':("SELECT * FROM medicines WHERE deleted=0 AND barcode=?",('B3999999',)),
 'summary':("SELECT SUM(count),SUM(low),SUM(out),SUM(value) FROM inventory_metrics",()),
}
results={}
for name,(query,args) in queries.items():
 t=time.perf_counter();rows=db.execute(query,args).fetchall();elapsed=(time.perf_counter()-t)*1000
 plans=[r[3] for r in db.execute('EXPLAIN QUERY PLAN '+query,args)]
 if name!='summary': assert any('INDEX' in p for p in plans),plans
 results[name]={'rows':len(rows),'ms':round(elapsed,2),'plan':plans}
db.execute('PRAGMA wal_checkpoint(TRUNCATE)')
print(json.dumps({'records':4_000_000,'database_bytes':os.path.getsize(path),'elapsed_seconds':round(time.monotonic()-start,2),'queries':results},indent=2),flush=True)
db.close()
os.remove(path)
