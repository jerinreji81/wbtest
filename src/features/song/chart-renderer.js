/* WorshipBase Phase H.1 chart renderer owner.
   Owns section detection, chord token parsing, transposition/NNS helpers, and chart-to-HTML rendering adapters.
   Visual CSS and song-view DOM ownership remain in the legacy shell until later Phase H steps. */
(function(root){
'use strict';

function fallbackEsc(v){
  return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
}

function createAdapter(deps){
  deps=deps||{};
  var esc=deps.esc||fallbackEsc;
  var keyRootName=deps.keyRootName||function(v){return String(v||'').replace(/m$/,'')};
  var getState=deps.getState||function(){return root.state||{}};
  var getSettings=deps.getSettings||function(){return root.settings||{}};
  var escapeTextWithSpaces=deps.escapeTextWithSpaces||function(t){return esc(t).replace(/ /g,'&nbsp;')};
  var screenPairCols=deps.screenPairCols||function(){return 56};
  var wrapAlignedPairForScreen=deps.wrapAlignedPairForScreen||function(chord,lyric){return [{c:String(chord||''),l:String(lyric||'')}];};

  function settings(){return getSettings()||{}}
  function state(){return getState()||{}}

  function isChordToken(token){
    return /^([A-G](?:#|b)?)(?:maj|major|min|minor|m|aug|dim|sus2|sus4|sus|add(?:2|4|9|11|13)?|no(?:3|5)?|ø|[b#](?:5|9|11|13)|2|4|5|6|7|9|11|13)*(?:\/[A-G](?:#|b)?)?$/i.test(String(token||'').replace(/[|,;]/g,''));
  }

  function isSectionTag(raw){
    var t=String(raw||'').trim();
    if(!t)return false;
    t=t.replace(/^\[|\]$/g,'').trim();
    if(!t)return false;
    if(isChordToken(t))return false;
    if(/^([A-G](?:#|b)?)(?:maj|major|min|minor|m|aug|dim|sus2|sus4|sus|add(?:2|4|9|11|13)?|no(?:3|5)?|ø|[b#](?:5|9|11|13)|2|4|5|6|7|9|11|13)*(?:\/[A-G](?:#|b)?)?$/i.test(t))return false;
    return true;
  }

  function sectionTextFromLine(line){
    var t=String(line||'').trim();
    if(t.charAt(0)==='[')return t.replace(/^\[|\]$/g,'').trim();
    return t.replace(/^#{1,3}\s*/,'').trim();
  }

  function getSectionMetaFromText(text,occurrenceMap){
    text=String(text||'').trim();
    var low=text.toLowerCase(),key=low.replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'section',short=text.toUpperCase().slice(0,4),m;
    if((m=low.match(/^intro(?:\s+(\d+))?$/))){key='intro'+(m[1]?'-'+m[1]:'');short='I'+(m[1]||'');}
    else if((m=low.match(/^verse(?:\s+(\d+))?$/))){key='verse'+(m[1]?'-'+m[1]:'');short='V'+(m[1]||'');}
    else if((m=low.match(/^pre[ -]?chorus(?:\s+(\d+))?$/))){key='pre-chorus'+(m[1]?'-'+m[1]:'');short='PC'+(m[1]||'');}
    else if((m=low.match(/^chorus(?:\s+(\d+))?$/))){key='chorus';short='C';}
    else if((m=low.match(/^bridge(?:\s+(\d+))?$/))){key='bridge'+(m[1]?'-'+m[1]:'');short='B'+(m[1]||'');}
    else if((m=low.match(/^tag(?:\s+(\d+))?$/))){key='tag'+(m[1]?'-'+m[1]:'');short='T'+(m[1]||'');}
    else if((m=low.match(/^(?:outro|ending|end)(?:\s+(\d+))?$/))){key='outro'+(m[1]?'-'+m[1]:'');short='O'+(m[1]||'');}
    else if((m=low.match(/^refrain(?:\s+(\d+))?$/))){key='refrain';short='R';}
    else if((m=low.match(/^instrumental(?:\s+(\d+))?$/))){key='instrumental'+(m[1]?'-'+m[1]:'');short='INS';}
    else {var initials=text.split(/\s+/).filter(Boolean).map(function(w){return w.charAt(0)}).join('').toUpperCase();short=(initials||text.toUpperCase()).slice(0,4);}
    if(key==='verse'&&short==='V'&&occurrenceMap){occurrenceMap.verse=(occurrenceMap.verse||0)+1;key='verse-'+occurrenceMap.verse;short='V'+occurrenceMap.verse;}
    return {key:key,short:short,text:text};
  }

  function lineLooksChord(line){
    var t=String(line||'').trim();if(!t)return false;
    if(/\[[A-G][b#]?[^\]]*\]/.test(t)&&t.replace(/\[[^\]]*\]/g,'').trim().length===0)return true;
    if(/^\[[^\]]+\]$/.test(t)&&isSectionTag(t))return false;
    var wo=t.replace(/[A-G][b#]?(?:maj|major|min|minor|m|aug|dim|sus2|sus4|sus|add(?:2|4|9|11|13)?|no(?:3|5)?|ø|[b#](?:5|9|11|13)|2|4|5|6|7|9|11|13)*(?:\/[A-G][b#]?)?/g,'').trim();
    return /[A-G][b#]?/.test(t)&&wo.replace(/[\s|\-\/]/g,'').length<t.replace(/\s/g,'').length*0.4;
  }

  function chordPositionsFromLine(chordLine){var out=[];String(chordLine||'').replace(/\S+/g,function(m,off){out.push({text:m,pos:off});return m});return out;}
  function cleanChordToken(token){return String(token||'').trim().replace(/[|,;]/g,'').replace(/^[^\w#b]+|[^\w#b/]+$/g,'')}
  function renderChordTokenLineHtml(line){
    return esc(String(line||'')).replace(/([A-G](?:#|b)?(?:(?:maj|major|min|minor|m|aug|dim|sus2|sus4|sus|add(?:2|4|9|11|13)?|no(?:3|5)?|ø|[b#](?:5|9|11|13)|\/[A-G](?:#|b)?|[0-9])*)?)/g,function(m){
      return isChordToken(m)?'<span class="chord-token">'+m+'</span>':m;
    });
  }
  function renderScreenPairRows(rows){
    return rows.map(function(r){
      var chordHtml=r.c?'<div class="chord-row">'+renderChordTokenLineHtml(r.c)+'</div>':'';
      var lyricHtml=r.l?'<div class="lyric-row">'+esc(r.l)+'</div>':'';
      return '<div class="lyric-block wb-chord-pair">'+chordHtml+lyricHtml+'</div>';
    }).join('');
  }
  function renderScreenChordOnlyRows(rows){
    return rows.map(function(r){return '<div class="lyric-block wb-chord-pair"><div class="chord-row">'+renderChordTokenLineHtml(r)+'</div></div>'}).join('');
  }

  function extractChordNames(text){
    var seen={},out=[];
    function add(c){c=cleanChordToken(c);if(!c||!isChordToken(c)||seen[c])return;seen[c]=1;out.push(c)}
    String(text||'').replace(/\[([^\]]+)\]/g,function(_,raw){var name=raw.trim();if(!name||isSectionTag(name))return '';name.split(/\s+/).forEach(add);return ''});
    String(text||'').replace(/\r\n?/g,'\n').split('\n').forEach(function(line){if(lineLooksChord(line)){(line.match(/[A-G][b#]?(?:maj|major|min|minor|m|aug|dim|sus2|sus4|sus|add(?:2|4|9|11|13)?|no(?:3|5)?|ø|[b#](?:5|9|11|13)|2|4|5|6|7|9|11|13)*(?:\/[A-G][b#]?)?/g)||[]).forEach(add)}});
    return out.slice(0,14)
  }

  function chordRoot(chord){var m=String(chord||'').match(/^([A-G](?:#|b)?)/);return m?m[1]:''}
  function noteIndex(n){var map={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};return map[keyRootName(n)]}
  function noteName(i,flat){var sharp=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],flats=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];i=(i%12+12)%12;return (flat?flats:sharp)[i]}
  function parseChordForNns(chord){var m=String(chord||'').trim().match(/^([A-G](?:#|b)?)(.*)$/);return m?{root:m[1],suffix:m[2]||''}:null}
  function transposeChord(chord,fromKey,toKey,useFlats){
    var rootName=chordRoot(chord),from=noteIndex(fromKey||'C'),to=noteIndex(toKey||fromKey||'C'),r=noteIndex(rootName);
    if(rootName===''||from==null||to==null||r==null)return chord;
    var flat=(useFlats==null)?!!settings().useFlatsDefault:!!useFlats;
    var suffix=String(chord).slice(rootName.length);
    if(suffix.indexOf('/')>=0){
      var parts=suffix.split('/'),mainSuffix=parts[0],bass=parts[1]||'';
      var bassRoot=chordRoot(bass);
      if(bassRoot){var br=noteIndex(bassRoot);bass=noteName(br+(to-from),flat)+String(bass).slice(bassRoot.length)}
      return noteName(r+(to-from),flat)+mainSuffix+'/'+bass;
    }
    return noteName(r+(to-from),flat)+suffix;
  }
  function nnsAccidentalPreference(note,fallback){return /#/.test(String(note||''))?'sharp':(/b/.test(String(note||''))?'flat':(fallback||'flat'))}
  function nnsDegreeForNote(note,key,accidentalPref){var ci=noteIndex(note),ki=noteIndex(key||'C');if(ci==null||ki==null)return String(note||'');var semi=(ci-ki+12)%12,scale=[0,2,4,5,7,9,11],idx=scale.indexOf(semi);if(idx>=0)return String(idx+1);var flat={1:'b2',3:'b3',6:'b5',8:'b6',10:'b7'},sharp={1:'#1',3:'#2',6:'#4',8:'#5',10:'#6'};return (accidentalPref==='sharp'?sharp:flat)[semi]||flat[semi]||String(semi)}
  function nnsStyleChordExtension(s){return String(s||'').replace(/13/g,'¹³').replace(/11/g,'¹¹').replace(/9/g,'⁹').replace(/7/g,'⁷').replace(/6/g,'⁶')}
  function nnsSuffixForChord(suffix){var s=String(suffix||'').trim();if(!s)return '';s=s.replace(/^major/i,'maj').replace(/^minor/i,'m');if(/^maj$/i.test(s))return '';var quality='';if(/^(min|m)(?!aj)/i.test(s)){quality='m';s=s.replace(/^(min|m)(?!aj)/i,'')}else if(/^dim/i.test(s)){quality='dim';s=s.replace(/^dim/i,'')}else if(/^aug/i.test(s)){quality='aug';s=s.replace(/^aug/i,'')}else if(/^ø/i.test(s)){quality='ø';s=s.replace(/^ø/i,'')}var sus='',susMatch=s.match(/sus(?:([24]))?/i);if(susMatch){sus='sus'+(susMatch[1]||'4');s=s.replace(/sus(?:[24])?/ig,'')}var majExt='';if(/^maj/i.test(s)){majExt='maj';s=s.replace(/^maj/i,'')}var add='',addMatch=s.match(/add(?:([0-9]+))?/i);if(addMatch){add='add'+(addMatch[1]||'');s=s.replace(/add[0-9]*/ig,'')}var ext=(s.match(/(?:13|11|9|7|6)/g)||[]).join('');s=s.replace(/(?:13|11|9|7|6)/g,'');s=s.replace(/[()]/g,'').trim();var alt=s.replace(/[^#b0-9]/g,'');var out=quality;if(majExt)out+=majExt;if(ext)out+=nnsStyleChordExtension(ext);if(sus)out+=sus;if(add)out+=add;if(alt)out+=alt;return out}
  function chordToNns(chord,key){var parts=String(chord||'').split('/'),main=parseChordForNns(parts[0]);if(!main)return chord;var pref=nnsAccidentalPreference(main.root,'flat'),rootDegree=nnsDegreeForNote(main.root,key,pref),suffix=nnsSuffixForChord(main.suffix);var out=rootDegree+suffix;if(parts[1]){var bass=parseChordForNns(parts[1]);out+='/'+(bass?nnsDegreeForNote(bass.root,key,nnsAccidentalPreference(bass.root,pref))+nnsSuffixForChord(bass.suffix):parts[1])}return out}
  function displayChord(ch,song,mode){var st=state();song=song||{};var sourceKey=song.chartKey||song.originalKey||song.sourceKey||song.key||'C';var key=song.displayKey||st.displayKey||song.key||sourceKey||'C';var t=transposeChord(ch,sourceKey,key);return mode==='nns'?chordToNns(t,key):t}
  function renderChordOnlyLine(line,mode,song){return String(line||'').replace(/[A-G](?:#|b)?(?:(?:maj|major|min|minor|m|aug|dim|sus2|sus4|sus|add(?:2|4|9|11|13)?|no(?:3|5)?|ø|[b#](?:5|9|11|13)|\/[A-G](?:#|b)?|[0-9])*)/g,function(ch){return isChordToken(ch)?displayChord(ch,song,mode):ch})}
  function splitTextPreserveSpaces(text){return String(text||'').match(/\S+\s*|\s+/g)||['']}
  function renderChordLyricLine(line,mode,song){
    var segments=[],idx=0,current='',m,rx=/\[([^\]]+)\]/g,has=false;
    while((m=rx.exec(line))){
      var raw=m[1].trim();
      if(isSectionTag(raw)){idx=m.index+m[0].length;continue}
      has=true;
      var lyric=line.slice(idx,m.index);
      if(lyric)segments.push({chord:current,lyric:lyric});
      current=displayChord(raw,song,mode);
      idx=m.index+m[0].length;
    }
    var tail=line.slice(idx);
    if(has){
      segments.push({chord:current,lyric:tail||'\u00a0'});
      var html=[];
      segments.forEach(function(seg){
        var parts=splitTextPreserveSpaces(seg.lyric);
        var pendingChord=seg.chord||'';
        var attached=false;
        parts.forEach(function(part){
          var spacer=/^\s+$/.test(part);
          var ch='';
          if(pendingChord){
            if(!spacer){ch=pendingChord;attached=true;pendingChord=''}
          }
          html.push('<span class="pair-seg '+(spacer?'spacer':'')+'"><span class="pair-chord">'+(ch?renderChordTokenLineHtml(ch):'&nbsp;')+'</span><span class="pair-lyric">'+escapeTextWithSpaces(part||'\u00a0')+'</span></span>');
        });
        if(pendingChord&&!attached){
          html.push('<span class="pair-seg"><span class="pair-chord">'+renderChordTokenLineHtml(pendingChord)+'</span><span class="pair-lyric">&nbsp;</span></span>');
        }
      });
      return '<div class="lyric-block"><div class="pair-line">'+html.join('')+'</div></div>'
    }
    return '<div class="lyric-only-row">'+esc(line.replace(/\[[^\]]+\]/g,''))+'</div>'
  }
  function renderInlineChordLine(line,mode,song){return renderChordLyricLine(line,mode,song)}
  function renderAlignedChordPair(chordLine,lyricLine,mode,song){
    var chords=chordPositionsFromLine(chordLine).map(function(c){return {text:displayChord(c.text.replace(/[|,;]/g,''),song,mode),pos:c.pos};});
    var lyric=String(lyricLine||'');
    var chordOut=new Array(Math.max(lyric.length,String(chordLine||'').length)+18).join(' ').split('');
    chords.forEach(function(c){var p=Math.max(0,Math.min(chordOut.length-1,c.pos));for(var i=0;i<c.text.length&&p+i<chordOut.length;i++)chordOut[p+i]=c.text.charAt(i);});
    var cr=chordOut.join('').replace(/\s+$/,'');
    return renderScreenPairRows(wrapAlignedPairForScreen(cr,lyric,screenPairCols()));
  }
  function formatChartHtml(text,mode,song){
    var lines=String(text||'').replace(/\r\n?/g,'\n').split(/\n/),html=[],occ={verse:0};
    for(var i=0;i<lines.length;i++){
      var line=lines[i]||'',trimmed=line.trim();
      var sec=trimmed.match(/^\[([^\]]+)\]$/);
      if(sec&&isSectionTag(sec[1])){var meta=getSectionMetaFromText(sec[1],occ);html.push('<span class="sec-lbl" data-section-label="'+esc(sec[1].trim().replace(/\s+/g,' '))+'" data-section-key="'+esc(meta.key)+'" data-section-short="'+esc(meta.short)+'">'+esc(meta.text)+'</span>');continue}
      if(!trimmed){html.push('<span class="spacer-line"></span>');continue}
      if(mode==='lyrics'){
        if(/\[[^\]]+\]/.test(line)){html.push('<div class="lyric-only-row">'+esc(line.replace(/\[[^\]]+\]/g,''))+'</div>');continue}
        if(lineLooksChord(line) && lines[i+1] && !lineLooksChord(lines[i+1]) && !/^\s*\[/.test(lines[i+1].trim())){html.push('<div class="lyric-only-row">'+esc(lines[i+1])+'</div>');i++;continue}
        if(!lineLooksChord(line))html.push('<div class="lyric-only-row">'+esc(line)+'</div>');
        continue;
      }
      if(/\[[^\]]+\]/.test(line)){html.push(renderInlineChordLine(line,mode,song));continue}
      if(lineLooksChord(line)){
        var chordText=renderChordOnlyLine(line,mode,song);
        var next=lines[i+1]||'',nextTrim=next.trim();
        if(nextTrim && !lineLooksChord(next) && !/^\s*\[[^\]]+\]\s*$/.test(nextTrim)){html.push(renderAlignedChordPair(line,next,mode,song));i++;continue}
        html.push(renderScreenChordOnlyRows(wrapAlignedPairForScreen(chordText,'',screenPairCols()).map(function(r){return r.c||''})));continue;
      }
      html.push('<div class="lyric-only-row">'+esc(line.replace(/\[[^\]]+\]/g,''))+'</div>');
    }
    return html.join('');
  }

  return {
    isSectionTag:isSectionTag,
    sectionTextFromLine:sectionTextFromLine,
    getSectionMetaFromText:getSectionMetaFromText,
    lineLooksChord:lineLooksChord,
    chordPositionsFromLine:chordPositionsFromLine,
    renderChordTokenLineHtml:renderChordTokenLineHtml,
    renderScreenPairRows:renderScreenPairRows,
    renderScreenChordOnlyRows:renderScreenChordOnlyRows,
    renderAlignedChordPair:renderAlignedChordPair,
    renderInlineChordLine:renderInlineChordLine,
    isChordToken:isChordToken,
    cleanChordToken:cleanChordToken,
    extractChordNames:extractChordNames,
    chordRoot:chordRoot,
    noteIndex:noteIndex,
    noteName:noteName,
    parseChordForNns:parseChordForNns,
    transposeChord:transposeChord,
    nnsAccidentalPreference:nnsAccidentalPreference,
    nnsDegreeForNote:nnsDegreeForNote,
    nnsStyleChordExtension:nnsStyleChordExtension,
    nnsSuffixForChord:nnsSuffixForChord,
    chordToNns:chordToNns,
    displayChord:displayChord,
    renderChordOnlyLine:renderChordOnlyLine,
    splitTextPreserveSpaces:splitTextPreserveSpaces,
    renderChordLyricLine:renderChordLyricLine,
    formatChartHtml:formatChartHtml,
    diagnostics:function(){return {owner:'WBChartRenderer',phase:'H.1',sections:true,chords:true,nns:true};}
  };
}

root.WBChartRenderer={
  version:'Phase 2b - B2 chart-renderer',
  phase:'Phase H.1: chart parser and chord helper ownership extraction',
  createAdapter:createAdapter
};
})(window);
