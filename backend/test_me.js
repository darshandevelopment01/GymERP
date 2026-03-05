const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: '69a31a915a4133b356770f4b' }, 'gym-erp-super-secret-jwt-key-2026-change-in-production', { expiresIn: '24h' });

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + token
    }
};

const req = http.request(options, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log('Status:', res.statusCode, 'Response:', data));
});
req.on('error', e => console.error(e));
req.end();
