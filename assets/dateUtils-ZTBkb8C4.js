import{k as u}from"./index-Ds129oru.js";/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=u("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);function d(t){const e=new Date(t),i=new Date-e,n=Math.floor(i/(1e3*60*60*24));if(n<0)return{days:0,text:"即将出生"};if(n===0)return{days:0,text:"今天出生 🎉"};if(n<30)return{days:n,text:`${n} 天`};const r=Math.floor(n/30),a=n%30;if(r<12)return{days:n,text:a>0?`${r} 个月 ${a} 天`:`${r} 个月`};const o=Math.floor(r/12),s=r%12;return{days:n,text:s>0?`${o} 岁 ${s} 个月`:`${o} 岁`}}function $(t){const e=new Date(t);return`${e.getFullYear()}/${e.getMonth()+1}/${e.getDate()}`}function h(t){return t.substring(0,5)}function l(){const t=new Date;return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}function S(){const t=new Date;return`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}export{g as P,h as a,$ as f,d as g,S as n,l as t};
