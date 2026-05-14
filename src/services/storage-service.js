/* WorshipBase Phase E.1 storage service owner.
   Source of truth for localStorage-safe access, JSON reads/writes, and migration-safe storage helpers.
   Rules: do not rename keys, do not strip unknown object fields, and do not change data shapes. */
(function(root){
'use strict';

function constants(){return root.WBConstants||{}}
function keys(){return constants().STORAGE_KEYS||{}}

function safeGet(key){
  try{return localStorage.getItem(key)}catch(e){return null}
}
function safeSet(key,val){
  try{localStorage.setItem(key,val);return true}catch(e){return false}
}
function safeRemove(key){
  try{localStorage.removeItem(key);return true}catch(e){return false}
}
function has(key){return safeGet(key)!==null}

function parseJson(raw,fallback){
  if(raw==null||raw==='')return fallback;
  try{
    var parsed=JSON.parse(raw);
    return parsed==null?fallback:parsed;
  }catch(e){return fallback}
}
function readJson(key,fallback){return parseJson(safeGet(key),fallback)}
function writeJson(key,value){return safeSet(key,JSON.stringify(value))}
function readArray(key,fallback){
  var v=readJson(key,Array.isArray(fallback)?fallback:[]);
  return Array.isArray(v)?v:(Array.isArray(fallback)?fallback:[]);
}
function readObject(key,fallback){
  var base=(fallback&&typeof fallback==='object'&&!Array.isArray(fallback))?fallback:{};
  var v=readJson(key,base);
  return v&&typeof v==='object'&&!Array.isArray(v)?v:base;
}
function removeMany(list){
  (list||[]).forEach(function(key){if(key)safeRemove(key)});
}

function readKnown(keyName,fallback){
  var k=keys()[keyName];
  return k?readJson(k,fallback):fallback;
}
function writeKnown(keyName,value){
  var k=keys()[keyName];
  return k?writeJson(k,value):false;
}
function removeKnown(keyName){
  var k=keys()[keyName];
  return k?safeRemove(k):false;
}
function removeKnownMany(keyNames){
  removeMany((keyNames||[]).map(function(name){return keys()[name]}).filter(Boolean));
}

function cloneJsonSafe(value,fallback){
  try{return JSON.parse(JSON.stringify(value))}catch(e){return fallback}
}

/* Future feature guard:
   Set-list entries may later include filters such as sections, lineSnippet, or mergedFrom.
   This helper intentionally preserves unknown fields instead of narrowing entries to songId/key. */
function preserveEntryFields(entry){
  if(!entry||typeof entry!=='object')return entry;
  return Object.assign({},entry);
}
function preserveSetFields(set){
  if(!set||typeof set!=='object')return set;
  var copy=Object.assign({},set);
  if(Array.isArray(copy.items))copy.items=copy.items.map(preserveEntryFields);
  return copy;
}
function preserveSetArray(list){return Array.isArray(list)?list.map(preserveSetFields):[]}

root.WBStorage={
  keys:keys,
  safeGet:safeGet,
  safeSet:safeSet,
  safeRemove:safeRemove,
  has:has,
  parseJson:parseJson,
  readJson:readJson,
  writeJson:writeJson,
  readArray:readArray,
  readObject:readObject,
  removeMany:removeMany,
  readKnown:readKnown,
  writeKnown:writeKnown,
  removeKnown:removeKnown,
  removeKnownMany:removeKnownMany,
  cloneJsonSafe:cloneJsonSafe,
  preserveEntryFields:preserveEntryFields,
  preserveSetFields:preserveSetFields,
  preserveSetArray:preserveSetArray
};
})(window);
