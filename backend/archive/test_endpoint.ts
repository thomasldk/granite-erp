import axios from 'axios';

async function test() {
    try {
        console.log('Testing /api/equipment-categories...');
        const res = await axios.get('http://localhost:5006/api/equipment-categories');
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.data);
        }
    }
}

test();
