/* WorshipBase Phase 2b - H2 Settings/Admin DOM boundary owner.
   Owns Settings and Admin event-routing decisions while the legacy shell remains the temporary host.
   This file must stay non-visual and non-destructive: it routes to injected adapters supplied by the shell. */
(function(root){
'use strict';
function own(obj){return obj&&typeof obj==='object'?obj:{}}
function closest(target,selector){return target&&target.closest?target.closest(selector):null}
function call(fn){if(typeof fn==='function')return fn.apply(null,Array.prototype.slice.call(arguments,1))}
function handleSettingsListClick(event,state,adapters){
  state=own(state);adapters=own(adapters);
  var target=event&&event.target;if(!target)return false;
  if(closest(target,'#about-brand-mark')){
    if(root.WBAdminController&&root.WBAdminController.handleAboutBrandTap){
      root.WBAdminController.handleAboutBrandTap({isUnlocked:!!state.adminUnlocked,lock:adapters.lockAdminMode,openUnlock:adapters.openAdminPinSheet});
    }else if(state.adminUnlocked){call(adapters.lockAdminMode)}else{call(adapters.openAdminPinSheet)}
    return true;
  }
  var toggle=closest(target,'[data-toggle-setting]');
  if(toggle){call(adapters.updateSetting,toggle.dataset.toggleSetting,!state.settings[toggle.dataset.toggleSetting]);return true}
  var swatch=closest(target,'[data-theme-value]');
  if(swatch){call(adapters.updateSetting,'theme',swatch.dataset.themeValue);return true}
  var choice=closest(target,'[data-choice-key]');
  if(choice){call(adapters.openSettingsPicker,choice.dataset.choiceKey);return true}
  var admin=closest(target,'[data-admin-action]');
  if(admin){call(adapters.handleAdminAction,admin.dataset.adminAction);return true}
  var action=closest(target,'[data-settings-action]');
  if(!action)return false;
  var kind=action.dataset.settingsAction;
  if(kind==='backup'){call(adapters.openBackupCentre);return true}
  if(kind==='reset-local'){
    var confirm=adapters.appConfirm;
    if(typeof confirm==='function'){
      confirm('Reset local rebuild songs, set lists and recents?',{title:'Reset local data',detail:'Local songs, set lists, recents, notes/cues and Workspace preview data will be cleared. You can undo immediately after reset.',confirmText:'Reset',danger:true}).then(function(ok){
        if(!ok)return;
        var snap=call(adapters.dataSafetySnapshot,'reset local data');
        call(adapters.resetLocalData);
        call(adapters.offerDataUndo,'Local data reset',snap);
      });
    }
    return true;
  }
  if(kind==='drive-auth'){
    if(state.cloudState&&state.cloudState.googleDrive&&state.cloudState.googleDrive.connected)call(adapters.openBackupCentre);else call(adapters.connectGoogleDriveInteractive);
    return true;
  }
  if(kind==='firebase-auth'){call(adapters.handleFirebaseSettingsAction);return true}
  return false;
}
function handleSettingsListInput(event,state,adapters){
  state=own(state);adapters=own(adapters);
  var target=event&&event.target;if(!target||!target.matches||!target.matches('[data-text-size-slider]'))return false;
  if(state.settings)state.settings.textSize=target.value;
  target.style.setProperty('--pct',Math.round(((parseFloat(target.value)-.85)/.40)*100)+'%');
  call(adapters.persistSettings);call(adapters.applySettings);
  return true;
}
function bindSettingsPickerSheets(document,adapters){
  adapters=own(adapters);document=document||root.document;if(!document)return false;
  Array.prototype.slice.call(document.querySelectorAll('.settings-picker-close')).forEach(function(btn){
    if(btn.dataset.phase2bSettingsClose==='1')return;btn.dataset.phase2bSettingsClose='1';btn.addEventListener('click',function(){call(adapters.closeSettingsPicker)});
  });
  Array.prototype.slice.call(document.querySelectorAll('.settings-picker-sheet')).forEach(function(sheet){
    if(sheet.dataset.phase2bSettingsSheet==='1')return;sheet.dataset.phase2bSettingsSheet='1';sheet.addEventListener('click',function(e){if(e.target===sheet)call(adapters.closeSettingsPicker)});
  });
  Array.prototype.slice.call(document.querySelectorAll('.settings-picker-options')).forEach(function(container){
    if(container.dataset.phase2bSettingsOptions==='1')return;container.dataset.phase2bSettingsOptions='1';container.addEventListener('click',function(e){
      var opt=closest(e.target,'[data-picker-key]');if(!opt)return;
      call(adapters.updateSetting,opt.dataset.pickerKey,opt.dataset.pickerValue);call(adapters.closeSettingsPicker);
    });
  });
  return true;
}
function settingsDomContract(){
  return {phase:'Phase 2b - H2',owner:'WBSettingsAdminDomController',contracts:['handleSettingsListClick','handleSettingsListInput','bindSettingsPickerSheets'],legacyShellHost:true,nonDestructive:true};
}
root.WBSettingsAdminDomController={
  handleSettingsListClick:handleSettingsListClick,
  handleSettingsListInput:handleSettingsListInput,
  bindSettingsPickerSheets:bindSettingsPickerSheets,
  settingsDomContract:settingsDomContract,
  diagnostics:settingsDomContract
};
})(window);
