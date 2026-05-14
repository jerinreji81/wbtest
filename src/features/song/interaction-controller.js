/* WorshipBase RC3 song interaction controller.
   Owns post-refactor interaction tuning contracts for song swipes, notes affordances and lyrics-only readability. */
(function(root){
'use strict';

function songTransitionTiming(){return {
  // RC3: lighter, more native-feeling adjacent-song swipe.
  outgoing:'transform .25s cubic-bezier(.20,.82,.22,1), opacity .18s ease',
  incoming:'transform .25s cubic-bezier(.20,.82,.22,1), opacity .12s linear',
  cleanupMs:285,
  swipeThreshold:54,
  maxDrag:196,
  dragFactor:.82,
  releaseFactor:.70,
  verticalCancelRatio:1.32,
  lockDistance:9,
  backThreshold:58
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
function reorderTouchTarget(){return {minWidth:48,minHeight:48};}
root.WBSongInteractionController={
  songTransitionTiming:songTransitionTiming,
  noteButtonHtml:noteButtonHtml,
  setButtonHasContent:setButtonHasContent,
  readableLyricsClass:readableLyricsClass,
  reorderTouchTarget:reorderTouchTarget
};
})(window);
