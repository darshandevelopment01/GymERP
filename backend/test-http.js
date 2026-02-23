async function run() {
    const loginRes = await fetch('http://127.0.0.1:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "admin@muscletime.com", password: "admin" })
    });
    const loginJson = await loginRes.json();
    const token = loginJson.token;
    console.log("Token:", token ? "Exists" : loginJson);

    const result = await fetch('http://127.0.0.1:3001/api/employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: "Test HTTP",
            email: "httptest@test.com",
            phone: "1111222233",
            gender: "Male"
        })
    });
    const json = await result.json();
    console.log('Status:', result.status);
    console.log('Response:', json);
}

run();
