const fs = require('fs');
const path = require('path');
const web = 'c:/Users/LADY P/Downloads/MRA WEB/website';
const decl = JSON.parse(fs.readFileSync(path.join(web,'declarations.json'),'utf8'));
const ro = JSON.parse(fs.readFileSync(path.join(web,'release_orders.json'),'utf8'));

const badEntries = [
  {key:'6023325950009', tpin:'31809215', ref:'C 31057', club:'KAPINYA'},
  {key:'603721886000947', tpin:'71753003', ref:'C 9482', club:'ALLAN'},
  {key:'603912897192039', tpin:'71753003', ref:'C 25948', club:'VUCHELANE'}
];

console.log('=== Matching in declarations by TPIN/ref/club ===');
for (const be of badEntries) {
  const matches = [];
  for (const [k,v] of Object.entries(decl)) {
    const tpinOk = v.tpin === be.tpin;
    const refOk = (v['registration reference'] || '').includes(be.ref);
    const clubOk = (v['importer/consignee'] || '').includes(be.club);
    if (tpinOk || refOk || clubOk) matches.push({k,tpin:v.tpin,ref:v['registration reference'],imp:v['importer/consignee']});
  }
  console.log('Bad key', be.key, '| tpin', be.tpin, '| ref', be.ref, '| club', be.club);
  console.log('  Matches in declarations:', JSON.stringify(matches, null, 2));
  console.log('');
}

console.log('=== All release orders by these TPINs ===');
for (const tpin of ['31809215','71753003']) {
  const matches = [];
  for (const [k,v] of Object.entries(ro)) {
    if (v.tpin === tpin) matches.push({k, ref: v.reference, imp: v.importer});
  }
  console.log('TPIN', tpin, JSON.stringify(matches, null, 2));
  console.log('');
}

console.log('=== 14-digit fix candidates for non-14 keys ===');
for (const k of ['6023325950009','603721886000947','603912897192039']) {
  if (k.length === 13) {
    const padAfter60 = '60' + ('0' + k.slice(2)).slice(0,12);
    console.log(k, '(13 digits) -> pad position 2 with 0:', padAfter60, 'len=', padAfter60.length);
    // Check if this candidate exists in decl
    console.log('  Exists in decl?', !!decl[padAfter60], '  Exists in ro?', !!ro[padAfter60]);
  }
  if (k.length === 15) {
    for (let i=0; i<15; i++) {
      const cand = k.slice(0,i) + k.slice(i+1);
      if (cand.length === 14 && (!!decl[cand] || !!ro[cand])) {
        console.log(k, '(15 digits) -> remove char', i, '->', cand, '  decl=', !!decl[cand], ' ro=', !!ro[cand]);
      }
    }
    // Also try removing last
    const tr = k.slice(0,14);
    console.log(k, '(15 digits) -> simple truncate to 14:', tr, '  decl=', !!decl[tr], ' ro=', !!ro[tr]);
  }
}
