const https = require('https');
https.get('https://muscletime.net/index.html', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const match = data.match(/<script type="module" crossorigin src="(.*?)">/);
        if (match) {
            console.log('JS file:', match[1]);
            https.get('https://muscletime.net' + match[1], (res2) => {
                let jsData = '';
                res2.on('data', chunk => jsData += chunk);
                res2.on('end', () => {
                    const hasSync = jsData.includes('permissions-synced');
                    const hasNewSidebar = jsData.includes('permKey:null');
                    console.log('Has permissions-synced text?', hasSync);
                    console.log('Has permKey:null text?', hasNewSidebar);
                });
            });
        } else {
            console.log('No script tag found!', data.slice(0, 200));
        }
    });
}).on('error', console.error);
