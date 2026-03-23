const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('https://wellnest-webapp.onrender.com/api/auth/login', {
            email: 'admin123@gmail.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log("Login OK");

        try {
            const lbRes = await axios.get('https://wellnest-webapp.onrender.com/api/leaderboard/weekly', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Leaderboard OK, status: " + lbRes.status);
        } catch (e) {
            console.log("Leaderboard FAILED: " + (e.response ? e.response.status : e.message));
        }

        try {
            const sleepRes = await axios.get('https://wellnest-webapp.onrender.com/api/trackers/sleep', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Sleep GET OK, status: " + sleepRes.status);
        } catch (e) {
            console.log("Sleep GET FAILED: " + (e.response ? e.response.status : e.message));
        }
    } catch (e) {
        console.log("Login FAILED: " + (e.response ? e.response.status : e.message));
    }
}
test();
