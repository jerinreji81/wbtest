/* WorshipBase RC2 song interaction controller.
   Owns post-refactor interaction tuning contracts for song swipes, notes affordances and lyrics-only readability. */
(function(root){
'use strict';

function songTransitionTiming(){return {
  outgoing:'transform .30s cubic-bezier(.22,1,.32,1), opacity .22s ease',
  incoming:'transform .30s cubic-bezier(.22,1,.32,1), opacity .14s linear',
  cleanupMs:330,
  swipeThreshold:68,
  maxDrag:164,
  dragFactor:.66
};}
function noteButtonHtml(id,label,extraClass){
  return '<button aria-label="'+label+'" class="sv-mini-action wb-notes-quick '+(extraClass||'')+'" id="'+id+'" type="button"><svg viewBox="0 0 24 24"><path d="M6 4h12v16H6z"></path><path d="M9 9h6M9 13h6M9 17h3"></path></svg></button>';
}
function setButtonHasContent(btn,has){
  if(!btn||!btn.classList)return;
  btn.classList.toggle('has-notes',!!has);
  btn.setAttribute('aria-pressed',has?'true':'false');
}
function readableLyricsClass(mode){return mode==='lyrics'?'lyrics-readable':'';}
function reorderTouchTarget(){return {minWidth:46,minHeight:46};}
root.WBSongInteractionController={
  songTransitionTiming:songTransitionTiming,
  noteButtonHtml:noteButtonHtml,
  setButtonHasContent:setButtonHasContent,
  readableLyricsClass:readableLyricsClass,
  reorderTouchTarget:reorderTouchTarget
};
})(window);
