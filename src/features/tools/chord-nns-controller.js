/* WorshipBase ADD5.4 Chord / NNS reference owner.
   Owns number-system scale tables, optional progression conversion, guitar/piano diagrams,
   theory reference helpers, and WorshipBase-style picker data. */
(function(root){
'use strict';

var CHROMATIC_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var CHROMATIC_FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
var ROOTS=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
var QUALITIES=[
  {id:'major',label:'Major',suffix:'',kind:'maj'},
  {id:'minor',label:'Minor',suffix:'m',kind:'min'},
  {id:'seven',label:'7',suffix:'7',kind:'dom7'},
  {id:'major7',label:'Maj7',suffix:'maj7',kind:'maj7'},
  {id:'minor7',label:'m7',suffix:'m7',kind:'min7'},
  {id:'sus2',label:'sus2',suffix:'sus2',kind:'sus2'},
  {id:'sus4',label:'sus4',suffix:'sus4',kind:'sus4'},
  {id:'dim',label:'dim',suffix:'dim',kind:'dim'}
];
var SCALES={
  major:{label:'Major',intervals:[0,2,4,5,7,9,11],degrees:['1','2','3','4','5','6','7'],roman:['I','ii','iii','IV','V','vi','vii°'],quality:['Maj','Min','Min','Maj','Maj','Min','Dim'],suffix:['','m','m','','','m','dim']},
  minor:{label:'Minor',intervals:[0,2,3,5,7,8,10],degrees:['1','2','3','4','5','6','7'],roman:['i','ii°','III','iv','v','VI','VII'],quality:['Min','Dim','Maj','Min','Min','Maj','Maj'],suffix:['m','dim','','m','m','','']}
};
var USE_FLATS={F:true,Bb:true,Eb:true,Ab:true,Db:true,Gb:true,Cb:true,'Dbm':true,'Ebm':true,'Fm':true,'Gm':true,'Abm':true,'Bbm':true,'Cm':true};
var ENHARMONIC={'C#':'Db','D#':'Eb','F#':'F#','G#':'Ab','A#':'Bb','Db':'Db','Eb':'Eb','Gb':'Gb','Ab':'Ab','Bb':'Bb'};

function normalizeRoot(root){
  root=String(root||'C').trim().replace(/♭/g,'b').replace(/♯/g,'#');
  if(root==='')return 'C';
  root=root.charAt(0).toUpperCase()+root.slice(1);
  if(root==='Cb')return 'B';
  if(root==='B#')return 'C';
  if(root==='E#')return 'F';
  if(root==='Fb')return 'E';
  return ROOTS.indexOf(root)>=0?root:(ENHARMONIC[root]||'C');
}
function noteIndex(root){
  root=normalizeRoot(root);
  var idx=CHROMATIC_SHARP.indexOf(root);
  if(idx>=0)return idx;
  return CHROMATIC_FLAT.indexOf(root);
}
function noteAt(root,offset,useFlats){
  var idx=(noteIndex(root)+offset+120)%12;
  return (useFlats?CHROMATIC_FLAT:CHROMATIC_SHARP)[idx];
}
function scaleRows(key,mode){
  key=normalizeRoot(key);mode=SCALES[mode]?mode:'major';
  var scale=SCALES[mode], useFlats=!!USE_FLATS[key+(mode==='minor'?'m':'')];
  return scale.intervals.map(function(interval,i){
    var root=noteAt(key,interval,useFlats), chord=root+scale.suffix[i];
    return {degree:scale.degrees[i],roman:scale.roman[i],quality:scale.quality[i],root:root,chord:chord,nns:nnsLabel(scale.degrees[i],scale.quality[i],mode)};
  });
}
function nnsLabel(degree,quality,mode){
  if(quality==='Dim')return degree+'°';
  if(quality==='Min')return degree+'m';
  return degree;
}

function intervalName(semitones){
  var names=['1','b2','2','b3','3','4','#4 / b5','5','b6','6','b7','7'];
  return names[(Number(semitones)||0)%12]||'?';
}
function scaleNoteList(key,mode){
  key=normalizeRoot(key);mode=SCALES[mode]?mode:'major';
  var scale=SCALES[mode], useFlats=!!USE_FLATS[key+(mode==='minor'?'m':'')];
  return scale.intervals.map(function(interval){return noteAt(key,interval,useFlats);});
}
function scaleFormula(mode){
  mode=SCALES[mode]?mode:'major';
  return mode==='minor'
    ? {label:'Natural minor',steps:'W H W W H W W',numbers:'1 2 b3 4 5 b6 b7'}
    : {label:'Major',steps:'W W H W W W H',numbers:'1 2 3 4 5 6 7'};
}
function relativeKey(key,mode){
  key=normalizeRoot(key);mode=SCALES[mode]?mode:'major';
  if(mode==='major')return {label:'Relative minor',key:noteAt(key,9,!!USE_FLATS[key])+'m'};
  return {label:'Relative major',key:noteAt(key,3,!!USE_FLATS[key+'m'])};
}
function qualityLegend(mode){
  mode=SCALES[mode]?mode:'major';
  var rows=mode==='minor'
    ? [['1m','Minor tonic'],['2°','Diminished'],['3','Major'],['4m','Minor'],['5m','Minor'],['6','Major'],['7','Major / flat seventh']]
    : [['1','Major tonic'],['2m','Minor'],['3m','Minor'],['4','Major'],['5','Major'],['6m','Minor'],['7°','Diminished']];
  return rows.map(function(r){return {nns:r[0],meaning:r[1]};});
}

function theoryRows(key,mode){
  var notes=scaleNoteList(key,mode), formula=scaleFormula(mode), rel=relativeKey(key,mode);
  var solfege=mode==='minor'?['Do','Re','Me','Fa','Sol','Le','Te']:['Do','Re','Mi','Fa','Sol','La','Ti'];
  var functions=mode==='minor'
    ? ['Tonic','Predominant','Tonic family','Predominant','Dominant','Predominant','Dominant']
    : ['Tonic','Predominant','Tonic family','Predominant','Dominant','Tonic family','Dominant'];
  return [
    {label:'Scale pattern',value:(formula&&formula.steps)||''},
    {label:'Number formula',value:(formula&&formula.numbers)||''},
    {label:(rel&&rel.label)||'Relative key',value:(rel&&rel.key)||''},
    {label:'Solfege',value:solfege.join(' · ')},
    {label:'Function families',value:functions.join(' · ')},
    {label:'Scale notes',value:notes.join(' · ')}
  ];
}
function chordIntervalsForQuality(qualityId){
  var map={major:[0,4,7],minor:[0,3,7],seven:[0,4,7,10],major7:[0,4,7,11],minor7:[0,3,7,10],sus2:[0,2,7],sus4:[0,5,7],dim:[0,3,6]};
  return map[qualityId]||map.major;
}
function pianoChordNotes(root,qualityId,inversion){
  root=normalizeRoot(root);qualityId=qualityId||'major';
  var useFlats=!!USE_FLATS[root], intervals=chordIntervalsForQuality(qualityId).slice();
  var notes=intervals.map(function(i){return {name:noteAt(root,i,useFlats),interval:i};});
  inversion=Math.max(0,Math.min(notes.length-1,parseInt(inversion,10)||0));
  if(inversion){
    var rotated=notes.slice(inversion).concat(notes.slice(0,inversion).map(function(n){return {name:n.name,interval:n.interval+12};}));
    notes=rotated;
  }
  return notes.map(function(n){return n.name;});
}
function pitchClassMap(notes){
  var active={};(notes||[]).forEach(function(n){active[noteIndex(n)]=true});return active;
}
function pianoDiagramSvg(root,qualityId){
  root=normalizeRoot(root);qualityId=qualityId||'major';
  var q=QUALITIES.filter(function(q){return q.id===qualityId})[0]||QUALITIES[0];
  var notes=pianoChordNotes(root,qualityId,0), active=pitchClassMap(notes);
  var whites=['C','D','E','F','G','A','B','C','D','E','F','G','A','B'];
  var whitePc=[0,2,4,5,7,9,11,0,2,4,5,7,9,11];
  var blackAfter={C:1,D:3,F:6,G:8,A:10};
  var x0=8,w=13.2,h=58,bw=8.8,bh=36,fullW=x0*2+(whites.length*w);
  var out=['<svg class="chord-diagram-svg piano nns-piano-svg" viewBox="0 0 '+fullW+' 92" role="img" aria-label="'+root+q.suffix+' piano chord">'];
  out.push('<g class="piano-white-keys">');
  whites.forEach(function(k,i){out.push('<rect class="piano-white" x="'+(x0+i*w).toFixed(2)+'" y="14" width="'+w+'" height="'+h+'" rx="1.9"/>')});
  out.push('</g><g class="piano-black-keys">');
  whites.forEach(function(k,i){
    if(i>=whites.length-1)return;
    var pc=blackAfter[k];if(pc==null)return;
    var bx=x0+i*w+w-(bw/2);
    out.push('<rect class="piano-black" x="'+bx.toFixed(2)+'" y="14" width="'+bw+'" height="'+bh+'" rx="1.8"/>');
    if(active[pc])out.push('<circle class="piano-dot-black" cx="'+(bx+bw/2).toFixed(2)+'" cy="37.5" r="2.55"/>');
  });
  out.push('</g><g class="piano-white-dots">');
  whites.forEach(function(k,i){var pc=whitePc[i];if(active[pc])out.push('<circle class="piano-dot-white" cx="'+(x0+i*w+w/2).toFixed(2)+'" cy="63.5" r="3.15"/>')});
  out.push('</g></svg>');
  return out.join('');
}
function pianoDiagramHtml(root,qualityId){
  root=normalizeRoot(root);qualityId=qualityId||'major';
  var q=QUALITIES.filter(function(q){return q.id===qualityId})[0]||QUALITIES[0];
  var notes=pianoChordNotes(root,qualityId,0);
  return '<div class="nns-piano-wrap nns-piano-wrap-svg">'+pianoDiagramSvg(root,qualityId)+'<div class="nns-piano-notes"><strong>'+root+q.suffix+'</strong><span>'+notes.join(' · ')+'</span></div></div>';
}
function nnsTokenToInterval(token,mode){
  token=String(token||'').trim().replace(/º/g,'°').replace(/♭/g,'b').replace(/♯/g,'#');
  var m=token.match(/^([b#]?)([1-7])/); if(!m)return null;
  var num=parseInt(m[2],10), accidental=m[1]||'';
  var base=(SCALES[mode]||SCALES.major).intervals[num-1];
  if(accidental==='b')base-=1;
  if(accidental==='#')base+=1;
  return (base+120)%12;
}
function accidentalDegreeForRoot(root,key,mode){
  key=normalizeRoot(key);mode=SCALES[mode]?mode:'major';
  var idx=(noteIndex(root)-noteIndex(key)+120)%12;
  var scale=(SCALES[mode]||SCALES.major).intervals;
  for(var i=0;i<scale.length;i++)if(scale[i]===idx)return String(i+1);
  for(var j=0;j<scale.length;j++)if((scale[j]+1)%12===idx)return '#'+(j+1);
  for(var k=0;k<scale.length;k++)if((scale[k]+11)%12===idx)return 'b'+(k+1);
  return intervalName(idx);
}
function parseChord(chord){
  chord=String(chord||'').trim().replace(/♭/g,'b').replace(/♯/g,'#');
  var slash=null;
  if(chord.indexOf('/')>=0){var parts=chord.split('/');chord=parts[0]||'';slash=parts.slice(1).join('/');}
  var m=chord.match(/^([A-G](?:#|b)?)(.*)$/i);
  if(!m)return null;
  var root=normalizeRoot(m[1]);
  var suffix=String(m[2]||'').trim();
  var quality='Maj';
  if(/^m(?!aj)/i.test(suffix))quality='Min';
  if(/dim|°/i.test(suffix))quality='Dim';
  var bass=slash?normalizeRoot(slash):null;
  return {root:root,suffix:suffix,quality:quality,bass:bass,slash:!!bass};
}
function degreeForRoot(root,rows){
  for(var i=0;i<rows.length;i++){if(noteIndex(rows[i].root)===noteIndex(root))return rows[i];}
  return null;
}
function chordToNns(chord,key,mode){
  var parsed=parseChord(chord), rows=scaleRows(key,mode);
  if(!parsed)return null;
  var row=degreeForRoot(parsed.root,rows);
  var base=row?row.degree:accidentalDegreeForRoot(parsed.root,key,mode);
  if(parsed.quality==='Dim')base+='°';
  else if(parsed.quality==='Min' && base.indexOf('m')<0)base+='m';
  if(parsed.bass){
    var bassRow=degreeForRoot(parsed.bass,rows);
    if(bassRow)base+='/'+bassRow.degree;
    else base+='/'+accidentalDegreeForRoot(parsed.bass,key,mode);
  }
  return base;
}
function nnsToChord(degree,key,mode){
  degree=String(degree||'').trim().replace(/º/g,'°').replace(/♭/g,'b').replace(/♯/g,'#');
  var parts=degree.split('/'), main=parts[0]||'', bass=parts[1]||'';
  var mm=main.match(/^([b#]?)([1-7])/); if(!mm)return null;
  var num=parseInt(mm[2],10); if(!num||num<1||num>7)return null;
  var rows=scaleRows(key,mode), row=rows[num-1];
  if(!row)return null;
  var interval=nnsTokenToInterval(main,mode), useFlats=!!USE_FLATS[normalizeRoot(key)+(mode==='minor'?'m':'')];
  var root=noteAt(key,interval,useFlats);
  var chord;
  if(/m/i.test(main)&&!/maj/i.test(main))chord=root+'m';
  else if(/°|dim/i.test(main))chord=root+'dim';
  else chord=root+(row.quality==='Min'&&mm[1]===''?'m':row.quality==='Dim'&&mm[1]===''?'dim':'');
  if(bass){
    var bm=bass.match(/^([b#]?)([1-7])$/);
    if(bm){var bassInterval=nnsTokenToInterval(bass,mode);chord+='/'+noteAt(key,bassInterval,useFlats);}
    else chord+='/'+normalizeRoot(bass);
  }
  return chord;
}
function tokenizeProgression(value){return String(value||'').trim().split(/[\s,]+/).map(function(t){return t.trim();}).filter(Boolean);}
function looksLikeNnsToken(token){return /^\d/.test(String(token||''));}
function convertProgression(value,key,mode){
  var tokens=tokenizeProgression(value);
  if(!tokens.length)return {direction:'empty',tokens:[],line:'',values:[]};
  var numbers=tokens.some(looksLikeNnsToken);
  var values=tokens.map(function(t){return numbers?nnsToChord(t,key,mode):chordToNns(t,key,mode)});
  return {direction:numbers?'numbers-to-chords':'chords-to-numbers',tokens:tokens,values:values,line:values.map(function(v){return v||'?';}).join('  ')};
}
function transposeProgression(value,fromKey,toKey,mode){
  var tokens=tokenizeProgression(value);
  if(!tokens.length)return {numbers:[],chords:[],line:''};
  var numbers=tokens.map(function(t){return looksLikeNnsToken(t)?t:chordToNns(t,fromKey,mode)});
  var chords=numbers.map(function(n){return n?nnsToChord(n,toKey,mode):null});
  return {numbers:numbers,chords:chords,line:chords.map(function(v){return v||'?';}).join('  ')};
}
function commonProgressions(key,mode){
  var examples=mode==='minor'?[['1m','6','3','7'],['1m','4m','7','3'],['6','7','1m','1m'],['1m','b7','6','b7']]:[['1','5','6m','4'],['6m','4','1','5'],['1','4','5','1'],['2m','5','1','1'],['1','5/7','6m','4']];
  return examples.map(function(seq){return {nns:seq.join(' '),chords:seq.map(function(n){return nnsToChord(n,key,mode)||'?';}).join(' ')};});
}

var OPEN_DIAGRAMS={
  'C':{frets:['x',3,2,0,1,0],fingers:['','3','2','','1',''],base:0},
  'Cm':{frets:['x',3,5,5,4,3],barre:3,fingers:['','1','3','4','2','1'],base:3},
  'C7':{frets:['x',3,2,3,1,0],fingers:['','3','2','4','1',''],base:0},
  'Cm7':{frets:['x',3,5,3,4,3],barre:3,fingers:['','1','3','1','2','1'],base:3},
  'D':{frets:['x','x',0,2,3,2],fingers:['','','','1','3','2'],base:0},
  'Dm':{frets:['x','x',0,2,3,1],fingers:['','','','2','3','1'],base:0},
  'D7':{frets:['x','x',0,2,1,2],fingers:['','','','2','1','3'],base:0},
  'Dm7':{frets:['x','x',0,2,1,1],fingers:['','','','2','1','1'],base:0},
  'E':{frets:[0,2,2,1,0,0],fingers:['','2','3','1','',''],base:0},
  'Em':{frets:[0,2,2,0,0,0],fingers:['','2','3','','',''],base:0},
  'E7':{frets:[0,2,0,1,0,0],fingers:['','2','','1','',''],base:0},
  'Em7':{frets:[0,2,0,0,0,0],fingers:['','2','','','',''],base:0},
  'F':{frets:[1,3,3,2,1,1],barre:1,fingers:['1','3','4','2','1','1'],base:1},
  'Fm':{frets:[1,3,3,1,1,1],barre:1,fingers:['1','3','4','1','1','1'],base:1},
  'G':{frets:[3,2,0,0,0,3],fingers:['3','2','','','','4'],base:0},
  'Gm':{frets:[3,5,5,3,3,3],barre:3,fingers:['1','3','4','1','1','1'],base:3},
  'G7':{frets:[3,2,0,0,0,1],fingers:['3','2','','','','1'],base:0},
  'A':{frets:['x',0,2,2,2,0],fingers:['','','1','2','3',''],base:0},
  'Am':{frets:['x',0,2,2,1,0],fingers:['','','2','3','1',''],base:0},
  'A7':{frets:['x',0,2,0,2,0],fingers:['','','2','','3',''],base:0},
  'Am7':{frets:['x',0,2,0,1,0],fingers:['','','2','','1',''],base:0},
  'B':{frets:['x',2,4,4,4,2],barre:2,fingers:['','1','3','3','3','1'],base:2},
  'Bm':{frets:['x',2,4,4,3,2],barre:2,fingers:['','1','3','4','2','1'],base:2},
  'Bb':{frets:['x',1,3,3,3,1],barre:1,fingers:['','1','3','3','3','1'],base:1},
  'Bbm':{frets:['x',1,3,3,2,1],barre:1,fingers:['','1','3','4','2','1'],base:1},

  'Csus4':{frets:['x',3,3,0,1,1],fingers:['','3','4','','1','1'],base:0},
  'Dsus4':{frets:['x','x',0,2,3,3],fingers:['','','','1','3','4'],base:0},
  'Esus4':{frets:[0,2,2,2,0,0],fingers:['','1','2','3','',''],base:0},
  'Asus4':{frets:['x',0,2,2,3,0],fingers:['','','1','2','3',''],base:0},
  'Cadd9':{frets:['x',3,2,0,3,0],fingers:['','3','2','','4',''],base:0},
  'D/F#':{frets:[2,0,0,2,3,2],fingers:['1','','','2','4','3'],base:0},
  'G/B':{frets:['x',2,0,0,3,3],fingers:['','1','','','3','4'],base:0},
  'C/E':{frets:[0,3,2,0,1,0],fingers:['','3','2','','1',''],base:0},
  'F#m':{frets:[2,4,4,2,2,2],barre:2,fingers:['1','3','4','1','1','1'],base:2},
  'F#':{frets:[2,4,4,3,2,2],barre:2,fingers:['1','3','4','2','1','1'],base:2},
  'B7':{frets:['x',2,1,2,0,2],fingers:['','2','1','3','','4'],base:0},
  'Bb7':{frets:['x',1,3,1,3,1],barre:1,fingers:['','1','3','1','4','1'],base:1},
  'Ab':{frets:[4,6,6,5,4,4],barre:4,fingers:['1','3','4','2','1','1'],base:4},
  'Abm':{frets:[4,6,6,4,4,4],barre:4,fingers:['1','3','4','1','1','1'],base:4},
  'Eb':{frets:['x',6,8,8,8,6],barre:6,fingers:['','1','3','3','3','1'],base:6},
  'Ebm':{frets:['x',6,8,8,7,6],barre:6,fingers:['','1','3','4','2','1'],base:6},
  'Db':{frets:['x',4,6,6,6,4],barre:4,fingers:['','1','3','3','3','1'],base:4},
  'Dbm':{frets:['x',4,6,6,5,4],barre:4,fingers:['','1','3','4','2','1'],base:4},
};
function barreEShape(root,quality){
  var idx=noteIndex(root), e=noteIndex('E'), fret=(idx-e+12)%12;
  if(fret<1)fret+=12;
  var frets, fingers;
  if(quality==='minor'){frets=[fret,fret+2,fret+2,fret,fret,fret];fingers=['1','3','4','1','1','1'];}
  else if(quality==='seven'){frets=[fret,fret+2,fret,fret+1,fret,fret];fingers=['1','3','1','2','1','1'];}
  else if(quality==='minor7'){frets=[fret,fret+2,fret,fret,fret,fret];fingers=['1','3','1','1','1','1'];}
  else if(quality==='major7'){frets=[fret,fret+2,fret+1,fret+1,fret,fret];fingers=['1','3','2','2','1','1'];}
  else if(quality==='sus2'){frets=[fret,fret+2,fret+4,fret+4,fret,fret];fingers=['1','2','4','4','1','1'];}
  else if(quality==='sus4'){frets=[fret,fret+2,fret+2,fret+3,fret,fret];fingers=['1','2','3','4','1','1'];}
  else if(quality==='dim'){frets=['x',fret,fret+1,fret+2,fret+1,'x'];fingers=['','1','2','4','3',''];}
  else {frets=[fret,fret+2,fret+2,fret+1,fret,fret];fingers=['1','3','4','2','1','1'];}
  return {frets:frets,fingers:fingers,barre:fret,base:fret,shape:'E-shape barre'};
}
function barreAShape(root,quality){
  var idx=noteIndex(root), a=noteIndex('A'), fret=(idx-a+12)%12;
  if(fret<1)fret+=12;
  if(quality==='minor')return {frets:['x',fret,fret+2,fret+2,fret+1,fret],fingers:['','1','3','4','2','1'],barre:fret,base:fret,shape:'A-minor-shape barre'};
  if(quality==='seven')return {frets:['x',fret,fret+2,fret,fret+2,fret],fingers:['','1','3','1','4','1'],barre:fret,base:fret,shape:'A7-shape barre'};
  if(quality==='minor7')return {frets:['x',fret,fret+2,fret,fret+1,fret],fingers:['','1','3','1','2','1'],barre:fret,base:fret,shape:'Am7-shape barre'};
  if(quality==='major7')return {frets:['x',fret,fret+2,fret+1,fret+2,fret],fingers:['','1','3','2','4','1'],barre:fret,base:fret,shape:'Amaj7-shape barre'};
  if(quality==='sus2')return {frets:['x',fret,fret+2,fret+2,fret,fret],fingers:['','1','3','4','1','1'],barre:fret,base:fret,shape:'Asus2-shape barre'};
  if(quality==='sus4')return {frets:['x',fret,fret+2,fret+2,fret+3,fret],fingers:['','1','2','3','4','1'],barre:fret,base:fret,shape:'Asus4-shape barre'};
  if(quality==='dim')return null;
  return {frets:['x',fret,fret+2,fret+2,fret+2,fret],fingers:['','1','3','3','3','1'],barre:fret,base:fret,shape:'A-shape barre'};
}
function sameFrets(a,b){return JSON.stringify((a&&a.frets)||[])===JSON.stringify((b&&b.frets)||[]);}
function diagramVariations(root,qualityId){
  root=normalizeRoot(root);qualityId=qualityId||'major';
  var q=QUALITIES.filter(function(q){return q.id===qualityId})[0]||QUALITIES[0];
  var name=root+q.suffix, direct=OPEN_DIAGRAMS[name], variations=[];
  if(direct)variations.push({name:name,quality:q.label,diagram:direct,hint:'Open/common voicing',label:'Open'});
  var eShape=barreEShape(root,qualityId);if(eShape&&!variations.some(function(v){return sameFrets(v.diagram,eShape)}))variations.push({name:name,quality:q.label,diagram:eShape,hint:'Moveable voicing',label:'E shape'});
  var aShape=barreAShape(root,qualityId);if(aShape&&!variations.some(function(v){return sameFrets(v.diagram,aShape)}))variations.push({name:name,quality:q.label,diagram:aShape,hint:'Moveable voicing',label:'A shape'});
  if(!variations.length)variations.push({name:name,quality:q.label,diagram:eShape||OPEN_DIAGRAMS.C,hint:'Moveable voicing',label:'Shape'});
  return variations.slice(0,3);
}
function diagramFor(root,qualityId,index){
  var variations=diagramVariations(root,qualityId), i=Math.max(0,Math.min(variations.length-1,parseInt(index,10)||0));
  var model=variations[i]||variations[0];
  model.variationIndex=i;model.variationCount=variations.length;model.variations=variations;
  return model;
}
function diagramSvg(model){
  var d=model&&model.diagram?model.diagram:diagramFor('C','major').diagram;
  var frets=d.frets||[], base=d.base||0, xs=[18,39,60,81,102,123], top=38, h=22;
  var out=['<svg class="chord-diagram-svg guitar nns-diagram-svg" viewBox="0 0 142 160" role="img" aria-label="'+((model&&model.name)||'Chord')+' guitar diagram">'];
  out.push('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">');
  out.push('<path d="M18 '+top+'H123" stroke-width="'+(base<=1?4.2:2.2)+'"/>');
  for(var f=1;f<=4;f++)out.push('<path d="M18 '+(top+f*h)+'H123" stroke-width="1.8" opacity=".78"/>');
  xs.forEach(function(x){out.push('<path d="M'+x+' '+top+'V'+(top+4*h)+'" stroke-width="1.9" opacity=".86"/>')});
  out.push('</g>');
  if(base>1)out.push('<text x="132" y="'+(top+11)+'" fill="currentColor" font-size="11" font-weight="800">'+base+'</text>');
  frets.forEach(function(fr,i){var x=xs[i],mark=fr==='x'||fr==='X'?'×':(Number(fr)===0?'○':'');if(mark)out.push('<text x="'+x+'" y="22" text-anchor="middle" fill="currentColor" font-size="16" font-weight="760">'+mark+'</text>')});
  if(d.barre){var barreFrom=0,barreTo=5;if(String(frets[0]).toLowerCase()==='x')barreFrom=1;if(String(frets[5]).toLowerCase()==='x')barreTo=4;var y=top+(d.barre-base+.5)*h;out.push('<rect x="'+(xs[barreFrom]-7)+'" y="'+(y-5.5)+'" width="'+((xs[barreTo]-xs[barreFrom])+14)+'" height="11" rx="5.5" fill="currentColor"/>')}
  frets.forEach(function(fr,i){if(typeof fr!=='number'||fr<=0)return;if(d.barre&&fr===d.barre)return;var y=top+(fr-base+.5)*h,x=xs[i],finger=(d.fingers&&d.fingers[i])||'';out.push('<circle cx="'+x+'" cy="'+y+'" r="8" fill="currentColor"/>');if(finger)out.push('<text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" fill="var(--bg1,#fff)" font-size="10" font-weight="850">'+finger+'</text>')});
  out.push('</svg>');return out.join('');
}
function chordName(root,qualityId){return diagramFor(root,qualityId).name;}
root.WBChordNnsController={
  ROOTS:ROOTS,QUALITIES:QUALITIES,SCALES:SCALES,
  normalizeRoot:normalizeRoot,scaleRows:scaleRows,scaleNoteList:scaleNoteList,scaleFormula:scaleFormula,relativeKey:relativeKey,qualityLegend:qualityLegend,theoryRows:theoryRows,pianoChordNotes:pianoChordNotes,pianoDiagramSvg:pianoDiagramSvg,pianoDiagramHtml:pianoDiagramHtml,
  chordToNns:chordToNns,nnsToChord:nnsToChord,
  tokenizeProgression:tokenizeProgression,convertProgression:convertProgression,transposeProgression:transposeProgression,commonProgressions:commonProgressions,
  diagramFor:diagramFor,diagramVariations:diagramVariations,diagramSvg:diagramSvg,chordName:chordName
};
})(window);
