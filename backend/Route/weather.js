const express = require('express');
const router = express.Router();
const weatherController = require('../Controller/weatherController');

router.get('/state', weatherController.getStateWeather);
router.post('/state', weatherController.updateStateWeather);
router.get('/rainfall/state', weatherController.getStateAveragePrecipitation);

module.exports = router;