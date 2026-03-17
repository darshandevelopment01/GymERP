const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

try {
    const content = fs.readFileSync(path.join(__dirname, 'src', 'assets', 'MTF Reseat.docx'), 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    console.log('✅ DOCX IS VALID');

    // Try rendering to see if a tag error occurs
    doc.render({
        name: 'Test', email: 'test@admin.com', mobile: '1234567890',
        planName: 'Pro', price: 100, startDate: '01/01/2026', endDate: '01/01/2027',
        memberId: 'MTF-123', branch: 'HQ', city: 'Mumbai', date: '01/01/2026'
    });
    console.log('✅ DOCX RENDERED SUCCESSFULLY');
} catch (e) {
    console.error('❌ ERROR MESSAGE:', e.message);
    if (e.properties) {
        console.error('❌ ERROR PROPERTIES:', e.properties);
    }
}
process.exit(0);
