const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());

const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sherides_db'
});
global.db = db;
app.set('io', wss);

const activeRides = new Map();

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const payload = JSON.parse(message);
        switch (payload.event) {
            case 'JOIN_RIDE':
                if (!activeRides.has(payload.rideId)) activeRides.set(payload.rideId, {});
                const ride = activeRides.get(payload.rideId);
                if (payload.role === 'CAPTAIN') ride.captainWs = ws;
                if (payload.role === 'RIDER') ride.riderWs = ws;
                break;
            case 'LOCATION_UPDATE':
                const currentRide = activeRides.get(payload.rideId);
                if (currentRide && currentRide.riderWs && currentRide.riderWs.readyState === WebSocket.OPEN) {
                    currentRide.riderWs.send(JSON.stringify({
                        event: 'CAPTAIN_LOCATION',
                        latitude: payload.latitude,
                        longitude: payload.longitude
                    }));
                }
                break;
        }
    });
});

app.use('/api/v1/rides', require('./routes/rides'));
app.use('/api/v1/dispatch', require('./routes/dispatch'));
app.use('/api/v1/safety', require('./routes/safety'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`SheRides Backend running on port ${PORT}`);
});
            
