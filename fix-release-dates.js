const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'release_orders.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const entries = Object.entries(data);

// Fix date formats: DD/MM/YYYY → YYYY/MM/DD
entries.forEach(([key, entry]) => {
    if (entry.reference) {
        // Match pattern like "C 25084 of 09/09/2025"
        entry.reference = entry.reference.replace(/of (\d{2})\/(\d{2})\/(\d{4})/, (match, day, month, year) => {
            return `of ${year}/${month}/${day}`;
        });
    }
});

// Write back to file
fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
console.log('✅ Fixed all date formats!');
console.log('Total entries processed:', entries.length);
