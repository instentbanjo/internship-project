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
    console.error('Error fetching weather data from file:', error);
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

    let weatherData = {};

    const filePath = path.join(__dirname, '../data/weatherData/us-states-weather-data.json');

    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      console.log('Creating new weather data file');
      fs.writeFileSync(filePath, JSON.stringify(weatherData), 'utf8');
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    weatherData = JSON.parse(fileContent);

    console.log(weatherData)
    weatherData[state] = averageInState;
    console.log(weatherData)

    fs.writeFileSync(filePath, JSON.stringify(weatherData, null, 2), 'utf8');

    res.status(200).json(`Weather data updated for ${state}`);
  } catch (error) {
    console.error('Error updating weather data state:', error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {
  getStateAveragePrecipitation,
  getStateWeather,
  updateStateWeather
};