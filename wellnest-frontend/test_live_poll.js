const axios = require('axios');
const fs = require('fs');

async function test() {
    let token = null;
    try {
        const loginRes = await axios.post('https://wellnest-webapp.onrender.com/api/auth/login', {
            email: 'admin123@gmail.com',
            password: 'admin123'
        });
        token = loginRes.data.token;
    } catch (e) {
        console.log("Login FAIL");
        return;
    }
    
    let attempts = 0;
    while(attempts < 15) {
        try {
            console.log(`Polling attempt ${attempts+1}...`);
            const lbRes = await axios.get('https://wellnest-webapp.onrender.com/api/leaderboard/weekly', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("It worked! 200 OK!");
            fs.writeFileSync('test_errors.json', JSON.stringify({ status: "WORKS_NOW" }));
            return;
        } catch (e) {
            if (e.response && e.response.data && e.response.data.trace) {
                console.log("FOUND DEPLOYMENT EXCEPTION TRACE!");
                fs.writeFileSync('test_errors.json', JSON.stringify(e.response.data, null, 2));
                return;
            }
            console.log("Still old format. Waiting 30s...");
        }
        await new Promise(r => setTimeout(r, 30000));
        attempts++;
    }
    console.log("Polling timed out");
}
test();
