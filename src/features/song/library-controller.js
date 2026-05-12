/* WorshipBase Phase 2b - I1 Library/Song extraction boundary owner.
   Owns Library search, filter, list render model, recent-song/alpha-strip render output, and song code helpers.
   The legacy shell remains the temporary host and delegates into this owner through compatibility wrappers. */
(function(root){
'use strict';

function fallbackEsc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}
function normalizeSearchText(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9# +/.-]+/g,' ').replace(/\s+/g,' ').trim();}
function stripChartText(text){return String(text||'').replace(/\[[^\]]+\]/g,' ').replace(/\s+/g,' ').trim();}
function textMatchesQuery(text,q){return normalizeSearchText(text).indexOf(normalizeSearchText(q))>=0;}
function buildLyricSnippet(song,q){
  var plain=stripChartText(song&&song.chart||'');
  if(!plain)return '';
  var nPlain=normalizeSearchText(plain),nq=normalizeSearchText(q),idx=nPlain.indexOf(nq);
  if(idx<0)return '';
  var start=Math.max(0,idx-48),end=Math.min(plain.length,idx+String(q||'').length+82);
  var snip=plain.slice(start,end).trim();
  return (start>0?'…':'')+snip+(end<plain.length?'…':'');
}
function highlightSearchHTML(text,q,escapeFn){
  var esc=escapeFn||fallbackEsc,raw=String(text||''),nq=String(q||'').trim();
  if(!nq)return esc(raw);
  var i=raw.toLowerCase().indexOf(nq.toLowerCase());
  if(i<0)return esc(raw);
  return esc(raw.slice(0,i))+'<span class="match-mark">'+esc(raw.slice(i,i+nq.length))+'</span>'+esc(raw.slice(i+nq.length));
}
function songCode(song,songs){
  song=song||{};
  if(!song.code){
    var list=Array.isArray(songs)?songs:[];
    song.code='S'+String(Math.max(1,list.indexOf(song)+1)).padStart(3,'0');
  }
  return song.code;
}
function getSongSearchMatch(song,q,ctx){
  ctx=ctx||{};song=song||{};q=String(q||'').trim();
  if(!q)return null;
  var title=song.title||'',artist=song.artist||'',code=(ctx.songCode||songCode)(song),lyrics=stripChartText(song.chart||''),scope=(ctx.state&&ctx.state.scope)||ctx.scope||'smart';
  var titleHit=textMatchesQuery(title,q),artistHit=textMatchesQuery(artist,q),codeHit=textMatchesQuery(code,q),lyricHit=textMatchesQuery(lyrics,q);
  if(scope==='title'&&!(titleHit||codeHit))return null;
  if(scope==='artist'&&!artistHit)return null;
  if(scope==='lyrics'&&!lyricHit)return null;
  if(scope==='smart'&&!titleHit&&!artistHit&&!codeHit&&!lyricHit)return null;
  var score=0,type='Lyric';
  if(titleHit){score=4000;type='Title';}
  else if(artistHit){score=3000;type='Artist';}
  else if(codeHit){score=2600;type='ID';}
  else if(lyricHit){score=1800;type='Lyric';}
  if(normalizeSearchText(title)===normalizeSearchText(q))score+=500;
  else if(normalizeSearchText(title).indexOf(normalizeSearchText(q))===0)score+=260;
  if(artistHit)score+=60;
  if(codeHit)score+=40;
  return {query:q,score:score,type:type,snippet:(scope==='title'||scope==='artist')?'':buildLyricSnippet(song,q)};
}
function passesLibraryFilter(song,filter){
  song=song||{};filter=filter||'all';
  if(filter==='english'&&song.cat!=='english')return false;
  if(filter==='malayalam'&&song.cat!=='malayalam')return false;
  if(filter==='favorites'&&!song.favorite)return false;
  if(filter==='inset'&&!song.inSet)return false;
  if(filter==='mine'&&song.source!=='local')return false;
  return true;
}
function filteredSongRows(ctx){
  ctx=ctx||{};
  var state=ctx.state||{},list=(ctx.songs||root.songs||[]).slice(),q=String(state.query||ctx.query||'').trim(),filter=state.filter||ctx.filter||'all';
  var codeFn=ctx.songCode||function(s){return songCode(s,ctx.songs||root.songs||[])};
  var base=list.filter(function(s){return passesLibraryFilter(s,filter)});
  if(q){
    return base.map(function(s){return {song:s,match:getSongSearchMatch(s,q,{state:state,scope:state.scope,songCode:codeFn})};})
      .filter(function(x){return !!x.match;})
      .sort(function(a,b){return b.match.score-a.match.score||String(a.song.title||'').localeCompare(String(b.song.title||''));});
  }
  return base.sort(function(a,b){return String(a.title||'').localeCompare(String(b.title||''));}).map(function(s){return {song:s,match:null};});
}
function filteredSongs(ctx){return filteredSongRows(ctx).map(function(x){return x.song;});}
function syncFilterChips(ctx){
  ctx=ctx||{};
  var qs=ctx.qs||function(){return null},qsa=ctx.qsa||function(){return []},state=ctx.state||{};
  var row=qs('library-filter-row');
  if(!row)return;
  var current=state.filter||'all',found=false;
  qsa('.filter-chip',row).forEach(function(chip){
    var on=chip.dataset.filter===current;
    chip.classList.toggle('active',on);
    if(on)found=true;
  });
  if(!found){
    state.filter='all';
    qsa('.filter-chip',row).forEach(function(chip){chip.classList.toggle('active',chip.dataset.filter==='all');});
  }
}
function recentSongsHtml(recentIds,songs,ctx){
  ctx=ctx||{};var esc=ctx.esc||fallbackEsc,codeFn=ctx.songCode||function(s){return songCode(s,songs)};
  var recents=(recentIds||[]).map(function(id){return (songs||[]).find(function(s){return s.id===id;});}).filter(Boolean).slice(0,6);
  return recents.map(function(s){return '<button class="recent-song-card" data-song-id="'+esc(s.id)+'" type="button"><div class="recent-song-title">'+esc(s.title)+'</div><div class="recent-song-meta">'+esc(s.artist)+' · '+esc(s.key)+' · '+esc(codeFn(s))+'</div></button>';}).join('');
}
function renderRecents(ctx){
  ctx=ctx||{};var qs=ctx.qs||function(){return null};
  var r=qs('recent-songs-scroll'),section=qs('recent-songs-section');
  if(!r||!section)return;
  var html=recentSongsHtml(ctx.recentIds||[],ctx.songs||[],ctx);
  if(!html){section.style.display='none';r.innerHTML='';return;}
  section.style.display='block';r.innerHTML=html;
}
function alphaLetters(list,ctx){
  ctx=ctx||{};var firstLetter=ctx.firstLetter||function(song){var c=String(song&&song.title||'#').trim().charAt(0).toUpperCase();return /^[A-Z0-9]$/.test(c)?c:'#';};
  var seen={},letters=[];
  (list||[]).forEach(function(s){var l=firstLetter(s);if(!seen[l]){seen[l]=1;letters.push(l);}});
  letters.sort(function(a,b){if(a==='1')return -1;if(b==='1')return 1;return a.localeCompare(b);});
  return letters;
}
function alphaStripHtml(list,ctx){
  ctx=ctx||{};var esc=ctx.esc||fallbackEsc;
  return alphaLetters(list,ctx).map(function(l){return '<div class="alpha-letter available" data-alpha="'+esc(l)+'">'+esc(l)+'</div>';}).join('');
}
function renderAlpha(list,ctx){
  ctx=ctx||{};var qs=ctx.qs||function(){return null},host=qs('alpha-strip');
  if(host)host.innerHTML=alphaStripHtml(list,ctx);
}
function songRowHtml(song,match,ctx){
  ctx=ctx||{};song=song||{};
  var esc=ctx.esc||fallbackEsc,firstLetter=ctx.firstLetter||function(s){var c=String(s&&s.title||'#').trim().charAt(0).toUpperCase();return /^[A-Z0-9]$/.test(c)?c:'#';};
  var musicIcon=ctx.musicIcon||function(){return '';},heartIcon=ctx.heartIcon||function(){return '';};
  var q=(match&&match.query)||'',manage=!!(ctx.adminUnlocked&&ctx.manageMode),selected=(ctx.manageSelectedIds||[]).indexOf(song.id)>=0;
  var snippet=(match&&match.snippet)?'<div class="song-snippet"><span class="song-match-label">'+esc(match.type||'Lyric')+'</span>'+highlightSearchHTML(match.snippet,q,esc)+'</div>':'';
  var cls=snippet?' search-result':'';
  var copyIcon='<svg viewBox="0 0 17 17"><rect x="6" y="1" width="10" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><rect x="1" y="4" width="10" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/></svg>';
  var addIcon='<svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.5"/></svg>';
  var manageSelect=manage?'<button class="manage-select-circle '+(selected?'selected':'')+'" data-manage-select="'+esc(song.id)+'" type="button" aria-label="'+(selected?'Deselect':'Select')+' song">'+(selected?'<svg viewBox="0 0 20 20"><path d="M5 10.5l3.2 3.1L15.5 6"/></svg>':'')+'</button>':'';
  return '<div class="song-row-wrap'+cls+'" data-alpha-row="'+esc(firstLetter(song))+'"><button class="song-row-reveal-l" data-song-swipe-action="copy" data-song-id="'+esc(song.id)+'" type="button" aria-label="Copy lyrics">'+copyIcon+'<span class="rv-lbl">Copy</span></button><button class="song-row-reveal-r" data-song-swipe-action="add" data-song-id="'+esc(song.id)+'" type="button" aria-label="Add to set">'+addIcon+'<span class="rv-lbl">Add</span></button><div class="song-item'+cls+(manage?' manage-mode-row':'')+'" role="button" tabindex="0" data-song-id="'+esc(song.id)+'">'+manageSelect+'<div class="song-avatar">'+musicIcon()+'</div><div class="song-info"><div class="song-title-row"><div class="song-title">'+(q?highlightSearchHTML(song.title,q,esc):esc(song.title))+'</div>'+(song.inSet?'<span class="in-set-pill">In Set</span>':'')+'</div><div class="song-meta">'+(q?highlightSearchHTML(song.artist||'Unknown',q,esc):esc(song.artist||'Unknown'))+' · <span class="song-id-badge">'+esc((ctx.songCode||songCode)(song))+'</span></div>'+snippet+'</div><button class="song-fav-btn '+(song.favorite?'on':'')+'" type="button" aria-label="Favourite">'+heartIcon(song.favorite)+'</button></div></div>';
}
function emptyStateHtml(kind){
  if(kind==='search')return '<div class="library-empty"><div class="library-empty-title">No songs found</div><div class="library-empty-sub">Try another search or filter.</div></div>';
  if(kind==='loading')return '<div class="library-empty"><div class="library-empty-title">Loading songs…</div><div class="library-empty-sub">Syncing your library.</div></div>';
  return '<div class="library-empty"><div class="library-empty-title">No songs yet</div><div class="library-empty-sub">Add or import songs to build the library.</div></div>';
}
function groupRows(rows,ctx){
  ctx=ctx||{};var firstLetter=ctx.firstLetter||function(song){var c=String(song&&song.title||'#').trim().charAt(0).toUpperCase();return /^[A-Z0-9]$/.test(c)?c:'#';};
  var groups={};
  (rows||[]).forEach(function(x){var s=x.song;(ctx.songCode||songCode)(s);var l=firstLetter(s);(groups[l]||(groups[l]=[])).push(x);});
  return groups;
}
function libraryListHtml(rows,ctx){
  ctx=ctx||{};var state=ctx.state||{},q=String(state.query||'').trim();
  if(q)return rows.length?rows.map(function(x){return songRowHtml(x.song,x.match,ctx);}).join(''):emptyStateHtml('search');
  var groups=groupRows(rows,ctx),keys=Object.keys(groups).sort(function(a,b){return a.localeCompare(b);});
  if(keys.length){
    return keys.map(function(k){return '<div class="alpha-sep" data-group="'+(ctx.esc||fallbackEsc)(k)+'">'+(ctx.esc||fallbackEsc)(k)+'</div>'+groups[k].map(function(x){return songRowHtml(x.song,x.match,ctx);}).join('');}).join('');
  }
  return emptyStateHtml(ctx.waitingForSongs?'loading':'empty');
}
function renderLibrary(ctx){
  ctx=ctx||{};
  var qs=ctx.qs||function(){return null},state=ctx.state||{},songs=ctx.songs||[],count=qs('song-count'),vinner=qs('vinner');
  syncFilterChips(ctx);
  var rows=ctx.rows||filteredSongRows(ctx),list=rows.map(function(x){return x.song;}),q=String(state.query||'').trim(),filteredTotal=songs.filter(function(s){return passesLibraryFilter(s,state.filter||'all');}).length;
  if(count){
    count.classList.remove('wb-search-active','wb-search-none');
    count.textContent=q?(rows.length+'/'+filteredTotal):(filteredTotal+' '+(filteredTotal===1?'song':'songs'));
    if(q)count.classList.add(rows.length?'wb-search-active':'wb-search-none');
  }
  renderRecents(ctx);
  renderAlpha(list,ctx);
  ctx.waitingForSongs=!list.length&&ctx.firebaseRuntime&&!ctx.firebaseRuntime.songsSettled&&!!(typeof ctx.hasCloudConfig==='function'?ctx.hasCloudConfig():ctx.hasCloudConfig);
  if(vinner)vinner.innerHTML=libraryListHtml(rows,ctx);
  if(typeof ctx.syncManageToolbar==='function')ctx.syncManageToolbar();
}
function renderContract(){return {phase:'Phase 2b - I1',owner:'WBLibraryController',contracts:['normalizeSearchText','filteredSongRows','songRowHtml','recentSongsHtml','alphaStripHtml','libraryListHtml','renderLibrary'],legacyShellHost:true,nonDestructive:true};}

root.WBLibraryController={
  normalizeSearchText:normalizeSearchText,
  stripChartText:stripChartText,
  textMatchesQuery:textMatchesQuery,
  buildLyricSnippet:buildLyricSnippet,
  highlightSearchHTML:highlightSearchHTML,
  getSongSearchMatch:getSongSearchMatch,
  passesLibraryFilter:passesLibraryFilter,
  filteredSongRows:filteredSongRows,
  filteredSongs:filteredSongs,
  songCode:songCode,
  syncFilterChips:syncFilterChips,
  recentSongsHtml:recentSongsHtml,
  renderRecents:renderRecents,
  alphaLetters:alphaLetters,
  alphaStripHtml:alphaStripHtml,
  renderAlpha:renderAlpha,
  songRowHtml:songRowHtml,
  groupRows:groupRows,
  libraryListHtml:libraryListHtml,
  emptyStateHtml:emptyStateHtml,
  renderLibrary:renderLibrary,
  renderContract:renderContract,
  diagnostics:renderContract
};
})(window);
