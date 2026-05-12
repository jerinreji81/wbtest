/* WorshipBase AUDIT-FIX1 admin owner.
   Keeps hidden admin unlock separate from normal Settings/About rendering. */
(function(root){
'use strict';
function handleAboutBrandTap(options){
  options=options||{};
  if(options.isUnlocked){
    if(typeof options.lock==='function')options.lock();
    return 'locked';
  }
  if(typeof options.openUnlock==='function')options.openUnlock();
  return 'unlock-requested';
}
root.WBAdminController={handleAboutBrandTap:handleAboutBrandTap};
})(window);
