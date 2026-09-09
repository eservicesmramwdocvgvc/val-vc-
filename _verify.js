const fs = require('fs');
const path = require('path');
const web = 'c:/Users/LADY P/Downloads/MRA WEB/website';
const decl = JSON.parse(fs.readFileSync(path.join(web,'declarations.json'),'utf8'));
const ro = JSON.parse(fs.readFileSync(path.join(web,'release_orders.json'),'utf8'));

let pass = 0, fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log('  PASS  ', label, detail || ''); }
  else { fail++; console.log('  FAIL  ', label, detail || ''); }
}

console.log('=== VERIFICATION REPORT ===\n');

console.log('[1] All top-level JSON keys are 14 digits:');
for (const [name, data] of [['declarations.json', decl], ['release_orders.json', ro]]) {
  const bad = Object.keys(data).filter(k => k.length !== 14 || !/^\d+$/.test(k));
  check(name + ' keys 14-digit', bad.length === 0, bad.length ? bad.length + ' bad: ' + JSON.stringify(bad) : Object.keys(data).length + ' keys');
}

console.log('\n[2] Internal "code" matches top-level key:');
for (const [name, data] of [['declarations.json', decl], ['release_orders.json', ro]]) {
  const bad = Object.entries(data).filter(([k,v]) => v.code && v.code !== k);
  check(name + ' internal code match', bad.length === 0, bad.length ? JSON.stringify(bad.slice(0,3)) : 'all match');
}

console.log('\n[3] ZAWERA CLUB declaration + RO both findable & paired:');
const zaweraDecl = Object.entries(decl).find(([k,v]) => (v['importer/consignee']||'').includes('ZAWERA'));
const zaweraRo = Object.entries(ro).find(([k,v]) => (v['importer']||'').includes('ZAWERA'));
check('ZAWERA decl exists', !!zaweraDecl, zaweraDecl ? 'key=' + zaweraDecl[0] : 'missing');
check('ZAWERA RO exists', !!zaweraRo, zaweraRo ? 'key=' + zaweraRo[0] : 'missing');
if (zaweraDecl && zaweraRo) {
  // Check reference pairing (both should reference C 2368 ...)
  const dn = zaweraDecl[1]['registration reference'] || '';
  const rn = zaweraRo[1]['reference'] || '';
  function refNum(r){const m=r.match(/C\s+(\d+)/);return m?m[1]:'-';}
  check('ZAWERA references point to same C-number', refNum(dn) === refNum(rn), 'decl='+dn+' RO='+rn);
  check('ZAWERA TPIN match', zaweraDecl[1].tpin === zaweraRo[1].tpin, zaweraDecl[1].tpin + ' vs ' + zaweraRo[1].tpin);
  check('ZAWERA declarant match', (zaweraDecl[1]['declarant code']||'') === (zaweraRo[1].declarant||''), zaweraDecl[1]['declarant code'] + ' vs ' + zaweraRo[1].declarant);
}

console.log('\n[4] Renamed 3 previously broken entries are still accessible in RO:');
for (const newKey of ['60000000000001','60000000000002','60000000000003']) {
  const e = ro[newKey];
  check('RO key '+newKey+' exists and has data', !!e && !!e.tpin, e ? 'TPIN='+e.tpin+' importer='+(e.importer||'').split('\r')[0] : 'MISSING');
}

console.log('\n[5] References normalized (no " OF " uppercase) in RO:');
const hasUpper = Object.entries(ro).filter(([k,v]) => /\s+OF\s+/.test(v.reference || ''));
check('All RO refs use lowercase "of"', hasUpper.length === 0, hasUpper.length ? hasUpper.slice(0,5).map(([k,v])=>k+'='+v.reference) : 'none');

console.log('\n[6] JSON validity by parsing round-trip:');
try { JSON.stringify(decl); JSON.stringify(ro); check('Round-trip JSON valid', true); }
catch(e) { check('Round-trip JSON valid', false, e.message); }

console.log('\n================================');
console.log('TOTAL: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
