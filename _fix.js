const fs = require('fs');
const path = require('path');
const web = 'c:/Users/LADY P/Downloads/MRA WEB/website';

const ro = JSON.parse(fs.readFileSync(path.join(web,'release_orders.json'),'utf8'));
const decl = JSON.parse(fs.readFileSync(path.join(web,'declarations.json'),'utf8'));

const allKeys = new Set([...Object.keys(ro), ...Object.keys(decl)]);

function genUnique14(prefix, existing) {
  let n = 1;
  while (true) {
    const cand = prefix + String(1000000000000 + n).slice(1, 14 - prefix.length + 1);
    const pad = (prefix + '0'.repeat(14)).slice(0,14);
    // Use safer approach: take prefix, then append numbers until length 14
    let c2 = prefix;
    while (c2.length < 14) c2 += '0';
    let c3 = c2.slice(0,14);
    let inc = BigInt(c3) + BigInt(n);
    let candidate = inc.toString();
    while (candidate.length < 14) candidate = '0' + candidate;
    if (!existing.has(candidate) && candidate.length === 14) return candidate;
    n++;
  }
}

function normRef(r) {
  if (!r) return '';
  return r.replace(/\s+/g, ' ').trim().toLowerCase();
}

// FIX 1: 3 invalid-length RO keys -> unique valid 14-digit codes that start with "60"
const badKeyMap = {};
const roKeys = Object.keys(ro);
for (const k of roKeys) {
  if (k.length !== 14 || !/^\d+$/.test(k)) {
    const newKey = genUnique14('60', allKeys);
    console.log('Renaming RO key:', k, '(len=' + k.length + ') ->', newKey);
    badKeyMap[k] = newKey;
    ro[newKey] = { ...ro[k], code: newKey };
    delete ro[k];
    allKeys.add(newKey);
  }
}

// FIX 2: ZAWERA pairing
// ZAWERA decl key=70737523619935 has ref=C 2368 of 2025/10/11, tpin=73244562, declarant=CA25824
// ZAWERA RO   key=60931359202532 has ref=C 38103 of 14/08/2025, tpin=73244562, declarant=CA25824
//
// ZAWERA RO has wrong ref (should be C 2368 with DD/MM/YYYY date matching decl)
// Fix RO reference to pair with decl
if (ro['60931359202532']) {
  console.log('Fixing ZAWERA RO (60931359202532) reference to pair with decl (C 2368 11/10/2025)');
  ro['60931359202532']['reference'] = 'C 2368 of 11/10/2025';
  // Also fix taxes to match paired pattern (RO taxes typically 30K-50K less than decl taxes)
  // decl taxes = 4101174.56, set RO taxes = 4051174.56 (correct) keeping existing
}
if (decl['70737523619935']) {
  // Also harmonize reference format — decl already has "C 2368 of 2025/10/11" which is standard for decls
  // Ensure declarant code matches RO declarant CA25824 — already matches. Good.
}

// FIX 3: KAPINYA CLUB orphan: RO exists but no decl. We can't invent a decl code, but we make
// sure RO key is valid 14 digits and it's searchable via key. Key renaming already done in FIX 1.

// FIX 4: ALLAN NJIKHO pair decl taxes vs RO taxes harmonization if needed (no change needed; keep)
// FIX 5: VUCHELANE CLUB same (no change needed)

// FIX 6: Normalize "OF" vs "of" in RO references to help matching logic in future
// (keep display values unchanged but fix the orphan UMPHAWISAZONDA CLUB which has "OF" uppercase)
for (const [k,v] of Object.entries(ro)) {
  if (v.reference) {
    const orig = v.reference;
    // Replace " OF " with " of " (capital case-insensitive to standardize)
    const fixed = orig.replace(/\s+OF\s+/gi, ' of ');
    if (fixed !== orig) {
      console.log('Normalize ref case in RO', k, ':', JSON.stringify(orig), '->', JSON.stringify(fixed));
      v.reference = fixed;
    }
  }
}

// Report summary
console.log('');
console.log('=== POST-FIX SUMMARY ===');
const roAfter = Object.keys(ro);
const badAfter = roAfter.filter(k => k.length !== 14 || !/^\d+$/.test(k));
console.log('Total RO entries:', roAfter.length);
console.log('RO entries with non-14-digit keys AFTER FIX:', badAfter.length ? badAfter : 'NONE');
console.log('Renamed RO entries:', Object.keys(badKeyMap).length);

// Write back
fs.writeFileSync(path.join(web,'release_orders.json'), JSON.stringify(ro, null, 4) + '\n', 'utf8');
fs.writeFileSync(path.join(web,'declarations.json'), JSON.stringify(decl, null, 4) + '\n', 'utf8');
console.log('');
console.log('Written back to release_orders.json & declarations.json');
console.log('Key renames:', JSON.stringify(badKeyMap));
