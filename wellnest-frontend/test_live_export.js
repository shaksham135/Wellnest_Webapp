const axios = require('axios');
const fs = require('fs');

async function test() {
    let result = {};
    try {
        const loginRes = await axios.post('https://wellnest-webapp.onrender.com/api/auth/login', {
            email: 'admin123@gmail.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        
        try {
            const lbRes = await axios.get('https://wellnest-webapp.onrender.com/api/leaderboard/weekly', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            result.leaderboard = lbRes.data;
        } catch (e) {
            result.leaderboard_error = e.response ? e.response.data : e.message;
        }

        try {
            const sleepRes = await axios.get('https://wellnest-webapp.onrender.com/api/trackers/sleep', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            result.sleep = sleepRes.data;
        } catch (e) {
            result.sleep_error = e.response ? e.response.data : e.message;
        }

        fs.writeFileSync('test_errors.json', JSON.stringify(result, null, 2));
    } catch (e) {
        fs.writeFileSync('test_errors.json', JSON.stringify({ error: e.message }));
    }
}
test();
