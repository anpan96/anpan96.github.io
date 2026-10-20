import {PH,validateRecord,validateSettings,                              } from './domain.js';
import {openDB} from './db.js';

                                                                                                                       
const object=(v        )                        =>!!v&&typeof v==='object'&&!Array.isArray(v);
const date=(v        )=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v));
const text=(v        ,max=100)            =>typeof v==='string'&&v.length<=max;

export function parseBackup(input       )       {
  if(input.length>10_000_000)throw Error('ファイルが大きすぎます（上限10MB）');
  let data        ;try{data=JSON.parse(input);}catch{throw Error('バックアップファイルを読み取れません');}
  if(!object(data)||data.format!=='ph-kiroku'||data.schemaVersion!==1||!date(data.exportedAt)||!Array.isArray(data.records)||data.records.length>50000)throw Error('対応するpHきろくのバックアップではありません');
  const ids=new Set        ();
  const entries=data.records.map((v        )            =>{
    if(!object(v)||typeof v.id!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(v.id)||ids.has(v.id)||!date(v.measuredAt)||!date(v.createdAt)||!date(v.updatedAt)||!text(v.calibrationVersion??''))throw Error('記録の形式・日時・IDを確認してください');
    ids.add(v.id);const r            ={id:v.id,ph:v.ph,slot:v.slot,source:v.source,measuredAt:v.measuredAt,createdAt:v.createdAt,updatedAt:v.updatedAt};
    if(v.calibrationVersion!==undefined)r.calibrationVersion=v.calibrationVersion;validateRecord(r);return r;
  });
  let settings              =null;
  if(data.settings!==null){const s=data.settings;
    if(!object(s)||!text(s.version)||typeof s.validated!=='boolean'||!Array.isArray(s.morning)||s.morning.length!==2||!Array.isArray(s.night)||s.night.length!==2||!Array.isArray(s.times)||s.times.length!==2||!s.times.every((v        )=>typeof v==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v))||!Array.isArray(s.regions)||s.regions.length!==2||!object(s.reference))throw Error('色見本・設定の形式が正しくありません');
    const regions=s.regions.map((r        )=>{if(!object(r)||![r.x,r.y,r.w,r.h].every(n=>typeof n==='number'&&Number.isFinite(n)))throw Error('読み取り位置が不正です');return {x:r.x,y:r.y,w:r.w,h:r.h};})                       ;
    const reference                      ={};for(const [key,pair] of Object.entries(s.reference)){if(!PH.some(p=>String(p)===key)||!Array.isArray(pair)||pair.length!==2||!pair.every(rgb=>Array.isArray(rgb)&&rgb.length===3&&rgb.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=255)))throw Error('色見本が不正です');reference[key]=pair                                 ;}
    settings={morning:[...s.morning]                   ,night:[...s.night]                   ,times:[...s.times]                   ,regions,reference,version:s.version,maxDistance:s.maxDistance,minMargin:s.minMargin,validated:false};
    if(![settings.maxDistance,settings.minMargin].every(v=>typeof v==='number'&&Number.isFinite(v)))throw Error('調整値が不正です');validateSettings(settings);
  }
  return {format:'ph-kiroku',schemaVersion:1,exportedAt:data.exportedAt,records:entries,settings};
}

export function importSummary(existing              ,incoming              ){const byId=new Map(existing.map(r=>[r.id,r]));let added=0,duplicates=0,conflicts=0;for(const r of incoming){const old=byId.get(r.id);if(!old){added++;continue;}duplicates++;if(['measuredAt','ph','slot','source','createdAt','updatedAt','calibrationVersion'].some(k=>old[k                     ]!==r[k                     ]))conflicts++;}return {added,duplicates,conflicts};}

export async function exportBackup()                {const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(['records','settings'],'readonly');const r=tx.objectStore('records').getAll(),s=tx.objectStore('settings').get('main');tx.oncomplete=()=>{try{const data       ={format:'ph-kiroku',schemaVersion:1,exportedAt:new Date().toISOString(),records:r.result,settings:s.result??null};const serialized=JSON.stringify(data,null,2);parseBackup(serialized);resolve(serialized);}catch(e){reject(e);}};tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('書き出せませんでした'));});}

export async function importBackup(backup       ,restoreSettings=false){const valid=parseBackup(JSON.stringify(backup));const db=await openDB();return new Promise                                  ((resolve,reject)=>{const tx=db.transaction(['records','settings'],'readwrite');const store=tx.objectStore('records'),q=store.getAll();let summary                                 ;q.onsuccess=()=>{summary=importSummary(q.result,valid.records);const ids=new Set(q.result.map((r            )=>r.id));for(const r of valid.records)if(!ids.has(r.id))store.add(r);if(restoreSettings&&valid.settings)tx.objectStore('settings').put(valid.settings,'main');};tx.oncomplete=()=>resolve(summary );tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('取り込みを保存できませんでした'));});}
