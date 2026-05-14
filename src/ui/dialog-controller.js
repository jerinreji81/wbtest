/* WorshipBase AUDIT-FIX1 dialog owner.
   Provides app-native centre dialogs for alerts, confirmations, and short text input.
   This intentionally complements bottom sheets: short warnings/forms use a layered box;
   long pickers still use bottom sheets. */
(function(root){
'use strict';

function esc(value){
  return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}

function ensureHost(){
  var host=document.getElementById('wb-dialog-root');
  if(host)return host;
  host=document.createElement('div');
  host.id='wb-dialog-root';
  host.setAttribute('aria-live','polite');
  document.body.appendChild(host);
  return host;
}

var active=null;
function closeActive(result){
  if(!active)return;
  var current=active;
  active=null;
  if(current.node&&current.node.parentNode)current.node.parentNode.removeChild(current.node);
  try{var host=document.getElementById('wb-dialog-root');if(host&&!host.querySelector('.wb-dialog-backdrop'))host.classList.remove('active');}catch(e){}
  try{document.removeEventListener('keydown',current.keyHandler,true)}catch(e){}
  if(typeof current.resolve==='function')current.resolve(result);
}

function focusFirst(node){
  setTimeout(function(){
    var el=node.querySelector('textarea,input,.wb-dialog-primary,.wb-dialog-secondary,button');
    if(el&&el.focus)try{el.focus({preventScroll:true})}catch(e){try{el.focus()}catch(_){} }
  },30);
}

function dialog(options){
  options=options||{};
  if(active)closeActive({ok:false,value:null,reason:'replaced'});
  var host=ensureHost();
  var type=options.type||'alert';
  var title=options.title||'';
  var message=options.message||'';
  var detail=options.detail||'';
  var confirmText=options.confirmText||options.okText||(type==='confirm'?'OK':'Done');
  var cancelText=options.cancelText||'Cancel';
  var danger=!!options.danger;
  var multiline=!!options.multiline;
  var value=options.value==null?'':String(options.value);
  var placeholder=options.placeholder||'';
  var needsInput=type==='prompt';
  var inputHtml=needsInput?(multiline
    ? '<textarea class="wb-dialog-input wb-dialog-textarea" rows="5" placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea>'
    : '<input class="wb-dialog-input" value="'+esc(value)+'" placeholder="'+esc(placeholder)+'" autocomplete="off">') : '';
  var cancelHtml=type==='alert'?'':'<button class="wb-dialog-secondary" data-wb-dialog-cancel type="button">'+esc(cancelText)+'</button>';
  var node=document.createElement('div');
  node.className='wb-dialog-backdrop';
  node.innerHTML='<div class="wb-dialog-box" role="dialog" aria-modal="true">'
    +'<div class="wb-dialog-title">'+esc(title||'WorshipBase')+'</div>'
    +(message?'<div class="wb-dialog-message">'+esc(message)+'</div>':'')
    +(detail?'<div class="wb-dialog-detail">'+esc(detail)+'</div>':'')
    +inputHtml
    +'<div class="wb-dialog-actions">'+cancelHtml+'<button class="wb-dialog-primary '+(danger?'danger':'')+'" data-wb-dialog-ok type="button">'+esc(confirmText)+'</button></div>'
    +'</div>';
  var resolver;
  var promise=new Promise(function(resolve){resolver=resolve});
  var keyHandler=function(e){
    if(e.key==='Escape'){e.preventDefault();closeActive({ok:false,value:null,reason:'escape'});}
    if(e.key==='Enter'&&needsInput&&!multiline){e.preventDefault();submit();}
  };
  function currentValue(){var input=node.querySelector('.wb-dialog-input');return input?input.value:null;}
  function submit(){closeActive({ok:true,value:needsInput?currentValue():true,reason:'ok'});}
  node.addEventListener('click',function(e){
    if(e.target===node&&!options.requireAction)closeActive({ok:false,value:null,reason:'backdrop'});
    if(e.target.closest('[data-wb-dialog-cancel]'))closeActive({ok:false,value:null,reason:'cancel'});
    if(e.target.closest('[data-wb-dialog-ok]'))submit();
  });
  document.addEventListener('keydown',keyHandler,true);
  active={node:node,resolve:resolver,keyHandler:keyHandler};
  host.classList.add('active');
  host.appendChild(node);
  focusFirst(node);
  return promise;
}

function alertDialog(opts){
  if(typeof opts==='string')opts={message:opts};
  opts=Object.assign({type:'alert',title:'WorshipBase'},opts||{});
  return dialog(opts).then(function(){return true});
}
function confirmDialog(opts){
  if(typeof opts==='string')opts={message:opts};
  opts=Object.assign({type:'confirm',title:'Confirm'},opts||{});
  return dialog(opts).then(function(result){return !!(result&&result.ok)});
}
function promptDialog(opts){
  if(typeof opts==='string')opts={message:opts};
  opts=Object.assign({type:'prompt',title:'Enter details'},opts||{});
  return dialog(opts).then(function(result){return result&&result.ok?String(result.value||''):null});
}

root.WBDialogController={alert:alertDialog,confirm:confirmDialog,prompt:promptDialog,close:closeActive};
})(window);
