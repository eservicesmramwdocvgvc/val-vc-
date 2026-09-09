const fs = require('fs');
const path = require('path');
const web = 'c:/Users/LADY P/Downloads/MRA WEB/website';
const decl = JSON.parse(fs.readFileSync(path.join(web,'declarations.json'),'utf8'));
const ro = JSON.parse(fs.readFileSync(path.join(web,'release_orders.json'),'utf8'));

// For a given decl entry, find its corresponding RO by: TPIN match + reference number match
// (decl date format "C 1234 of YYYY/MM/DD" vs RO format "C 1234 of DD/MM/YYYY")
function normRef(r) {
  if (!r) return '';
  const m = r.match(/^C\s+(\d+)\s+of\s+(.+)$/);
  if (!m) return r;
  return 'C ' + m[1];
}

// Build RO index: key = tpin + '|' + normRef => array of RO keys
const roIndex = {};
for (const [k,v] of Object.entries(ro)) {
  const idx = v.tpin + '|' + normRef(v.reference);
  (roIndex[idx] = roIndex[idx] || []).push({k, v});
}

const targets = [
  { badKey:'6023325950009', tpin:'31809215', ref:'C 31057', club:'KAPINYA'},
  { badKey:'603721886000947', tpin:'71753003', ref:'C 9482', club:'ALLAN'},
  { badKey:'603912897192039', tpin:'71753003', ref:'C 25948', club:'VUCHELANE'},
  { badKey:'ZAWERA-DECL', tpin:'73244562', ref:'C 2368', club:'ZAWERA DECL'},
  { badKey:'ZAWERA-RO',   tpin:'73244562', ref:'C 38103', club:'ZAWERA RO'},
];

console.log('=== Pair each target with its matching decl/RO ===');
for (const t of targets) {
  console.log('TARGET:', t.badKey, 'tpin', t.tpin, 'ref', t.ref, t.club);

  // Search decl for matching by TPIN + club + normRef
  const declMatches = [];
  for (const [k,v] of Object.entries(decl)) {
    if (v.tpin !== t.tpin) continue;
    const imp = v['importer/consignee'] || '';
    if (!imp.toUpperCase().includes(t.club.split(' ')[0])) continue;
    declMatches.push({k, ref:v['registration reference'], taxes:v.taxes, value:v['consignment value'], packages:v['total packages']});
  }
  console.log('  DECL matches:', JSON.stringify(declMatches));

  // Search RO index by tpin + normalized ref
  const idx1 = t.tpin + '|' + 'C ' + t.ref.split(' ')[1];
  console.log('  RO index lookup:', idx1, '=>', JSON.stringify(roIndex[idx1]));
  console.log('');
}

console.log('=== Find ALL decl entries that have NO matching RO ===');
const orphanDecl = [];
for (const [dk, dv] of Object.entries(decl)) {
  const idx = dv.tpin + '|' + normRef(dv['registration reference']);
  const ros = roIndex[idx] || [];
  if (ros.length === 0) orphanDecl.push({dk, tpin:dv.tpin, ref:dv['registration reference'], imp:dv['importer/consignee']});
}
console.log('Orphan decl count:', orphanDecl.length);
for (const o of orphanDecl.slice(0,20)) console.log(' ', o);
console.log('...');

console.log('=== Find ALL RO entries that have NO matching decl ===');
const declIndex = {};
for (const [k,v] of Object.entries(decl)) {
  const idx = v.tpin + '|' + normRef(v['registration reference']);
  (declIndex[idx] = declIndex[idx] || []).push(k);
}
const orphanRo = [];
for (const [rk, rv] of Object.entries(ro)) {
  const idx = rv.tpin + '|' + normRef(rv.reference);
  const decls = declIndex[idx] || [];
  if (decls.length === 0) orphanRo.push({rk, tpin:rv.tpin, ref:rv.reference, imp:rv.importer});
}
console.log('Orphan RO count:', orphanRo.length);
for (const o of orphanRo.slice(0,20)) console.log(' ', o);
