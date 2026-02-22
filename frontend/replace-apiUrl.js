import fs from 'fs';
import path from 'path';

const directory = './src';

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!filePath.includes('node_modules')) {
                filelist = walkSync(filePath, filelist);
            }
        } else {
            if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
                filelist.push(filePath);
            }
        }
    });
    return filelist;
}

const files = walkSync(directory);
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace anything matching 'http://localhost:3001/api/something' or `http.../something`
    // with `${import.meta.env.VITE_API_URL}/something`
    const regex = /['"`]http:\/\/localhost:3001\/api([^'"`]*)['"`]/g;

    if (regex.test(content)) {
        content = content.replace(regex, "`${import.meta.env.VITE_API_URL}$1`");
        fs.writeFileSync(file, content, 'utf8');
        count++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Replaced in ${count} files.`);
