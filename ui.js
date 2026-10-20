export const $=(root,selector)=>root.querySelector(selector);
export const format=n=>new Intl.NumberFormat('zh-Hant').format(n);
export const difficultyOptions='<option value="9">入門 · 0–9</option><option value="99" selected>初階 · 0–99</option><option value="999">進階 · 0–999</option>';
export const hero=(tag,title,description)=>`<section class="page-intro"><div><p class="eyebrow">${tag}</p><h1>${title}</h1><p class="intro-description">${description}</p></div><div class="intro-seal" aria-hidden="true">珠<br>算</div></section>`;
export function keypad(host,onInput) {
  host.innerHTML=`<div class="number-pad" aria-label="數字鍵盤">${['1','2','3','4','5','6','7','8','9','清除','0','⌫'].map(key=>`<button type="button" data-key="${key}" aria-label="${key==='⌫'?'刪除一位':key}">${key}</button>`).join('')}</div>`;
  host.addEventListener('click',event=>{const button=event.target.closest('[data-key]');if(button)onInput(button.dataset.key);});
}
export function orientationRequest() {
  // Safari may decline: the CSS portrait gate remains the reliable fallback.
  try {const result=screen.orientation?.lock?.('portrait');result?.catch(()=>{});}catch{}
}
export function unlockOrientation() {try{screen.orientation?.unlock?.();}catch{}}
export function saveBest(key,score) {
  try {const best=Math.max(Number(localStorage.getItem(key))||0,score);localStorage.setItem(key,String(best));return best;}catch{return score;}
}
export function getBest(key) {try{return Number(localStorage.getItem(key))||0;}catch{return 0;}}
