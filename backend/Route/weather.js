const express = require('express');
const router = express.Router();
const weatherController = require('../Controller/weatherController');

router.get('/state', weatherController.getStateWeather);
router.post('/state', weatherController.updateStateWeather);

module.exports = router;