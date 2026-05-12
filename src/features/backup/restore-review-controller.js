(function(){
'use strict';
var root=window;
function asNumber(value){var n=Number(value||0);return isFinite(n)&&n>0?Math.round(n):0;}
function yesNo(value){return value?'Yes':'No';}
function counts(plan){plan=plan||{};return {
  songs:asNumber(plan.songCount),
  sets:asNumber(plan.setCount),
  settings:asNumber(plan.settingsCount),
  recents:asNumber(plan.recentCount),
  duplicates:asNumber(plan.dupeCount)
};}
function hasSelection(selection){selection=selection||{};return !!(selection.songs||selection.sets||selection.settings||selection.recents);}
function selectedSummary(selection){selection=selection||{};var out=[];if(selection.songs)out.push('Songs');if(selection.sets)out.push('Set lists');if(selection.settings)out.push('Settings');if(selection.recents)out.push('Recents');return out.join(', ')||'Nothing selected';}
function fileLabel(state){state=state||{};var plan=state.plan||{};return state.fileName||plan.fileName||plan.title||'Backup file';}
function sourceLabel(state){if(!state)return 'Local file';if(state.source==='drive')return 'Google Drive';return state.source||'Local file';}
function restoreAvailability(plan){var c=counts(plan);return {
  songs:c.songs>0,
  sets:c.sets>0,
  settings:c.settings>0,
  recents:c.recents>0
};}
root.WBRestoreReviewController={counts:counts,yesNo:yesNo,hasSelection:hasSelection,selectedSummary:selectedSummary,fileLabel:fileLabel,sourceLabel:sourceLabel,availability:restoreAvailability};
})();
