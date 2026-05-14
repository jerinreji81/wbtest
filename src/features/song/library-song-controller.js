/* WorshipBase Phase 2b - I1 Library/Song extraction boundary.
   Owns library song filtering, search match scoring, recents/alpha models, and row/render HTML while the legacy shell remains host. */
(function(root){
'use strict';

function fallbackEsc(value){
  return String(value == null ? '' : value).replace(/[&<>"]/g,function(ch){
    return ch==='&'?'&amp;':ch==='<'?'&lt;':ch==='>'?'&gt;':'&quot;';
  });
}
function esc(value,ctx){
  return ctx&&ctx.escape?ctx.escape(value):fallbackEsc(value);
}
function firstLetter(song,ctx){
  if(ctx&&ctx.firstLetter)return ctx.firstLetter(song);
  var title=String(song&&song.title||'').trim();
  if(!title)return '#';
  var ch=title.charAt(0).toUpperCase();
  return /[A-Z]/.test(ch)?ch:'1';
}
function titleCompare(a,b){
  return String((a&&a.title)||'').localeCompare(String((b&&b.title)||''));
}
function songCode(song,ctx){
  if(ctx&&ctx.songCode)return ctx.songCode(song);
  return song&&song.code?song.code:'';
}
function normalizeSearchText(value){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9# +/.-]+/g,' ').replace(/\s+/g,' ').trim();
}
function stripChartText(text){
  return String(text||'').replace(/\[[^\]]+\]/g,' ').replace(/\s+/g,' ').trim();
}
function textMatchesQuery(text,query){
  return normalizeSearchText(text).indexOf(normalizeSearchText(query))>=0;
}
function buildLyricSnippet(song,query){
  var plain=stripChartText(song&&song.chart||'');
  if(!plain)return '';
  var nPlain=normalizeSearchText(plain);
  var nq=normalizeSearchText(query);
  var idx=nPlain.indexOf(nq);
  if(idx<0)return '';
  var start=Math.max(0,idx-48);
  var end=Math.min(plain.length,idx+String(query||'').length+82);
  var snip=plain.slice(start,end).trim();
  return (start>0?'…':'')+snip+(end<plain.length?'…':'');
}
function highlightSearchHTML(text,query,ctx){
  var raw=String(text||'');
  var nq=String(query||'').trim();
  if(!nq)return esc(raw,ctx);
  var i=raw.toLowerCase().indexOf(nq.toLowerCase());
  if(i<0)return esc(raw,ctx);
  return esc(raw.slice(0,i),ctx)+'<span class="match-mark">'+esc(raw.slice(i,i+nq.length),ctx)+'</span>'+esc(raw.slice(i+nq.length),ctx);
}
function getSongSearchMatch(song,query,ctx){
  query=String(query||'').trim();
  if(!query)return null;
  ctx=ctx||{};
  var scope=ctx.scope||'smart';
  var title=song&&song.title||'';
  var artist=song&&song.artist||'';
  var code=songCode(song,ctx);
  var lyrics=stripChartText(song&&song.chart||'');
  var titleHit=textMatchesQuery(title,query);
  var artistHit=textMatchesQuery(artist,query);
  var codeHit=textMatchesQuery(code,query);
  var lyricHit=textMatchesQuery(lyrics,query);
  if(scope==='title'&&!(titleHit||codeHit))return null;
  if(scope==='artist'&&!artistHit)return null;
  if(scope==='lyrics'){
    if(!lyricHit)return null;
    titleHit=false;artistHit=false;codeHit=false;
  }
  if(scope==='smart'&&!titleHit&&!artistHit&&!codeHit&&!lyricHit)return null;
  var score=0;
  var type='Lyric';
  if(titleHit){score=4000;type='Title'}
  else if(artistHit){score=3000;type='Artist'}
  else if(codeHit){score=2600;type='ID'}
  else if(lyricHit){score=1800;type='Lyric'}
  if(normalizeSearchText(title)===normalizeSearchText(query))score+=500;
  else if(normalizeSearchText(title).indexOf(normalizeSearchText(query))===0)score+=260;
  if(artistHit)score+=60;
  if(codeHit)score+=40;
  return {query:query,score:score,type:type,snippet:(scope==='title'||scope==='artist')?'':buildLyricSnippet(song,query)};
}
function passesLibraryFilter(song,filter){
  filter=filter||'all';
  if(filter==='english'&&song.cat!=='english')return false;
  if(filter==='malayalam'&&song.cat!=='malayalam')return false;
  if(filter==='favorites'&&!song.favorite)return false;
  if(filter==='inset'&&!song.inSet)return false;
  if(filter==='mine'&&song.source!=='local')return false;
  return true;
}
function filteredSongRows(songs,state,ctx){
  state=state||{};
  ctx=ctx||{};
  var query=String(state.query||'').trim();
  var filter=state.filter||'all';
  var base=(songs||[]).filter(function(song){return passesLibraryFilter(song,filter)});
  if(query){
    return base.map(function(song){return {song:song,match:getSongSearchMatch(song,query,{scope:state.scope||'smart',songCode:ctx.songCode})};})
      .filter(function(row){return !!row.match})
      .sort(function(a,b){return b.match.score-a.match.score||titleCompare(a.song,b.song)});
  }
  return base.slice().sort(titleCompare).map(function(song){return {song:song,match:null};});
}
function filteredSongs(songs,state,ctx){
  return filteredSongRows(songs,state,ctx).map(function(row){return row.song});
}
function filteredTotal(songs,state){
  var filter=(state&&state.filter)||'all';
  return (songs||[]).filter(function(song){return passesLibraryFilter(song,filter)}).length;
}
function recentSongs(recentIds,songs,limit){
  limit=limit||6;
  return (recentIds||[]).map(function(id){
    return (songs||[]).find(function(song){return song&&song.id===id});
  }).filter(Boolean).slice(0,limit);
}
function alphaLetters(list,ctx){
  var seen={};
  var letters=[];
  (list||[]).forEach(function(song){
    var letter=firstLetter(song,ctx);
    if(!seen[letter]){seen[letter]=1;letters.push(letter)}
  });
  return letters.sort(function(a,b){
    if(a==='1')return -1;
    if(b==='1')return 1;
    return a.localeCompare(b);
  });
}
function musicIcon(){
  return '<svg fill="none" viewBox="0 0 24 24"><path d="M9 18V6.8l9-1.8v10.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="18" r="2.4" stroke="currentColor" stroke-width="1.8"/><circle cx="16" cy="16" r="2.4" stroke="currentColor" stroke-width="1.8"/></svg>';
}
function heartIcon(on){
  return '<svg viewBox="0 0 24 24" fill="'+(on?'currentColor':'none')+'"><path d="M20.8 5.9a5.1 5.1 0 0 0-7.2 0L12 7.5l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 22l8.8-8.9a5.1 5.1 0 0 0 0-7.2Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>';
}
function songRowHtml(song,match,ctx){
  ctx=ctx||{};
  var query=(match&&match.query)||'';
  var rowScope=(ctx.state&&ctx.state.scope)||ctx.scope||'';
  var titleQuery=rowScope==='lyrics'?'':query;
  var manage=!!ctx.manageMode;
  var selected=!!(ctx.manageSelectedIds||[]).includes(song.id);
  var snippet=(match&&match.snippet)?'<div class="song-snippet"><span class="song-match-label">'+esc(match.type||'Lyric',ctx)+'</span>'+highlightSearchHTML(match.snippet,query,ctx)+'</div>':'';
  var cls=snippet?' search-result':'';
  var copyIcon='<svg viewBox="0 0 17 17"><rect x="6" y="1" width="10" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><rect x="1" y="4" width="10" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/></svg>';
  var addIcon='<svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.5"/></svg>';
  var manageSelect=manage?'<button class="manage-select-circle '+(selected?'selected':'')+'" data-manage-select="'+esc(song.id,ctx)+'" type="button" aria-label="'+(selected?'Deselect':'Select')+' song">'+(selected?'<svg viewBox="0 0 20 20"><path d="M5 10.5l3.2 3.1L15.5 6"/></svg>':'')+'</button>':'';
  return '<div class="song-row-wrap'+cls+'" data-alpha-row="'+esc(firstLetter(song,ctx),ctx)+'"><button class="song-row-reveal-l" data-song-swipe-action="copy" data-song-id="'+esc(song.id,ctx)+'" type="button" aria-label="Copy lyrics">'+copyIcon+'<span class="rv-lbl">Copy</span></button><button class="song-row-reveal-r" data-song-swipe-action="add" data-song-id="'+esc(song.id,ctx)+'" type="button" aria-label="Add to set">'+addIcon+'<span class="rv-lbl">Add</span></button><div class="song-item'+cls+(manage?' manage-mode-row':'')+'" role="button" tabindex="0" data-song-id="'+esc(song.id,ctx)+'">'+manageSelect+'<div class="song-avatar">'+musicIcon()+'</div><div class="song-info"><div class="song-title-row"><div class="song-title">'+(titleQuery?highlightSearchHTML(song.title,titleQuery,ctx):esc(song.title,ctx))+'</div>'+(song.inSet?'<span class="in-set-pill">In Set</span>':'')+'</div><div class="song-meta">'+(titleQuery?highlightSearchHTML(song.artist||'Unknown',titleQuery,ctx):esc(song.artist||'Unknown',ctx))+' · <span class="song-id-badge">'+esc(songCode(song,ctx),ctx)+'</span></div>'+snippet+'</div><button class="song-fav-btn '+(song.favorite?'on':'')+'" type="button" aria-label="Favourite">'+heartIcon(song.favorite)+'</button></div></div>';
}
function recentsHtml(recentIds,songs,ctx){
  return recentSongs(recentIds,songs,6).map(function(song){
    return '<button class="recent-song-card" data-song-id="'+esc(song.id,ctx)+'" type="button"><div class="recent-song-title">'+esc(song.title,ctx)+'</div><div class="recent-song-meta">'+esc(song.artist,ctx)+' · '+esc(song.key,ctx)+' · '+esc(songCode(song,ctx),ctx)+'</div></button>';
  }).join('');
}
function alphaHtml(list,ctx){
  return alphaLetters(list,ctx).map(function(letter){
    return '<div class="alpha-letter available" data-alpha="'+esc(letter,ctx)+'">'+esc(letter,ctx)+'</div>';
  }).join('');
}
function emptyHtml(title,sub){
  return '<div class="library-empty"><div class="library-empty-title">'+fallbackEsc(title)+'</div><div class="library-empty-sub">'+fallbackEsc(sub)+'</div></div>';
}
function libraryInnerHtml(rows,state,ctx){
  state=state||{};
  var query=String(state.query||'').trim();
  if(query){
    return rows.length?rows.map(function(row){return songRowHtml(row.song,row.match,ctx)}).join(''):emptyHtml('No songs found','Try another search or filter.');
  }
  var groups={};
  rows.forEach(function(row){
    var song=row.song;
    songCode(song,ctx);
    var letter=firstLetter(song,ctx);
    (groups[letter]||(groups[letter]=[])).push(row);
  });
  var keys=Object.keys(groups).sort(function(a,b){return a.localeCompare(b)});
  if(keys.length){
    return keys.map(function(letter){
      return '<div class="alpha-sep" data-group="'+esc(letter,ctx)+'">'+esc(letter,ctx)+'</div>'+groups[letter].map(function(row){return songRowHtml(row.song,row.match,ctx)}).join('');
    }).join('');
  }
  return ctx&&ctx.waitingForSongs?emptyHtml('Loading songs…','Syncing your library.'):emptyHtml('No songs yet','Add or import songs to build the library.');
}
function renderLibraryModel(options){
  options=options||{};
  var state=options.state||{};
  var songs=options.songs||[];
  var ctx=options.context||{};
  var rows=filteredSongRows(songs,state,ctx);
  var list=rows.map(function(row){return row.song});
  var query=String(state.query||'').trim();
  var total=filteredTotal(songs,state);
  var waitingForSongs=!rows.length&&!query&&!!options.waitingForSongs;
  var renderCtx=Object.assign({},ctx,{waitingForSongs:waitingForSongs});
  return {
    rows:rows,
    list:list,
    filteredTotal:total,
    query:query,
    countText:query?(rows.length+'/'+total):(total+' '+(total===1?'song':'songs')),
    countClasses:query?(rows.length?['wb-search-active']:['wb-search-none']):[],
    recents:recentSongs(options.recentIds||[],songs,6),
    recentsHtml:recentsHtml(options.recentIds||[],songs,ctx),
    alphaHtml:alphaHtml(list,ctx),
    libraryHtml:libraryInnerHtml(rows,state,renderCtx)
  };
}
function syncFilterChips(row,state,qsa){
  if(!row)return;
  state=state||{};
  var current=state.filter||'all';
  var found=false;
  var finder=qsa||function(selector,scope){return Array.prototype.slice.call((scope||document).querySelectorAll(selector));};
  finder('.filter-chip',row).forEach(function(chip){
    var on=chip.dataset.filter===current;
    chip.classList.toggle('active',on);
    if(on)found=true;
  });
  if(!found){
    state.filter='all';
    finder('.filter-chip',row).forEach(function(chip){chip.classList.toggle('active',chip.dataset.filter==='all')});
  }
}
function renderContract(){
  return {
    owner:'WBLibrarySongController',
    phase:'Phase 2b - I1',
    owns:['library filters','search match scoring','recents HTML','alpha strip HTML','song row HTML','library empty/loading states'],
    host:'src/legacy/index.phase-d.html remains temporary DOM/event host'
  };
}

root.WBLibrarySongController={
  normalizeSearchText:normalizeSearchText,
  stripChartText:stripChartText,
  textMatchesQuery:textMatchesQuery,
  buildLyricSnippet:buildLyricSnippet,
  highlightSearchHTML:highlightSearchHTML,
  getSongSearchMatch:getSongSearchMatch,
  passesLibraryFilter:passesLibraryFilter,
  filteredSongRows:filteredSongRows,
  filteredSongs:filteredSongs,
  filteredTotal:filteredTotal,
  recentSongs:recentSongs,
  alphaLetters:alphaLetters,
  songRowHtml:songRowHtml,
  recentsHtml:recentsHtml,
  alphaHtml:alphaHtml,
  renderLibraryModel:renderLibraryModel,
  syncFilterChips:syncFilterChips,
  renderContract:renderContract
};
})(window);
