/* WorshipBase RC1.1 Pad Audio Controller.
   Restores v85-style pad audio using the repository's assets/<type>/<key>.mp3 path,
   with assets/pads/<type>/<key>.mp3 retained as a compatibility fallback. */
(function(root){
'use strict';
var KEYS=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
var FILES={'C':'c.mp3','Db':'cs.mp3','C#':'cs.mp3','D':'d.mp3','Eb':'eb.mp3','D#':'eb.mp3','E':'e.mp3','F':'f.mp3','F#':'fs.mp3','Gb':'fs.mp3','G':'g.mp3','Ab':'ab.mp3','G#':'ab.mp3','A':'a.mp3','Bb':'bb.mp3','A#':'bb.mp3','B':'b.mp3'};
var LIBRARY={peaceful:{label:'Peaceful',folder:'peaceful'},analog:{label:'Analog',folder:'analog'},drones:{label:'Drones',folder:'drones'}};
function canonicalMode(mode){mode=String(mode||'peaceful').trim().toLowerCase();if(mode==='pad')mode='peaceful';return LIBRARY[mode]?mode:'peaceful'}
function canonicalKey(key){key=String(key||'C').trim();var map={'C#':'Db','D#':'Eb','Gb':'F#','G#':'Ab','A#':'Bb','D♭':'Db','E♭':'Eb','G♭':'F#','A♭':'Ab','B♭':'Bb'};key=map[key]||key;return KEYS.indexOf(key)>=0?key:'C'}
function uniq(list){var seen={},out=[];(list||[]).forEach(function(v){v=String(v||'').trim();if(!v||seen[v])return;seen[v]=1;out.push(v)});return out}
function normaliseBases(opts){
  var bases=[];
  if(opts&&Array.isArray(opts.assetsBases))bases=bases.concat(opts.assetsBases);
  if(opts&&opts.assetsBase)bases.push(opts.assetsBase);
  // Current GitHub repo layout from user: assets/drones/a.mp3 etc.
  bases.push('assets/');
  // Compatibility with the v85-style path originally discussed.
  bases.push('assets/pads/');
  return uniq(bases).map(function(base){return base.replace(/\/+$/,'')+'/'});
}
function create(opts){opts=opts||{};var bases=normaliseBases(opts);var state={on:false,key:'C',mode:'peaceful',category:'peaceful',volume:.35,audio:null,currentSrc:'',error:'',lastTried:[]};function toast(msg){try{if(opts.toast)opts.toast(msg)}catch(e){}}
function srcs(){var mode=canonicalMode(state.mode),file=FILES[state.key]||FILES.C;return bases.map(function(base){return base+LIBRARY[mode].folder+'/'+file})}
function src(){return srcs()[0]}
function ensureAudio(){if(!state.audio){state.audio=new Audio();state.audio.loop=true;state.audio.preload='auto';state.audio.volume=state.volume;state.audio.setAttribute('playsinline','');state.audio.setAttribute('webkit-playsinline','')}return state.audio}
function applySource(next){var a=ensureAudio();if(state.currentSrc!==next){state.currentSrc=next;a.src=next;try{a.load()}catch(e){}}a.volume=state.volume;return a}
function tryPlayAt(paths,index,lastErr){
  if(index>=paths.length){state.on=false;state.error=(lastErr&&lastErr.message)||'Could not play pad audio';toast(state.error);return Promise.reject(lastErr||new Error(state.error))}
  var next=paths[index],a=applySource(next),p;
  try{p=a.play()}catch(err){return tryPlayAt(paths,index+1,err)}
  if(p&&typeof p.then==='function'){
    return p.then(function(){state.currentSrc=next;toast((LIBRARY[state.mode]&&LIBRARY[state.mode].label||'Pad')+' pad playing in '+state.key);return state}).catch(function(err){return tryPlayAt(paths,index+1,err)})
  }
  state.currentSrc=next;return Promise.resolve(state)
}
function start(){state.on=true;state.error='';var paths=srcs();state.lastTried=paths.slice();return tryPlayAt(paths,0,null)}
function stop(){state.on=false;try{if(state.audio){state.audio.pause();state.audio.currentTime=0}}catch(e){}return state}
function restartIfNeeded(){return state.on?start():Promise.resolve(state)}
function setKey(key){state.key=canonicalKey(key);return restartIfNeeded()}
function setMode(mode){state.mode=canonicalMode(mode);state.category=state.mode;return restartIfNeeded()}
function setVolume(v){state.volume=Math.max(.02,Math.min(1,Number(v)||.35));if(state.audio)state.audio.volume=state.volume;return state}
return {state:state,library:LIBRARY,start:start,stop:stop,setKey:setKey,setMode:setMode,setVolume:setVolume,src:src,srcs:srcs,bases:bases}}
root.WBPadAudioController={create:create,KEYS:KEYS,LIBRARY:LIBRARY};
})(window);
