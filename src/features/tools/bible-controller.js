/* WorshipBase Phase J4 Bible controller owner.
   Owns Bible metadata, state normalisation, chapter navigation, cache ids, and
   normalisation of local/Firebase chapter payloads. Rendering and fetch adapters
   remain in the legacy shell for now. */
(function(root){
'use strict';

var BIBLE_VERSIONS=[{id:'esv',abbr:'ESV',name:'English Standard Version',folder:'esv_chapter_package'}];
var BIBLE_BOOKS=['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','I Samuel','II Samuel','I Kings','II Kings','I Chronicles','II Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','3 John','Jude','Revelation'];
/* Preserve legacy canonical order with 1 John / 2 John before 3 John. */
BIBLE_BOOKS.splice(BIBLE_BOOKS.indexOf('3 John'),0,'1 John','2 John');
var BIBLE_CHAPTERS={Genesis:50,Exodus:40,Leviticus:27,Numbers:36,Deuteronomy:34,Joshua:24,Judges:21,Ruth:4,'I Samuel':31,'II Samuel':24,'I Kings':22,'II Kings':25,'I Chronicles':29,'II Chronicles':36,Ezra:10,Nehemiah:13,Esther:10,Job:42,Psalms:150,Proverbs:31,Ecclesiastes:12,'Song of Solomon':8,Isaiah:66,Jeremiah:52,Lamentations:5,Ezekiel:48,Daniel:12,Hosea:14,Joel:3,Amos:9,Obadiah:1,Jonah:4,Micah:7,Nahum:3,Habakkuk:3,Zephaniah:3,Haggai:2,Zechariah:14,Malachi:4,Matthew:28,Mark:16,Luke:24,John:21,Acts:28,Romans:16,'1 Corinthians':16,'2 Corinthians':13,Galatians:6,Ephesians:6,Philippians:4,Colossians:4,'1 Thessalonians':5,'2 Thessalonians':3,'1 Timothy':6,'2 Timothy':4,Titus:3,Philemon:1,Hebrews:13,James:5,'1 Peter':5,'2 Peter':3,'1 John':5,'2 John':1,'3 John':1,Jude:1,Revelation:22};

function clone(obj){return JSON.parse(JSON.stringify(obj));}
function versionId(id,settings){return String(id||(settings&&settings.defaultBibleVersion)||'esv').toLowerCase();}
function getVersionMeta(id,settings){var vid=versionId(id,settings);for(var i=0;i<BIBLE_VERSIONS.length;i++){if(BIBLE_VERSIONS[i].id===vid)return BIBLE_VERSIONS[i];}return BIBLE_VERSIONS[0];}
function defaultState(settings){var meta=getVersionMeta(null,settings);return {book:'John',chapter:3,version:meta.id};}
function packageReady(runtime){return !!(runtime&&runtime.index&&runtime.books&&runtime.books.length);}
function runtimeBooks(runtime){return runtime&&runtime.books&&runtime.books.length?runtime.books:BIBLE_BOOKS;}
function getBookMeta(book,runtime){if(!packageReady(runtime))return null;var books=(runtime.index&&runtime.index.books)||[];for(var i=0;i<books.length;i++){if(books[i]&&books[i].name===book)return books[i];}return null;}
function bookSlug(book,runtime){var meta=getBookMeta(book,runtime);return meta&&meta.slug||String(book||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
function chapterCount(book,runtime){var meta=getBookMeta(book,runtime);if(meta&&meta.chapters)return parseInt(meta.chapters,10)||1;return BIBLE_CHAPTERS[book]||28;}
function normalizeState(state,runtime,settings){state=state&&typeof state==='object'?state:defaultState(settings);var meta=getVersionMeta(state.version,settings);state.version=meta.id;var books=runtimeBooks(runtime);if(books.indexOf(state.book)<0)state.book=books.indexOf('John')>=0?'John':books[0];var max=chapterCount(state.book,runtime);state.chapter=Math.max(1,Math.min(max,parseInt(state.chapter,10)||1));return state;}
function fallbackIndex(runtime,versionMeta){var existing=runtime&&runtime.index&&Object.keys(runtime.index).length?runtime.index:null;if(existing)return existing;return {books:BIBLE_BOOKS.map(function(name){return {name:name,slug:bookSlug(name),chapters:BIBLE_CHAPTERS[name]||1};}),meta:{copyright:(versionMeta&&versionMeta.name)||'English Standard Version'}};}
function normalizeIndex(data){data=data||{};var books=(data.books||[]).map(function(b){return b&&b.name;}).filter(Boolean);return {index:data,books:books};}
function normalizeChapterData(raw,book,chapter){raw=raw||{};var verses=[];
  if(Array.isArray(raw.verses))verses=raw.verses.map(function(v,i){return {number:v.number||v.verse||String(i+1),text:String(v.text||v.content||'')}});
  else if(raw.verses&&typeof raw.verses==='object')verses=Object.keys(raw.verses).map(function(k){var val=raw.verses[k];return {number:k,text:String(typeof val==='string'?val:(val&&val.text)||'')}});
  else if(Array.isArray(raw.items))verses=raw.items.map(function(v,i){return {number:v.number||v.verse||String(i+1),text:String(v.text||v.content||'')}});
  else if(raw&&typeof raw==='object'){
    var keys=Object.keys(raw).filter(function(k){return /^\d+$/.test(String(k));});
    if(keys.length)verses=keys.sort(function(a,b){return (+a)-(+b);}).map(function(k){var val=raw[k];return {number:k,text:String(typeof val==='string'?val:(val&&val.text)||'')}});
  }
  return {book:raw.book||book,chapter:parseInt(raw.chapter,10)||parseInt(chapter,10)||1,verses:verses};
}
function cacheId(version,book,chapter,runtime){return String(version||'esv')+'::'+bookSlug(book,runtime)+'::'+String(chapter);}
function changeChapter(state,runtime,delta,settings){state=normalizeState(state,runtime,settings);delta=parseInt(delta,10)||0;var books=runtimeBooks(runtime);var max=chapterCount(state.book,runtime);state.chapter+=delta;
  if(state.chapter<1){var i=books.indexOf(state.book);if(i>0){state.book=books[i-1];state.chapter=chapterCount(state.book,runtime);}else state.chapter=1;}
  else if(state.chapter>max){var j=books.indexOf(state.book);if(j<books.length-1){state.book=books[j+1];state.chapter=1;}else state.chapter=max;}
  return state;
}
function setBook(state,runtime,book,settings){state=normalizeState(state,runtime,settings);var books=runtimeBooks(runtime);if(books.indexOf(book)>=0)state.book=book;state.chapter=Math.min(state.chapter,chapterCount(state.book,runtime));return state;}
function setChapter(state,runtime,chapter,settings){state=normalizeState(state,runtime,settings);state.chapter=Math.max(1,Math.min(chapterCount(state.book,runtime),parseInt(chapter,10)||1));return state;}
function setVersion(state,version,settings){state=state&&typeof state==='object'?state:defaultState(settings);state.version=getVersionMeta(version,settings).id;return state;}
function settingsChoices(){return BIBLE_VERSIONS.map(function(v){return [v.id,v.abbr];});}
function versionModels(state,runtime){state=normalizeState(state,runtime);return BIBLE_VERSIONS.map(function(v){var active=v.id===state.version;var sourceLabel=active?(packageReady(runtime)?'Package ready on this device':'Selected on this device'):('Local package: '+v.folder);return {id:v.id,abbr:v.abbr,name:v.name,active:active,sourceLabel:sourceLabel};});}
function bookModels(state,runtime){state=normalizeState(state,runtime);return runtimeBooks(runtime).map(function(book){return {book:book,active:book===state.book};});}
function chapterModels(state,runtime){state=normalizeState(state,runtime);var max=chapterCount(state.book,runtime);return Array.from({length:max},function(_,i){var n=i+1;return {chapter:n,active:n===state.chapter};});}
function firebasePathAttempts(paths,version,book,chapter,runtime){paths=paths||{};var base=paths.biblePath||paths.bibleCollection||'bibleChapters';var slug=bookSlug(book,runtime);return [base+'/'+version+'/'+slug+'/'+chapter,base+'/'+slug+'/'+chapter,base+'/'+version+'/'+book+'/'+chapter];}
function firestoreDocCandidates(version,book,chapter,runtime){var slug=bookSlug(book,runtime);return [version+'__'+slug+'__'+chapter,version+'_'+slug+'_'+chapter,slug+'_'+chapter+'_'+version,slug+'_'+chapter,book+'_'+chapter];}

root.WBBibleController={
  BIBLE_VERSIONS:clone(BIBLE_VERSIONS),
  BIBLE_BOOKS:BIBLE_BOOKS.slice(),
  BIBLE_CHAPTERS:Object.assign({},BIBLE_CHAPTERS),
  defaultState:defaultState,
  getVersionMeta:getVersionMeta,
  packageReady:packageReady,
  runtimeBooks:runtimeBooks,
  getBookMeta:getBookMeta,
  bookSlug:bookSlug,
  chapterCount:chapterCount,
  normalizeState:normalizeState,
  normalizeIndex:normalizeIndex,
  fallbackIndex:fallbackIndex,
  normalizeChapterData:normalizeChapterData,
  cacheId:cacheId,
  changeChapter:changeChapter,
  setBook:setBook,
  setChapter:setChapter,
  setVersion:setVersion,
  settingsChoices:settingsChoices,
  versionModels:versionModels,
  bookModels:bookModels,
  chapterModels:chapterModels,
  firebasePathAttempts:firebasePathAttempts,
  firestoreDocCandidates:firestoreDocCandidates
};
})(window);
