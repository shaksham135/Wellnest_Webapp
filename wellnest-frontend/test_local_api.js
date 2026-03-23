const axios = require('axios');
const fs = require('fs');

async function testLocal() {
    let result = {};
    try {
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'admin123@gmail.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log("Logged in to Localhost");

        try {
            const lbRes = await axios.get('http://localhost:8080/api/leaderboard/weekly', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Leaderboard Local OK");
            result.leaderboard = "OK";
        } catch (e) {
            console.log("Leaderboard Local FAIL");
            result.leaderboard_error = e.response ? e.response.data : e.message;
        }

        try {
            const sleepRes = await axios.get('http://localhost:8080/api/trackers/sleep', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Sleep Local OK");
            result.sleep = "OK";
        } catch (e) {
            console.log("Sleep Local FAIL");
            result.sleep_error = e.response ? e.response.data : e.message;
        }

        fs.writeFileSync('local_test_errors.json', JSON.stringify(result, null, 2));
    } catch (e) {
        console.log("Login failed");
        fs.writeFileSync('local_test_errors.json', JSON.stringify({ error: e.message }));
    }
}
testLocal();
