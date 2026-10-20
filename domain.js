export const PH = [5.5,6,6.5,7,7.5,8,8.5,9];
                                 
                                                                                                                                                                        
                                                         
                                         
                                                                                                                                                                                                                               
export const defaults          = {morning:[5,12],night:[17,24],times:['08:00','20:00'],regions:[{x:.44,y:.22,w:.12,h:.10},{x:.44,y:.39,w:.12,h:.10}],reference:{},version:'',maxDistance:18,minMargin:4,validated:false};
export function jstInput(date = new Date())        {return new Date(date.getTime()+9*3600000).toISOString().slice(0,16);}
export function fromJst(value       )        {const d=new Date(value+':00+09:00');if(!Number.isFinite(d.getTime()))throw Error('日時を確認してください');return d.toISOString();}
export function classify(iso       ,s         )      {const hour = new Date(new Date(iso).getTime()+9*3600000).getUTCHours();return hour>=s.morning[0]&&hour<s.morning[1]?'朝':hour>=s.night[0]&&hour<s.night[1]?'夜':'その他';}
export function validateRecord(r            ) {if(!PH.includes(r.ph)||!['朝','夜','その他'].includes(r.slot)||!['manual','photo'].includes(r.source)||!r.id||!Number.isFinite(Date.parse(r.measuredAt)))throw Error('値と日時を確認してください');}
export function inPeriod(records              ,days       ,now=Date.now()){return records.filter(r=>Date.parse(r.measuredAt)>=now-days*86400000&&Date.parse(r.measuredAt)<=now).sort((a,b)=>Date.parse(a.measuredAt)-Date.parse(b.measuredAt));}
export function plotPoints(records              ,days       ,now=Date.now()){return inPeriod(records,days,now).map(r=>({record:r,x:48+(Date.parse(r.measuredAt)-(now-days*86400000))/(days*86400000)*604,y:220-(r.ph-5.5)/3.5*180}));}
export function validateSettings(s         ){for(const [a,b] of [s.morning,s.night])if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b>24||a>=b)throw Error('時間帯は0〜24時の範囲で開始を終了より前にしてください');if(Math.max(s.morning[0],s.night[0])<Math.min(s.morning[1],s.night[1]))throw Error('朝と夜の時間帯を重ねないでください');if(!(s.maxDistance>0&&s.maxDistance<=50&&s.minMargin>0&&s.minMargin<=30))throw Error('判定の調整数値を確認してください');for(const r of s.regions)if(r.x<0||r.y<0||r.w<=0||r.h<=0||r.x+r.w>1||r.y+r.h>1)throw Error('読み取り領域を画像内に収めてください');}
