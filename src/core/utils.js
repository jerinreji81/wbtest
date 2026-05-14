/* WorshipBase Phase E.1 utility owner.
   Pure non-storage helpers extracted from the v8.17 legacy shell. Storage-safe wrappers now belong to WBStorage. */
(function(root){
'use strict';

function constants(){return root.WBConstants||{}}
function fallbackSharp(){return ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']}
function fallbackFlat(){return ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']}
function minorKeyName(rootKey){return String(rootKey||'C').replace(/m$/,'')+'m'}
function isMinorKey(k){return /^([A-G](?:#|b)?)m$/i.test(String(k||'').trim())}
function keyRootName(k){var m=String(k||'').trim().match(/^([A-G](?:#|b)?)(?:m|min|minor)?$/i);return m?m[1].replace(/^([a-g])/,function(x){return x.toUpperCase()}):String(k||'C').replace(/m$/,'')}
function normalizeKeyName(k){k=String(k||'').trim();if(!k)return 'C';var m=k.match(/^([A-Ga-g](?:#|b)?)(?:\s*(m|min|minor))?$/);if(!m)return k;var root=m[1].charAt(0).toUpperCase()+m[1].slice(1);return root+(m[2]?'m':'')}
function keyOptionList(minor,flat){var c=constants();var base=flat?(c.NOTES_FLAT||fallbackFlat()):(c.NOTES_SHARP||fallbackSharp());return minor?base.map(minorKeyName):base.slice()}
function isValidMusicKey(k){var c=constants();var sharp=c.NOTES_SHARP||fallbackSharp();var flat=c.NOTES_FLAT||fallbackFlat();k=normalizeKeyName(k);var r=keyRootName(k);return (sharp.indexOf(r)>=0||flat.indexOf(r)>=0) && (!/m$/.test(k)||isMinorKey(k))}
function labelKey(k){return normalizeKeyName(k)}
root.WBUtils={
  minorKeyName:minorKeyName,
  isMinorKey:isMinorKey,
  keyRootName:keyRootName,
  normalizeKeyName:normalizeKeyName,
  keyOptionList:keyOptionList,
  isValidMusicKey:isValidMusicKey,
  labelKey:labelKey
};
})(window);
