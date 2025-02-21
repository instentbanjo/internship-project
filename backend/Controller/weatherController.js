const { getAveragePrecipitationForState, getYearlyWeatherDataForState } = require("../utils/geomath");
const fs = require('fs');
const path = require('path');

const getStateAveragePrecipitation = async (req, res) => {
  const { state } = req.body;
  if (!state) {
    res.status(400).send(`Bad Request, params: ${state}`);
    return;
  }
  try {
    const filePath = path.join(__dirname, '../data/weatherData/us-states-weather-data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data[state]) {
      res.status(500).send(`State ${state} not found in data file`);
    }

    const precipitationData = data[state].precipitation_probability_max;
    const totalPoints = Math.min(precipitationData.length);
    const sum = precipitationData.slice(0, totalPoints).reduce((acc, val) => acc + val, 0);
    const average = sum / totalPoints;
    res.status(200).json(average);
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
    console.log(averageOnPoint)
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
    const data = fs.readFileSync(path.join(__dirname, '../data/weatherData/us-states-weather-data.json'), 'utf8');
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