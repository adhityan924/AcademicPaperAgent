import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000/api';

async function verify() {
    console.log('Starting verification...');

    // 1. Check if server is running (Health check via papers endpoint)
    try {
        console.log('Checking GET /api/papers...');
        const res = await axios.get(`${API_URL}/papers`);
        console.log('GET /api/papers status:', res.status);
        console.log('Papers found:', res.data.length);
    } catch (error) {
        console.error('Failed to connect to server. Make sure it is running.');
        process.exit(1);
    }

    // 2. Check Graph Data
    try {
        console.log('Checking GET /api/graph...');
        const res = await axios.get(`${API_URL}/graph`);
        console.log('GET /api/graph status:', res.status);
        console.log('Graph elements:', res.data.elements.length);
    } catch (error) {
        console.error('Failed to fetch graph data:', error);
    }

    console.log('Verification complete.');
}

verify();
