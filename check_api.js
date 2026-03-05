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
                    const apiMatch = jsData.match(/https?:\/\/[a-zA-Z0-9.-]+\.app\/api|https?:\/\/api\.muscletime\.net|https?:\/\/muscletime-backend([a-zA-Z0-9.-]+)?\.vercel\.app/g);
                    console.log('Found API URLs:', [...new Set(apiMatch)]);
                });
            });
        } else {
            console.log('No script tag found!', data.slice(0, 500));
        }
    });
}).on('error', console.error);
