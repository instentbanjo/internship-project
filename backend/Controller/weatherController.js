const { getAveragePrecipitationForState, getYearlyWeatherDataForState } = require("../utils/geomath");
const fs = require('fs');
const path = require('path');

const getStateAveragePrecipitation = async (req, res) => {
  const { state } = req.body;
  if (!state) {
    return res.status(400).send(`Bad Request, params: ${state}`);
  }

  try {
    const filePath = path.join(__dirname, '../data/weatherData/us-states-weather-data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data[state]) {
      return res.status(404).send(`State ${state} not found in data file`);
    }

    const precipitationData = data[state].precipitation_probability_max;

    if (!precipitationData || !Array.isArray(precipitationData) || precipitationData.length === 0) {
      return res.status(500).send(`Precipitation data missing or invalid for state ${state}`);
    }

    const totalPoints = precipitationData.length;
    const sum = precipitationData.reduce((acc, val) => acc + val, 0);
    const average = sum / totalPoints;

    return res.status(200).json({ average });
  } catch (error) {
    console.error('Error fetching average precipitation for state:', error);
    return res.status(500).send('Internal Server Error');
  }
};

const getStateWeather = async (req, res) => {
  const { state } = req.query;
  if (!state) {
    res.status(400).send(`Bad Request, query: ${state}`);
    return;
  }
  try {
    const data = fs.readFileSync(path.join(__dirname, '../data/weatherData/us-states-weather-data.json'), 'utf8');
    const weatherData = JSON.parse(data);
    if (weatherData[state]) {
    res.status(200).json(weatherData[state]);
    } else {
      res.status(404).json(`Weather data not found for state ${state}`);
    }
    } catch (error) {
    console.error('Error fetching average precipitation for state:', error);
    res.status(500).send('Internal Server Error');
  }
};

const updateStateWeather = async (req, res) => {
  const { state } = req.body;
  if (!state) {
    res.status(400).send(`Bad Request, body: ${JSON.stringify(req.body)}`);
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
  getStateWeather,
  updateStateWeather
};