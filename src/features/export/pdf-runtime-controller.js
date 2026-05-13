/* WorshipBase Phase 2b - K1 Export/PDF runtime owner.
   Owns export state transitions, PDF preview/plan rendering, PDF blob generation,
   and share/download save behaviour. The legacy shell remains a temporary host. */
(function(root){
'use strict';

var exportPageState={context:'set',preset:'rehearsal',mode:'chords',flow:'continuous',columns:'single',size:'standard',flags:{author:true,key:true,songId:false,cover:false}};
var WBExportPlan=null;

var bridgeEnv=null;
var settings={},state={},songs=[];
function configure(env){bridgeEnv=env||{};syncBridgeState();return true;}
function bridge(){return bridgeEnv||root.WBExportPdfRuntimeBridge||{};}
function syncBridgeState(){var b=bridge();settings=b.settings||settings||{};state=b.state||state||{};songs=b.songs||songs||[];return b;}
function qs(id){var b=syncBridgeState();return b.qs?b.qs(id):(root.document&&root.document.getElementById(id));}
function qsa(sel,scope){var b=syncBridgeState();return b.qsa?b.qsa(sel,scope):Array.prototype.slice.call(((scope||root.document)||{}).querySelectorAll? (scope||root.document).querySelectorAll(sel):[]);}
function esc(v){var b=syncBridgeState();return b.esc?b.esc(v):String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
function showToast(msg){var b=syncBridgeState();return b.showToast?b.showToast(msg):false;}
function currentExportSubject(kind){var b=syncBridgeState();return b.currentExportSubject?b.currentExportSubject(kind):{kind:'song',title:'Song',song:(songs||[])[0]||null};}
function keyModel(){var b=syncBridgeState();return b.keyModel?b.keyModel():null;}
function keyModelEnv(){var b=syncBridgeState();return b.keyModelEnv?b.keyModelEnv():{};}
function resolveEffectiveKeyForSong(song,opts){var b=syncBridgeState();return b.resolveEffectiveKeyForSong?b.resolveEffectiveKeyForSong(song,opts):(song&&song.key)||'C';}
function songCode(song){var b=syncBridgeState();return b.songCode?b.songCode(song):(song&&song.code)||'';}
function transposeChord(ch,fromKey,toKey){var b=syncBridgeState();return b.transposeChord?b.transposeChord(ch,fromKey,toKey):ch;}
function chordToNns(ch,key){var b=syncBridgeState();return b.chordToNns?b.chordToNns(ch,key):ch;}
function activeThemeHex(){var b=syncBridgeState();return b.activeThemeHex?b.activeThemeHex():'#10374A';}
function applyExportPresetState(p){exportPageState.preset=p||'rehearsal';exportPageState.flags.cover=false;if(p==='stage'){exportPageState.mode='chords';exportPageState.flow='page';exportPageState.columns='single';exportPageState.size='large';exportPageState.flags.author=true;exportPageState.flags.key=true;exportPageState.flags.songId=false}else if(p==='compact'){exportPageState.mode='chords';exportPageState.flow='continuous';exportPageState.columns='two';exportPageState.size='compact';exportPageState.flags.author=true;exportPageState.flags.key=true;exportPageState.flags.songId=false}else if(p==='lyrics'){exportPageState.mode='lyrics';exportPageState.flow='continuous';exportPageState.columns='single';exportPageState.size='standard';exportPageState.flags.author=true;exportPageState.flags.key=false;exportPageState.flags.songId=false}else{exportPageState.mode='chords';exportPageState.flow='continuous';exportPageState.columns='single';exportPageState.size='standard';exportPageState.flags.author=true;exportPageState.flags.key=true;exportPageState.flags.songId=false}}
function exportContextToKind(){return exportPageState.context==='workspace-set'?'workspace-set':exportPageState.context==='song'?'song':'set'}
function openExportShell(kind){openExportView(kind||'set')}
function exportCurrentSetShell(){openExportView('set')}
function openExportView(kind){exportPageState.context=(kind==='workspace-set'||kind==='song')?kind:'set';applyExportPresetState(settings.defaultPdfPreset||'rehearsal');var v=qs('export-view');if(v){v.classList.add('visible');v.setAttribute('aria-hidden','false');document.body.classList.add('editor-open')}try{renderExportView()}catch(err){console.warn('Export render failed',err);try{syncExportControls()}catch(e){}}}
function closeExportView(){var v=qs('export-view');if(v){v.classList.remove('visible');v.setAttribute('aria-hidden','true');document.body.classList.remove('editor-open')}}
function exportSubject(){return currentExportSubject(exportContextToKind())}
function exportSetItems(subject){var owner=keyModel();if(owner&&owner.buildSetExportItems)return owner.buildSetExportItems(subject,keyModelEnv());if(subject.kind==='song')return subject.song?[{song:subject.song,item:null}]:[];var set=subject.set,items=[];if(set){items=(set.items||[]).filter(function(it){return it.type==='song'}).map(function(it){var s=songs.find(function(x){return x.id===it.songId});return s?{song:s,item:it}:null}).filter(Boolean)}return items}
function exportSongKey(pair,subject){if(!pair||!pair.song)return 'C';if(pair.resolvedKey)return pair.resolvedKey;if(subject&&subject.kind==='workspace-set')return resolveEffectiveKeyForSong(pair.song,{scope:'workspace',setId:subject.set&&subject.set.id,item:pair.item});if(subject&&subject.kind==='set')return resolveEffectiveKeyForSong(pair.song,{scope:'personal',setId:subject.set&&subject.set.id,item:pair.item});return state.displayKey||resolveEffectiveKeyForSong(pair.song,null)}
function renderExportView(){var row=qs('export-preset-card-row'),subject=exportSubject(),items=exportSetItems(subject),sub=qs('export-view-sub');if(sub){var label=subject.kind==='song'?'Song':subject.kind==='workspace-set'?'Workspace set':'Set list';sub.innerHTML='<strong>'+esc(label+': '+(subject.title||'Untitled'))+'</strong><span>'+esc((items.length||0)+' song'+(items.length===1?'':'s')+' selected for export')+'</span>'}if(row){var presets=[['stage','Stage chart','Larger, clearer layout'],['rehearsal','Rehearsal','Balanced for practice'],['compact','Compact print','Fits more on each page'],['lyrics','Lyrics only','No chords shown']];row.innerHTML=presets.map(function(p){return '<button class="export-preset '+(exportPageState.preset===p[0]?'active':'')+'" data-export-preset-card="'+p[0]+'" type="button"><div class="export-preset-title">'+p[1]+'</div><div class="export-preset-sub">'+p[2]+'</div></button>'}).join('')}syncExportControls();renderExportMiniPreview()}
function syncExportControls(){qsa('[data-export-mode]').forEach(function(b){b.classList.toggle('active',b.dataset.exportMode===exportPageState.mode)});qsa('[data-export-flow]').forEach(function(b){b.classList.toggle('active',b.dataset.exportFlow===exportPageState.flow)});qsa('[data-export-columns]').forEach(function(b){b.classList.toggle('active',b.dataset.exportColumns===exportPageState.columns)});qsa('[data-export-size]').forEach(function(b){b.classList.toggle('active',b.dataset.exportSize===exportPageState.size)});qsa('[data-export-flag]').forEach(function(sw){var key=sw.dataset.exportFlag;sw.classList.toggle('on',!!exportPageState.flags[key])})}
function renderExportMiniPreview(){var subject=exportSubject(),items=exportSetItems(subject).slice(0,exportPageState.columns==='two'?2:2),meta=qs('export-page-meta'),set=qs('export-mini-set'),content=qs('export-mini-content');if(meta)meta.textContent=(exportPageState.flow==='page'?'One song / page':'Continuous')+' • '+(exportPageState.columns==='two'?'Two-column':'Single column')+' • '+(exportPageState.size==='compact'?'Compact':exportPageState.size==='large'?'Large':'Standard');if(set)set.textContent=subject.kind==='song'?'Song preview':(subject.title||'Set preview');if(!content)return;if(!items.length){content.innerHTML='<div class="export-mini-song"><div class="export-mini-title">No songs to preview</div><div class="export-mini-meta">Add songs to your set list or open a song first.</div></div>';return}var wrap=exportPageState.columns==='two'?'export-mini-cols':'';content.innerHTML='<div class="'+wrap+'">'+items.map(function(pair){var s=pair.song,key=exportSongKey(pair,subject),bits=[];if(exportPageState.flags.author&&s.artist)bits.push(esc(s.artist));if(exportPageState.flags.key)bits.push('Key '+esc(key));if(exportPageState.flags.songId)bits.push(esc(songCode(s)));return '<div class="export-mini-song"><div class="export-mini-title">'+esc(s.title||'Untitled')+'</div>'+(bits.length?'<div class="export-mini-meta">'+bits.join(' • ')+'</div>':'')+'<div class="export-mini-lines"><div class="export-mini-line long"></div><div class="export-mini-line med"></div><div class="export-mini-line short"></div></div></div>'}).join('')+'</div>'}
function exportDisplayChord(ch,song,key,mode){var t=transposeChord(ch,(song&&song.key)||'C',key||((song&&song.key)||'C'));return mode==='nns'?chordToNns(t,key||((song&&song.key)||'C')):t}
function escapeTextWithSpaces(t){return esc(t).replace(/ /g,'&nbsp;')}
function wbExportOptions(){return {exportKey:'set',exportFlow:exportPageState.flow==='page'?'page':'continuous',exportColumns:exportPageState.columns==='two'?'two':'single',exportFont:exportPageState.size||'standard',exportContent:exportPageState.mode==='lyrics'?'lyrics':(exportPageState.mode==='nns'?'nns':'chords'),showAuthor:!!exportPageState.flags.author,showKey:!!exportPageState.flags.key,showId:!!exportPageState.flags.songId,showCover:!!exportPageState.flags.cover}}
function wbPdfSafe(s){return String(s==null?'':s).replace(/\u00a0/g,' ').replace(/[‘’‚‛]/g,"'").replace(/[“”„‟]/g,'"').replace(/[–—−‐‑‒]/g,'-').replace(/…/g,'...').replace(/\s+$/,'')}
function wbPdfPairSafe(s){return String(s==null?'':s).replace(/\u00a0/g,' ').replace(/\t/g,'    ').replace(/[‘’‚‛]/g,"'").replace(/[“”„‟]/g,'"').replace(/[–—−‐‑‒]/g,'-').replace(/…/g,'...')}
function wbPdfEsc(s){return wbPdfSafe(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function wbPdfEscPreserve(s){return wbPdfPairSafe(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function wbPdfSongCode(song){return songCode(song)||song.code||song.songCode||''}
function wbPdfThemeHex(){try{return activeThemeHex&&activeThemeHex()||'#10374A'}catch(e){return '#10374A'}}
function wbPdfContentLabel(opts){return (opts&&opts.exportContent)==='lyrics'?'Lyrics only':(opts&&opts.exportContent)==='nns'?'NNS':'Lyrics + chords'}
function wbPdfRgb(hex){var raw=String(hex||'#10374A').replace('#','');if(raw.length===3)raw=raw.split('').map(function(c){return c+c}).join('');var n=parseInt(raw.slice(0,6),16);if(!Number.isFinite(n))return '0.063 0.216 0.290';return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255].map(function(v){return v.toFixed(4)}).join(' ')}
function wbPdfIsChordToken(t){return /^[A-G](?:#|b)?(?:(?:maj|major|min|minor|dim|aug|sus2|sus4|sus|add2|add4|add9|add11|add13|add|no3|no5|no|ø|m|b5|#5|b9|#9|b11|#11|b13|#13|2|4|5|6|7|9|11|13))*(?:\/[A-G](?:#|b)?)?$/i.test(String(t||'').trim())}
function wbPdfIsSectionLine(line){var m=String(line||'').trim().match(/^\[([^\]]+)\]$/);return !!(m&&!wbPdfIsChordToken(m[1]))}
function wbPdfSectionName(line){return String(line||'').trim().replace(/^\[/,'').replace(/\]$/,'').replace(/\s+/g,' ').toUpperCase()}
function wbPdfChordOnly(line){var t=String(line||'').trim();return !!t && t.split(/\s+/).every(wbPdfIsChordToken)}
function wbPdfChordTokenCandidatesAt(str,i){var sub=String(str||'').slice(i),re=/^[A-G](?:#|b)?(?:(?:maj|major|min|minor|dim|aug|sus2|sus4|sus|add2|add4|add9|add11|add13|add|no3|no5|no|ø|m|b5|#5|b9|#9|b11|#11|b13|#13|2|4|5|6|7|9|11|13))*(?:\/[A-G](?:#|b)?)?/i,m=sub.match(re);if(!m||!m[0])return [];var max=m[0],out=[];for(var n=max.length;n>=1;n--){var t=max.slice(0,n);if(wbPdfIsChordToken(t))out.push(t)}return out}
function wbPdfSplitChordCluster(token){token=String(token||'');if(!token||/\s/.test(token))return null;var memo={};function dp(i){if(i>=token.length)return [];if(memo[i]!==undefined)return memo[i];var best=null,cands=wbPdfChordTokenCandidatesAt(token,i);for(var c=0;c<cands.length;c++){var cand=cands[c],rest=dp(i+cand.length);if(rest){var path=[cand].concat(rest);if(!best||path.length>best.length)best=path}}memo[i]=best;return best}var res=dp(0);return res&&res.join('')===token&&res.length>1?res:null}
function wbPdfNormalizeChordLineSpacing(s){s=wbPdfSafe(s).replace(/[ \t]+$/,'');if(!s.trim())return s;return s.split(/(\s+)/).map(function(part){if(!part||/\s+/.test(part))return part;var split=wbPdfSplitChordCluster(part);return split?split.join('  '):part}).join('').replace(/[ \t]+$/,'')}
function wbPdfLastChordIndex(arr){for(var i=arr.length-1;i>=0;i--){if(arr[i]&&arr[i]!==' ')return i}return -1}
function wbPdfChordSlotFree(arr,pos,len){for(var i=0;i<len;i++){var v=arr[pos+i];if(v&&v!==' ')return false}return true}
function wbPdfPlaceChord(arr,pos,ch,minGap){ch=String(ch||'').trim();if(!ch)return;pos=Math.max(0,pos|0);for(var i=0;i<ch.length;i++){var idx=pos+i;arr[idx]=arr[idx]&&arr[idx]!==' '?arr[idx]:ch[i]}}
function wbPdfTransposeChord(ch,fromKey,toKey){if(!ch||!fromKey||!toKey||fromKey===toKey)return ch;var sharp=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],flat=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];function idx(k){var i=sharp.indexOf(k);if(i<0)i=flat.indexOf(k);return i}var a=idx(fromKey),b=idx(toKey);if(a<0||b<0)return ch;var d=b-a;return String(ch).replace(/[A-G](?:#|b)?/g,function(root){var i=idx(root);return i<0?root:sharp[(i+d+120)%12]})}
function wbPdfFormatChordToken(token,fromKey,toKey,opts){var out=wbPdfTransposeChord(token,fromKey,toKey);try{if(opts&&opts.exportContent==='nns'&&typeof chordToNns==='function')out=chordToNns(out,toKey||fromKey)}catch(e){}return out}
function wbPdfTransposeChordLinePreserveSpacing(line,fromKey,toKey,opts){return wbPdfPairSafe(line).split(/(\s+)/).map(function(part){if(!part||/\s+/.test(part))return part;var split=wbPdfSplitChordCluster(part);if(split)return split.map(function(t){return wbPdfFormatChordToken(t,fromKey,toKey,opts)}).join('  ');return wbPdfIsChordToken(part)?wbPdfFormatChordToken(part,fromKey,toKey,opts):part}).join('')}
function wbPdfLastContentIndex(text){for(var i=String(text||'').length-1;i>=0;i--){if(String(text||'').charAt(i)!==' ')return i}return -1}
function wbPdfPairSegment(ch,ly){var end=Math.max(wbPdfLastContentIndex(ch),wbPdfLastContentIndex(ly))+1;if(end<0)end=0;return {ch:String(ch||'').slice(0,end),ly:String(ly||'').slice(0,end)}}
function wbPdfTransposeLine(line,fromKey,toKey,opts){var s=String(line||'');if(/\[[^\]]+\]/.test(s))return s.replace(/\[([^\]]+)\]/g,function(_,c){return '['+wbPdfFormatChordToken(c,fromKey,toKey,opts)+']'});return wbPdfTransposeChordLinePreserveSpacing(s,fromKey,toKey,opts)}
function wbPdfInlinePair(raw,songKey,printKey,opts){raw=String(raw||'');var lyric='',chords=[],last=0,re=/\[([^\]]+)\]/g,m;while((m=re.exec(raw))){var before=raw.slice(last,m.index);lyric+=before;var chord=wbPdfFormatChordToken(m[1],songKey,printKey,opts);wbPdfPlaceChord(chords,lyric.length,chord);last=re.lastIndex}lyric+=raw.slice(last);return wbPdfPairSegment(Array.from({length:chords.length},function(_,i){return chords[i]||' '}).join(''),wbPdfPairSafe(lyric))}
function wbPdfChordLyricPair(chordLine,lyricLine,songKey,printKey,opts){var ch=wbPdfTransposeChordLinePreserveSpacing(chordLine,songKey,printKey,opts);return wbPdfPairSegment(ch,wbPdfPairSafe(lyricLine||''))}
function wbPdfWrapText(text,max){text=wbPdfSafe(text);if(!text)return [''];var out=[],s=text;while(s.length>max){var cut=s.lastIndexOf(' ',max);if(cut<Math.floor(max*.55))cut=max;out.push(s.slice(0,cut).replace(/\s+$/,''));s=s.slice(cut).replace(/^\s+/,'')}if(s.length||!out.length)out.push(s);return out}
function wbPdfWrapPair(pair,max){var ch=wbPdfPairSafe(pair&&pair.ch||''),ly=wbPdfPairSafe(pair&&pair.ly||''),len=Math.max(ch.length,ly.length);ch=ch.padEnd(len,' ');ly=ly.padEnd(len,' ');var out=[],a=ch,b=ly;while(Math.max(a.length,b.length)>max){var cut=b.lastIndexOf(' ',max);if(cut<Math.floor(max*.50))cut=max;out.push(wbPdfPairSegment(a.slice(0,cut),b.slice(0,cut)));a=a.slice(cut);b=b.slice(cut);var lead=(b.match(/^\s+/)||[''])[0].length;if(lead){a=a.slice(lead);b=b.slice(lead)}}if(a.trim()||b.trim())out.push(wbPdfPairSegment(a,b));return out}
function wbPdfProfile(opts,cols){var size=opts.exportFont||'standard',compact=size==='compact',large=size==='large',p;if(compact)p={margin:36,gap:24,title:15,meta:8.2,chart:8.35,chord:8.35,section:7.6,line:9.25,secLine:12.2,sp:4.2,gapAfterSong:10};else if(large)p={margin:42,gap:28,title:20,meta:10.5,chart:11.2,chord:11.2,section:9.2,line:13.0,secLine:16.0,sp:6.0,gapAfterSong:18};else p={margin:40,gap:26,title:17.5,meta:9.5,chart:9.8,chord:9.8,section:8.4,line:11.2,secLine:14.2,sp:5.2,gapAfterSong:18};if(cols===2){if(compact)p={margin:30,gap:22,title:12.6,meta:7.1,chart:7.05,chord:7.05,section:6.45,line:7.75,secLine:10.1,sp:3.0,gapAfterSong:7};else if(large)p={margin:34,gap:24,title:15.2,meta:8.2,chart:8.45,chord:8.45,section:7.35,line:9.45,secLine:12.0,sp:3.8,gapAfterSong:9};else p={margin:32,gap:23,title:13.8,meta:7.6,chart:7.65,chord:7.65,section:6.9,line:8.45,secLine:10.9,sp:3.5,gapAfterSong:8}}p.cols=cols;p.colW=cols===2?(595.28-p.margin*2-p.gap)/2:595.28-p.margin*2;p.usableH=841.89-p.margin*2;p.maxChars=Math.max(28,Math.floor(p.colW/(p.chart*.60)));return p}
function wbPdfLineHeight(line,p){if(line.type==='songTitle')return Math.ceil(p.title*1.15)+2;if(line.type==='meta')return Math.ceil(p.meta*1.35)+4;if(line.type==='section')return p.secLine;if(line.type==='spacer')return line.h||p.sp;if(line.type==='songGap')return p.gapAfterSong;return p.line}
function wbPdfBlockHeight(block,p){return (block.lines||[]).reduce(function(a,l){return a+wbPdfLineHeight(l,p)},0)}
function wbPdfAddPairBlocks(blocks,pair,p){wbPdfWrapPair(pair,p.maxChars).forEach(function(seg){var lines=[];if(seg.ch.trim())lines.push({type:'chord',text:seg.ch});if(seg.ly.trim())lines.push({type:'lyric',text:seg.ly});if(lines.length)blocks.push({kind:'pair',lines:lines})})}
function wbPdfSongBlocks(song,printKey,opts,p){song=song||{};var songKey=song.key||printKey||'C',blocks=[];blocks.push({kind:'songTitle',lines:[{type:'songTitle',text:song.title||'Untitled song'}]});var meta=[];if(opts.showAuthor&&(song.artist||song.author))meta.push(song.artist||song.author);if(opts.showKey)meta.push('Key of '+printKey+(songKey&&songKey!==printKey?' - Originally '+songKey:''));if(song.timeSig||song.timeSignature)meta.push('Time: '+(song.timeSig||song.timeSignature));if(song.bpm)meta.push(song.bpm+' BPM');if(opts.showId){var code=wbPdfSongCode(song);if(code)meta.push(code)}if(opts.exportContent==='nns')meta.push('NNS');if(meta.length)blocks.push({kind:'meta',lines:[{type:'meta',text:meta.join(' - ')}]});var chart=String(song.chart||'');if(!chart.trim()){blocks.push({kind:'plain',lines:[{type:'lyric',text:opts.exportContent==='lyrics'?'No lyrics yet.':'No chord chart yet.'}]});return blocks}var lines=chart.split('\n');for(var i=0;i<lines.length;i++){var raw=lines[i]||'',trimmed=raw.trim();if(!trimmed){blocks.push({kind:'spacer',lines:[{type:'spacer',h:p.sp}]});continue}if(wbPdfIsSectionLine(raw)){blocks.push({kind:'section',lines:[{type:'section',text:wbPdfSectionName(raw)},{type:'spacer',h:p.secAfter||2.4}]});continue}if(opts.exportContent==='lyrics'){if(/\[[^\]]+\]/.test(raw)){wbPdfWrapText(wbPdfInlinePair(raw,songKey,printKey,opts).ly,p.maxChars).forEach(function(t){if(t.trim())blocks.push({kind:'plain',lines:[{type:'lyric',text:t}]})});continue}if(wbPdfChordOnly(raw)){var nx=lines[i+1]||'',hasLy=nx.trim()&&!wbPdfChordOnly(nx)&&!wbPdfIsSectionLine(nx);if(hasLy){wbPdfWrapText(nx,p.maxChars).forEach(function(t){blocks.push({kind:'plain',lines:[{type:'lyric',text:t}]})});i++}continue}wbPdfWrapText(raw,p.maxChars).forEach(function(t){blocks.push({kind:'plain',lines:[{type:'lyric',text:t}]})});continue}if(/\[[^\]]+\]/.test(raw)){wbPdfAddPairBlocks(blocks,wbPdfInlinePair(raw,songKey,printKey,opts),p);continue}if(wbPdfChordOnly(raw)){var next=lines[i+1]||'',hasNext=next.trim()&&!wbPdfChordOnly(next)&&!/\[[^\]]+\]/.test(next)&&!wbPdfIsSectionLine(next);if(hasNext){wbPdfAddPairBlocks(blocks,wbPdfChordLyricPair(raw,next,songKey,printKey,opts),p);i++}else{wbPdfWrapText(wbPdfTransposeLine(raw,songKey,printKey,opts).replace(/[ \t]+$/,''),p.maxChars).forEach(function(t){blocks.push({kind:'chordOnly',lines:[{type:'chord',text:t}]})})}continue}wbPdfWrapText(raw,p.maxChars).forEach(function(t){blocks.push({kind:'plain',lines:[{type:'lyric',text:t}]})})}return blocks}
function wbPdfBuildPlan(){var opts=wbExportOptions(),subject=exportSubject(),items=exportSetItems(subject),cols=opts.exportColumns==='two'?2:1,p=wbPdfProfile(opts,cols),plan={title:subject.title||'Worship Set List',context:subject.kind,opts:opts,cols:cols,profile:p,pages:[]};if(subject.kind!=='song')plan.pages.push({type:'cover',title:plan.title,items:items.map(function(pair,i){return {n:i+1,title:pair.song.title||'Untitled song',key:exportSongKey(pair,subject)}})});var page=null,col=0,used=0;function newPage(){page={type:'content',cols:Array.from({length:cols},function(){return []})};plan.pages.push(page);col=0;used=0}function nextCol(){if(!page)newPage();if(col<cols-1){col++;used=0}else newPage()}function remaining(){return p.usableH-used}function ensureRoom(h){if(!page)newPage();if(used>0&&h>remaining())nextCol()}function addBlock(block){ensureRoom(wbPdfBlockHeight(block,p));(block.lines||[]).forEach(function(l){page.cols[col].push(l)});used+=wbPdfBlockHeight(block,p)}function firstRealBlocks(blocks,count){return blocks.filter(function(b){return b.kind!=='spacer'&&b.kind!=='songGap'}).slice(0,count||4)}function minSongStartHeight(blocks){return Math.min(p.usableH*.45,firstRealBlocks(blocks,4).reduce(function(a,b){return a+wbPdfBlockHeight(b,p)},0))}function minSectionStartHeight(blocks,i){var h=wbPdfBlockHeight(blocks[i],p),seen=0;for(var j=i+1;j<blocks.length&&seen<2;j++){if(blocks[j].kind==='spacer'||blocks[j].kind==='songGap')continue;h+=wbPdfBlockHeight(blocks[j],p);seen++}return Math.min(p.usableH*.32,h)}items.forEach(function(pair,idx){if(opts.exportFlow==='page'&&page&&page.cols.some(function(c){return c.length}))newPage();var blocks=wbPdfSongBlocks(pair.song,exportSongKey(pair,subject),opts,p);if(opts.exportFlow!=='page'&&idx>0){var gapBlock={kind:'songGap',lines:[{type:'songGap'}]},startH=minSongStartHeight(blocks),gapH=wbPdfBlockHeight(gapBlock,p);if(!page)newPage();if(used>0){if(gapH+startH>remaining())nextCol();else addBlock(gapBlock)}}if(opts.exportFlow!=='page'&&used>0&&minSongStartHeight(blocks)>remaining())nextCol();for(var bi=0;bi<blocks.length;bi++){var b=blocks[bi];if(b.kind==='section'&&used>0&&minSectionStartHeight(blocks,bi)>remaining())nextCol();addBlock(b)}});if(!items.length){newPage();addBlock({kind:'plain',lines:[{type:'songTitle',text:'No songs to export'}]})}plan.pages=plan.pages.filter(function(pg){return pg.type==='cover'||pg.cols.some(function(c){return c.length})});return plan}
function wbPdfInstallStyle(){if(qs('wb-export-engine-style'))return;var st=document.createElement('style');st.id='wb-export-engine-style';st.textContent='.wbpdf-stack{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}.wbpdf-shell{width:100%;display:flex;flex-direction:column;align-items:center;gap:7px}.wbpdf-svg{width:min(100%,720px);max-width:calc(100vw - 20px);height:auto;display:block;background:#fff;border-radius:4px;box-shadow:0 8px 18px rgba(16,55,74,.12)}.wb-export-pdf-preview-count{font-size:11px;font-weight:850;color:var(--txt3);text-align:center}.wb-export-preview-error{margin:26px 14px;padding:18px;border-radius:18px;background:var(--bg1);color:var(--txt1);border:1px solid var(--surface-border);text-align:center}.wb-export-pdf-preview-scroll{background:var(--bg2)!important}.wb-export-pdf-preview-view .wb-export-pdf-preview-hdr{background:color-mix(in srgb,var(--bg1) 96%,transparent)!important;border-bottom:1px solid var(--surface-border)!important}.wb-export-pdf-preview-view .wb-export-pdf-preview-title{color:var(--txt1)!important}.wb-export-pdf-preview-view .wb-export-pdf-preview-btn{background:var(--surface-tint)!important;color:var(--txt2)!important;border-color:var(--surface-border)!important}.wb-export-pdf-preview-view .wb-export-pdf-preview-btn.primary{background:var(--accent)!important;border-color:var(--accent)!important;color:var(--accent-fg)!important;box-shadow:none!important}body.dark .wb-export-pdf-preview-scroll{background:var(--bg1)!important}body.dark .wb-export-pdf-preview-view .wb-export-pdf-preview-hdr{background:var(--bg1)!important;border-bottom-color:rgba(255,255,255,.10)!important}body.dark .wb-export-pdf-preview-view .wb-export-pdf-preview-btn{background:var(--wb-sec-surface)!important;color:var(--txt2)!important;border-color:var(--wb-sec-border)!important}body.dark .wb-export-pdf-preview-view .wb-export-pdf-preview-btn.primary{background:color-mix(in srgb,var(--accent) 78%,#fff)!important;border-color:color-mix(in srgb,var(--accent) 78%,#fff)!important;color:#111!important}';document.head.appendChild(st)}
function wbPdfSvgText(s,x,y,size,font,weight,color){s=wbPdfPairSafe(s);if(!s.length)return '';return '<text xml:space="preserve" style="white-space:pre" x="'+wbPdfNum(x)+'" y="'+wbPdfNum(y)+'" font-family="'+wbPdfEsc(font||'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif')+'" font-size="'+wbPdfNum(size||10)+'" font-weight="'+wbPdfEsc(weight||400)+'" fill="'+wbPdfEsc(color||'#101820')+'">'+wbPdfEscPreserve(s)+'</text>'}
function wbPdfSvgRect(x,y,w,h,fill,rx){return '<rect x="'+wbPdfNum(x)+'" y="'+wbPdfNum(y)+'" width="'+wbPdfNum(w)+'" height="'+wbPdfNum(h)+'" rx="'+wbPdfNum(rx||0)+'" fill="'+wbPdfEsc(fill||'#eef2f4')+'"/>'}
try{window.wbPdfSvgText=wbPdfSvgText;window.wbPdfSvgRect=wbPdfSvgRect}catch(e){}
function wbPdfSvgLine(line,p,x,yTop){var h=wbPdfLineHeight(line,p),base=yTop+Math.min(h-2,(line.type==='section'?p.section:p.chart)+1.7),dark='#101820',gray='#626f77',accent=wbPdfThemeHex(),pale='#eef2f4';if(line.type==='songTitle')return wbPdfSvgText(line.text,x,base,p.title,'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',860,dark);if(line.type==='meta')return wbPdfSvgText(line.text,x,base,p.meta,'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',500,gray);if(line.type==='section'){var w=Math.min(p.colW,Math.max(32,String(line.text||'').length*p.section*.66+14));return wbPdfSvgRect(x,yTop+1.4,w,Math.max(7.5,p.section+4.1),pale,5)+wbPdfSvgText(line.text,x+7,base,p.section,'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',850,gray)}if(line.type==='chord')return wbPdfSvgText(line.text,x,base,p.chord,'ui-monospace,SFMono-Regular,Menlo,Monaco,monospace',850,accent);if(line.type==='lyric')return wbPdfSvgText(line.text,x,base,p.chart,'ui-monospace,SFMono-Regular,Menlo,Monaco,monospace',400,dark);return ''}
try{window.wbPdfSvgLine=wbPdfSvgLine}catch(e){}
function wbPdfRenderPlan(plan){var p=plan.profile,accent=wbPdfThemeHex();return '<div class="wbpdf-stack">'+plan.pages.map(function(pg,i){var svg;if(pg.type==='cover'){var rows=(pg.items||[]).slice(0,34).map(function(it,idx){var y=174+idx*23;return wbPdfSvgText(String(it.n).padStart(2,'0'),42,y,11,'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',850,'#8b98a2')+wbPdfSvgText(it.title,76,y,13,'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',400,'#101820')+wbPdfSvgText(it.key,525,y,11,'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',850,accent)}).join('');svg='<svg class="wbpdf-svg" viewBox="0 0 595.28 841.89" xmlns="http://www.w3.org/2000/svg"><rect width="595.28" height="841.89" fill="#fff"/>'+wbPdfSvgText(pg.title||'Worship Set List',42,86,28,'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',850,accent)+wbPdfSvgText((pg.items.length)+' song'+(pg.items.length!==1?'s':'')+' · '+(plan.opts.exportFlow==='page'?'One song / page':'Continuous')+' · '+(plan.cols===2?'Two-column':'Single column')+' · '+wbPdfContentLabel(plan.opts),42,118,11,'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',850,'#64727a')+'<line x1="42" y1="140" x2="553.28" y2="140" stroke="#dbe2e6" stroke-width=".75"/>'+rows+'</svg>'}else{var cols='';for(var c=0;c<plan.cols;c++){var x=p.margin+c*(p.colW+p.gap),y=p.margin,lines='';(pg.cols[c]||[]).forEach(function(line){lines+=wbPdfSvgLine(line,p,x,y);y+=wbPdfLineHeight(line,p)});cols+=lines}svg='<svg class="wbpdf-svg" viewBox="0 0 595.28 841.89" xmlns="http://www.w3.org/2000/svg"><rect width="595.28" height="841.89" fill="#fff"/>'+cols+'</svg>'}return '<div class="wbpdf-shell">'+svg+'<div class="wb-export-pdf-preview-count">Page '+(i+1)+' of '+plan.pages.length+'</div></div>'}).join('')+'</div>'}
function openExportPreview(){var DS=window.WBDataSafetyController||null;if(DS&&DS.openPdfPreview){var res=DS.openPdfPreview({qs:qs,installStyle:wbPdfInstallStyle,subject:exportSubject,buildPlan:wbPdfBuildPlan,renderPlan:wbPdfRenderPlan,escape:wbPdfEsc,showToast:showToast});WBExportPlan=res&&res.plan||null;return}wbPdfInstallStyle();var v=qs('wb-export-pdf-preview-view'),pages=qs('wb-export-preview-pages'),title=qs('wb-export-preview-title'),scroll=qs('wb-export-preview-scroll'),subject=exportSubject();if(!v||!pages)return;if(title)title.textContent=subject.kind==='song'?'Song PDF Preview':'Set List PDF Preview';v.classList.add('open');v.setAttribute('aria-hidden','false');if(scroll)scroll.scrollTop=0;try{WBExportPlan=wbPdfBuildPlan();pages.innerHTML=wbPdfRenderPlan(WBExportPlan)}catch(err){console.warn('Export preview render error',err);WBExportPlan=null;pages.innerHTML='<div class="wb-export-preview-error"><div>Preview could not render.</div><small>'+wbPdfEsc(err&&err.message?err.message:'Unknown export error')+'</small></div>';try{showToast('Preview needs attention')}catch(e){}}}
function closeExportPreview(){var v=qs('wb-export-pdf-preview-view');if(v){v.classList.remove('open');v.setAttribute('aria-hidden','true')}}
function wbPdfNum(n){return (Math.round((+n||0)*100)/100).toFixed(2).replace(/\.00$/,'')}
function wbPdfStr(s){s=wbPdfSafe(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x09\x0A\x0D\x20-\x7E]/g,'').replace(/[\r\n]+/g,' ').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');return '('+s+')'}
function wbPdfMake(pages){var enc=new TextEncoder(),objs=[],kids=[];objs[1]='1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';objs[3]='3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n';objs[4]='4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n';objs[5]='5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>\nendobj\n';objs[6]='6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj\n';pages.forEach(function(cmds,i){var cont=7+i*2,pg=8+i*2,stream=cmds.join(''),len=enc.encode(stream).length;objs[cont]=cont+' 0 obj\n<< /Length '+len+' >>\nstream\n'+stream+'endstream\nendobj\n';objs[pg]=pg+' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents '+cont+' 0 R >>\nendobj\n';kids.push(pg+' 0 R')});objs[2]='2 0 obj\n<< /Type /Pages /Count '+pages.length+' /Kids ['+kids.join(' ')+'] >>\nendobj\n';var max=6+pages.length*2,chunks=[],off=new Array(max+1).fill(0),head=enc.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');chunks.push(head);var pos=head.length;for(var i=1;i<=max;i++){var b=enc.encode(objs[i]||i+' 0 obj\n<<>>\nendobj\n');off[i]=pos;chunks.push(b);pos+=b.length}var xrefAt=pos,xref='xref\n0 '+(max+1)+'\n0000000000 65535 f \n';for(var j=1;j<=max;j++)xref+=String(off[j]).padStart(10,'0')+' 00000 n \n';chunks.push(enc.encode(xref+'trailer\n<< /Size '+(max+1)+' /Root 1 0 R >>\nstartxref\n'+xrefAt+'\n%%EOF\n'));return new Blob(chunks,{type:'application/pdf'})}
function wbPdfLine(cmd,s,x,y,size,font,color){if(!String(s||'').length)return;cmd.push((color||'0.05 0.07 0.09')+' rg BT /'+font+' '+wbPdfNum(size)+' Tf '+wbPdfNum(x)+' '+wbPdfNum(841.89-y)+' Td '+wbPdfStr(s)+' Tj ET\n')}
function wbPdfRect(cmd,x,top,w,h,color){cmd.push((color||'0.93 0.94 0.95')+' rg '+wbPdfNum(x)+' '+wbPdfNum(841.89-top-h)+' '+wbPdfNum(w)+' '+wbPdfNum(h)+' re f\n')}
function wbPdfPlanToBlob(plan){var p=plan.profile,pages=[],accent=wbPdfRgb(wbPdfThemeHex()),dark='0.055 0.075 0.095',gray='0.39 0.46 0.50',pale='0.925 0.945 0.960';function cmd0(){return ['1 1 1 rg 0 0 595.28 841.89 re f\n']}function drawLine(cmd,line,x,yTop){var h=wbPdfLineHeight(line,p),base=yTop+Math.min(h-2,(line.type==='section'?p.section:p.chart)+1.7);if(line.type==='songTitle')wbPdfLine(cmd,line.text,x,base,p.title,'F2',dark);else if(line.type==='meta')wbPdfLine(cmd,line.text,x,base,p.meta,'F1',gray);else if(line.type==='section'){var w=Math.min(p.colW,Math.max(32,String(line.text).length*p.section*.66+14));wbPdfRect(cmd,x,yTop+1.4,w,Math.max(7.5,p.section+4.1),pale);wbPdfLine(cmd,line.text,x+7,base,p.section,'F2',gray)}else if(line.type==='chord')wbPdfLine(cmd,line.text,x,base,p.chord,'F3',accent);else if(line.type==='lyric')wbPdfLine(cmd,line.text,x,base,p.chart,'F4',dark)}function cover(pg){var cmd=cmd0(),m=42;wbPdfLine(cmd,pg.title||'Worship Set List',m,86,28,'F2',accent);wbPdfLine(cmd,(pg.items.length)+' song'+(pg.items.length!==1?'s':'')+' - '+(plan.opts.exportFlow==='page'?'One song / page':'Continuous')+' - '+(plan.cols===2?'Two-column':'Single column')+' - '+wbPdfContentLabel(plan.opts),m,118,11,'F2',gray);cmd.push('0.86 0.88 0.90 RG 0.75 w '+m+' '+wbPdfNum(841.89-140)+' m '+wbPdfNum(595.28-m)+' '+wbPdfNum(841.89-140)+' l S\n');var y=174;(pg.items||[]).slice(0,34).forEach(function(it){wbPdfLine(cmd,String(it.n).padStart(2,'0'),m,y,11,'F2','0.58 0.61 0.64');wbPdfLine(cmd,it.title,m+34,y,13,'F1',dark);wbPdfLine(cmd,it.key,595.28-m-28,y,11,'F2',accent);y+=23});pages.push(cmd)}function content(pg){var cmd=cmd0();for(var c=0;c<plan.cols;c++){var x=p.margin+c*(p.colW+p.gap),y=p.margin;(pg.cols[c]||[]).forEach(function(line){drawLine(cmd,line,x,y);y+=wbPdfLineHeight(line,p)})}pages.push(cmd)}(plan.pages||[]).forEach(function(pg){pg.type==='cover'?cover(pg):content(pg)});return wbPdfMake(pages)}
function wbPdfSafeFilename(s){return String(s||'WorshipBase').replace(/[\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,80)||'WorshipBase'}
async function saveCurrentPreviewPdf(){
  var DS=window.WBDataSafetyController||null;
  if(DS&&DS.savePdfPlan)return DS.savePdfPlan({plan:WBExportPlan,buildPlan:wbPdfBuildPlan,planToBlob:wbPdfPlanToBlob,safeFilename:wbPdfSafeFilename,showToast:showToast,document:document});
  var plan=WBExportPlan||wbPdfBuildPlan(),blob=wbPdfPlanToBlob(plan),name=wbPdfSafeFilename(plan.title||'WorshipBase')+' - WorshipBase.pdf',file=null;
  try{if(typeof File!=='undefined')file=new File([blob],name,{type:'application/pdf',lastModified:Date.now()})}catch(e){}
  var ua=(navigator&&navigator.userAgent)||'',isAppleTouch=/iPad|iPhone|iPod/.test(ua)||(navigator&&navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  function fallbackDownload(){
    if(isAppleTouch){try{showToast('PDF share unavailable in this browser')}catch(e){}return;}
    var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.target='_blank';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){try{URL.revokeObjectURL(url)}catch(e){}},60000);showToast('PDF downloaded');
  }
  try{
    // Match the v85 live flow: share the PDF file only, with no title/text/url payload, so iOS does not add an extra webpage/NSItemProvider attachment.
    if(file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      await navigator.share({files:[file]});
      showToast('PDF shared');
      return;
    }
    if(file&&navigator.share&&isAppleTouch){
      await navigator.share({files:[file]});
      showToast('PDF shared');
      return;
    }
  }catch(err){
    if(err&&err.name==='AbortError')return;
    try{console.warn('PDF native share failed',err)}catch(e){}
  }
  fallbackDownload();
}


function installExportControls(){
  var v=qs('export-view');
  if(v&&!v.dataset.ready){
    v.dataset.ready='1';
    v.addEventListener('click',function(e){
      var DSdom=window.WBDataSafetyDomController||null;if(DSdom&&DSdom.handleExportViewClick&&DSdom.handleExportViewClick(e,{closeExportView:closeExportView,openExportPreview:openExportPreview,applyExportPresetState:applyExportPresetState,renderExportView:renderExportView,syncExportControls:syncExportControls,renderExportMiniPreview:renderExportMiniPreview,exportPageState:exportPageState}))return;
      var closeBtn=e.target.closest&&e.target.closest('#export-view-back,#export-view-cancel');
      if(closeBtn){e.preventDefault();closeExportView();return}
      var previewBtn=e.target.closest&&e.target.closest('#export-view-preview-top,#export-view-preview-bottom');
      if(previewBtn){e.preventDefault();openExportPreview();return}
      var preset=e.target.closest&&e.target.closest('[data-export-preset-card]');
      if(preset){e.preventDefault();applyExportPresetState(preset.dataset.exportPresetCard);renderExportView();return}
      var mode=e.target.closest&&e.target.closest('[data-export-mode]');
      if(mode){e.preventDefault();exportPageState.mode=mode.dataset.exportMode;syncExportControls();renderExportMiniPreview();return}
      var flow=e.target.closest&&e.target.closest('[data-export-flow]');
      if(flow){e.preventDefault();exportPageState.flow=flow.dataset.exportFlow;syncExportControls();renderExportMiniPreview();return}
      var cols=e.target.closest&&e.target.closest('[data-export-columns]');
      if(cols){e.preventDefault();exportPageState.columns=cols.dataset.exportColumns;syncExportControls();renderExportMiniPreview();return}
      var size=e.target.closest&&e.target.closest('[data-export-size]');
      if(size){e.preventDefault();exportPageState.size=size.dataset.exportSize;syncExportControls();renderExportMiniPreview();return}
      var flag=e.target.closest&&e.target.closest('[data-export-flag]');
      if(flag){e.preventDefault();var key=flag.dataset.exportFlag;exportPageState.flags[key]=!exportPageState.flags[key];syncExportControls();renderExportMiniPreview();return}
    });
  }
  var back=qs('wb-export-preview-back');
  if(back&&!back.dataset.ready){back.dataset.ready='1';back.addEventListener('click',function(e){e.preventDefault();closeExportPreview()})}
  var save=qs('wb-export-preview-save');
  if(save&&!save.dataset.ready){save.dataset.ready='1';save.addEventListener('click',function(e){e.preventDefault();saveCurrentPreviewPdf()})}
}

function getPlan(){return WBExportPlan;}
function setPlan(plan){WBExportPlan=plan||null;return WBExportPlan;}
function audit(){
  var view=null,preview=null;try{view=qs('export-view');preview=qs('wb-export-pdf-preview-view')}catch(e){}
  return {owner:'WBExportPdfRuntimeController',exportView:!!view,previewView:!!preview,viewOpen:!!(view&&view.classList.contains('visible')),previewOpen:!!(preview&&preview.classList.contains('open')),context:exportPageState.context,preset:exportPageState.preset,mode:exportPageState.mode,flow:exportPageState.flow,columns:exportPageState.columns,size:exportPageState.size,pdfRuntimeContract:pdfRuntimeContract()};
}
function pdfRuntimeContract(){return ['export state and preset transitions','export preview render plan','SVG preview page rendering','PDF blob construction','native share or download save flow','export UI event routing'];}

var api={
  state:exportPageState,
  configure:configure,
  getPlan:getPlan,
  setPlan:setPlan,
  audit:audit,
  pdfRuntimeContract:pdfRuntimeContract,
  applyExportPresetState:applyExportPresetState,
  exportContextToKind:exportContextToKind,
  openExportShell:openExportShell,
  exportCurrentSetShell:exportCurrentSetShell,
  openExportView:openExportView,
  closeExportView:closeExportView,
  exportSubject:exportSubject,
  exportSetItems:exportSetItems,
  exportSongKey:exportSongKey,
  renderExportView:renderExportView,
  syncExportControls:syncExportControls,
  renderExportMiniPreview:renderExportMiniPreview,
  exportDisplayChord:exportDisplayChord,
  escapeTextWithSpaces:escapeTextWithSpaces,
  wbExportOptions:wbExportOptions,
  wbPdfSafe:wbPdfSafe,
  wbPdfEsc:wbPdfEsc,
  wbPdfSongCode:wbPdfSongCode,
  wbPdfThemeHex:wbPdfThemeHex,
  wbPdfRgb:wbPdfRgb,
  wbPdfIsChordToken:wbPdfIsChordToken,
  wbPdfIsSectionLine:wbPdfIsSectionLine,
  wbPdfSectionName:wbPdfSectionName,
  wbPdfChordOnly:wbPdfChordOnly,
  wbPdfChordTokenCandidatesAt:wbPdfChordTokenCandidatesAt,
  wbPdfSplitChordCluster:wbPdfSplitChordCluster,
  wbPdfNormalizeChordLineSpacing:wbPdfNormalizeChordLineSpacing,
  wbPdfLastChordIndex:wbPdfLastChordIndex,
  wbPdfChordSlotFree:wbPdfChordSlotFree,
  wbPdfPlaceChord:wbPdfPlaceChord,
  wbPdfTransposeChord:wbPdfTransposeChord,
  wbPdfTransposeLine:wbPdfTransposeLine,
  wbPdfInlinePair:wbPdfInlinePair,
  wbPdfChordLyricPair:wbPdfChordLyricPair,
  wbPdfWrapText:wbPdfWrapText,
  wbPdfWrapPair:wbPdfWrapPair,
  wbPdfProfile:wbPdfProfile,
  wbPdfLineHeight:wbPdfLineHeight,
  wbPdfBlockHeight:wbPdfBlockHeight,
  wbPdfAddPairBlocks:wbPdfAddPairBlocks,
  wbPdfSongBlocks:wbPdfSongBlocks,
  wbPdfBuildPlan:wbPdfBuildPlan,
  wbPdfInstallStyle:wbPdfInstallStyle,
  wbPdfSvgText:wbPdfSvgText,
  wbPdfSvgRect:wbPdfSvgRect,
  wbPdfSvgLine:wbPdfSvgLine,
  wbPdfRenderPlan:wbPdfRenderPlan,
  openExportPreview:openExportPreview,
  closeExportPreview:closeExportPreview,
  wbPdfNum:wbPdfNum,
  wbPdfStr:wbPdfStr,
  wbPdfMake:wbPdfMake,
  wbPdfLine:wbPdfLine,
  wbPdfRect:wbPdfRect,
  wbPdfPlanToBlob:wbPdfPlanToBlob,
  wbPdfSafeFilename:wbPdfSafeFilename,
  saveCurrentPreviewPdf:saveCurrentPreviewPdf,
  installExportControls:installExportControls
};
Object.keys(api).forEach(function(key){var fn=api[key];if(typeof fn==='function'&&key!=='configure'){api[key]=function(){syncBridgeState();return fn.apply(api,arguments);};}});
root.WBExportPdfRuntimeController=api;
})(window);
