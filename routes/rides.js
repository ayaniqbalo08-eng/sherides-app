const express = require('express');
const router = express.Router();

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

router.post('/estimate', (req, res) => {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, serviceType } = req.body;
    const distanceKm = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);

    const rates = {
        'BIKE': { baseFare: 50, perKm: 25 },
        'CAR': { baseFare: 150, perKm: 55 },
        'EXPRESS': { baseFare: 80, perKm: 30 }
    };

    const selectedRate = rates[serviceType] || rates['BIKE'];
    let estimatedFare = Math.round(selectedRate.baseFare + (distanceKm * selectedRate.perKm));

    return res.status(200).json({
        success: true,
        distanceKm: distanceKm.toFixed(2),
        estimatedFare,
        currency: 'PKR'
    });
});

module.exports = router;
