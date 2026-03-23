const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('https://wellnest-webapp.onrender.com/api/auth/login', {
            email: 'admin123@gmail.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        try {
            await axios.get('https://wellnest-webapp.onrender.com/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Notifications OK");
        } catch (e) {
            console.log("Notifications FAILED: " + e.response.status + " " + JSON.stringify(e.response.data));
        }

    } catch (e) {
        console.log("Login FAILED");
    }
}
test();
