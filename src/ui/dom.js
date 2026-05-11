/* WorshipBase Phase D DOM helper owner.
   Query, form, focus, escaping, and small display helpers extracted from the v8.17 legacy shell. */
(function(root){
'use strict';

function qs(id){return document.getElementById(id)}
function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function qv(id,fallback){var el=qs(id);return el&&typeof el.value!=='undefined'?el.value:(fallback||'')}
function focusIfPresent(id){var el=qs(id);if(!el||typeof el.focus!=='function')return;try{el.focus({preventScroll:true})}catch(e){try{el.focus()}catch(_e){}}}
function textContentOf(node,selector){try{var found=node&&node.querySelector?node.querySelector(selector):null;return found&&typeof found.textContent==='string'?found.textContent:''}catch(e){return ''}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function firstLetter(s){var c=String(s.title||'#').trim().charAt(0).toUpperCase();return /^[A-Z0-9]$/.test(c)?c:'#'}

root.WBDom={
  qs:qs,
  qsa:qsa,
  qv:qv,
  focusIfPresent:focusIfPresent,
  textContentOf:textContentOf,
  esc:esc,
  firstLetter:firstLetter
};
})(window);
