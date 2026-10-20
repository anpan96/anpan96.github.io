import {validateRecord,                } from './domain.js';
let pending                               ;
export function openDB(){return pending??=new Promise             ((resolve,reject)=>{const q=indexedDB.open('ph-kiroku',1);q.onupgradeneeded=()=>{const db=q.result;db.createObjectStore('records',{keyPath:'id'});db.createObjectStore('settings');db.createObjectStore('validation',{keyPath:'id'});};q.onsuccess=()=>resolve(q.result);q.onerror=()=>{pending=undefined;reject(q.error);};q.onblocked=()=>reject(Error('ほかの画面を閉じて再試行してください'));});}
export async function operation   (store       ,mode                   ,action                               )           {const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const q=action(tx.objectStore(store));tx.oncomplete=()=>resolve(q.result     );tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('保存できませんでした'));});}
export const records=()=>operation               ('records','readonly',s=>s.getAll());
export async function saveRecord(r            ){validateRecord(r);await operation('records','readwrite',s=>s.put(r));}
export const removeRecord=(id       )=>operation('records','readwrite',s=>s.delete(id));
export const getSetting=   (key       )=>operation             ('settings','readonly',s=>s.get(key));
export const setSetting=(key       ,value        )=>operation('settings','readwrite',s=>s.put(value,key));
