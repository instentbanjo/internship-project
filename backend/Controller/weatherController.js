const { getAveragePrecipitationForState, getYearlyWeatherDataForState } = require("../utils/geomath");
const fs = require('fs');
const path = require('path');

const getStateAveragePrecipitation = async (req, res) => {
  const { state, numOfPoints = 10 } = req.params;
  if (!state || !numOfPoints) {
    res.status(400).send(`Bad Request, params: ${state}, ${numOfPoints}`);
    return;
  }
  try {
    const averageInState = await getAveragePrecipitationForState(state, numOfPoints);
    res.status(200).json(averageInState);
  } catch (error) {
    console.error('Error fetching average precipitation for state:', error);
    res.status(500).send('Internal Server Error');
  }
};

const getPointAveragePrecipitation = async (req, res) => {
  const { lat, lon } = req.params;
  if (!lat || !lon) {
    res.status(400).send(`Bad Request, params: ${lat}, ${lon}`);
    return;
  }
  try {
    const averageOnPoint = await getAveragePrecipitationForPoint([lat, lon]);
    res.status(200).json(averageOnPoint);
  } catch (error) {
    console.error('Error fetching average precipitation for point:', error);
    res.status(500).send('Internal Server Error');
  }
};

const getStateWeather = async (req, res) => {
  const { state } = req.body;
  if (!state) {
    res.status(400).send(`Bad Request, params: ${state}`);
    return;
  }
  try {
    const data = fs.readFileSync(path.join(__dirname, 'weatherData.json'), 'utf8');
    const weatherData = JSON.parse(data);
    if (weatherData[state]) {

    res.status(200).json(weatherData[state]);
    } else {
      res.status(501).json(`Weather data not found for state ${state}`);
    }
    } catch (error) {
    console.error('Error fetching average precipitation for state:', error);
    res.status(500).send('Internal Server Error');
  }
};

const updateStateWeather = async (req, res) => {
  const { state } = req.body;
  if (!state) {
    res.status(400).send(`Bad Request, params: ${state}`);
    return;
  }
  try {
    const averageInState = await getYearlyWeatherDataForState(state);

    const filePath = path.join(__dirname, '../data/weatherData/us-states-weather-data.json');
    let weatherData = {};

    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      weatherData = JSON.parse(fileData);
    }

    weatherData[state] = averageInState;
    console.log(weatherData)

    fs.writeFileSync(filePath, JSON.stringify(weatherData, null, 2), 'utf8');

    res.status(200).json(`Weather data updated for ${state}`);
  } catch (error) {
    console.error('Error fetching average precipitation for state:', error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {
  getStateAveragePrecipitation,
  getPointAveragePrecipitation,
  getStateWeather,
  updateStateWeather
};