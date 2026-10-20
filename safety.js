const express = require('express');
const router = express.Router();

router.post('/sos', async (req, res) => {
    const { rideId, userId, latitude, longitude, timestamp } = req.body;
    try {
        const query = `
            INSERT INTO emergency_incidents (ride_id, user_id, latitude, longitude, status, triggered_at)
            VALUES ($1, $2, $3, $4, 'ACTIVE_DISPATCH', $5)
            RETURNING incident_id;
        `;
        const result = await global.db.query(query, [rideId, userId, latitude, longitude, timestamp]);
        
        req.app.get('io').emit('CRITICAL_SOS_ALERT', {
            incidentId: result.rows[0].incident_id,
            rideId, userId, latitude, longitude
        });

        return res.status(200).json({ success: true, message: "SOS incident dispatched." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
