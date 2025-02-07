import statesData from "../../data/geojson/us-states.json"; // Adjust the path to the geojson file
import { bbox, booleanPointInPolygon, center, multiPolygon, point, polygon, randomPoint } from "@turf/turf";

export const getAllStates = () => {
  const states = [];
  for (const feature of statesData.features) {
      states.push(feature.properties.name);
  }
  return states
}
export const getAveragePrecipitationForState = async (state, numOfPoints = 10) => {

  let averageInState = 0;

  for (const point1 of getSamplePointsInState(numOfPoints, state)) {
    const averageOnPoint = await getAveragePrecipitationForPoint([point1[1], point1[0]]);
    averageInState += averageOnPoint;
  }
  return averageInState / numOfPoints;
}
export const getAveragePrecipitationForPoint = async (pointCoord) => {
  const currentDate = new Date();
  const pastMonth = new Date(currentDate);
  pastMonth.setMonth(currentDate.getMonth() - 1);

  const startDate = pastMonth.toISOString().split('T')[0];
  const endDate = currentDate.toISOString().split('T')[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${pointCoord[0]}&longitude=${pointCoord[1]}&hourly=precipitation&timezone=GMT&start_date=${startDate}&end_date=${endDate}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const precipitationArray = data.hourly.precipitation;

    const sum = precipitationArray.reduce((acc, value) => acc + value, 0);

    return sum / precipitationArray.length;

  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};
export const getHazardExtremsForPoint = async (pointCoord) => {
  const currentDate = new Date();
  const pastMonth = new Date(currentDate);
  pastMonth.setMonth(currentDate.getMonth() - 12);

  const startDate = pastMonth.toISOString().split('T')[0];
  const endDate = currentDate.toISOString().split('T')[0];

  const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${pointCoord[1]}&longitude=${pointCoord[0]}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max&precipitation_unit=inch`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    const average_temeperature_max = data.daily.temperature_2m_max.reduce((acc, value) => acc + value, 0) / data.daily.temperature_2m_max.length;
    const average_temeperature_min = data.daily.temperature_2m_min.reduce((acc, value) => acc + value, 0) / data.daily.temperature_2m_min.length;
    const average_wind_speed_max = data.daily.wind_speed_10m_max.reduce((acc, value) => acc + value, 0) / data.daily.wind_speed_10m_max.length;
    const temperature_max = Math.max(...data.daily.temperature_2m_max);
    const temperature_min = Math.min(...data.daily.temperature_2m_min);
    const wind_speed_max = Math.max(...data.daily.wind_speed_10m_max);

    return {
      average_temeperature_max: average_temeperature_max,
      average_temeperature_min: average_temeperature_min,
      average_wind_speed_max: average_wind_speed_max,
      temperature_max: temperature_max,
      temperature_min: temperature_min,
      wind_speed_max: wind_speed_max
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }

}
export const getHazardExtremesForState = async (state) => {
  let finalAverage = []
  let average_temeperature_max = []
  let average_temeperature_min = []
  let average_wind_speed_max = []
  let temperature_max = []
  let temperature_min = []
  let wind_speed_max = []

  let points = getConsistentPointsInState(state);
  for (const point of points) {
    const index = points.indexOf(point);
    const hazard = await getHazardExtremsForPoint(point);
    if (index === 4){
      average_temeperature_max.push(hazard.average_temeperature_max)
      average_temeperature_min.push(hazard.average_temeperature_min)
      average_wind_speed_max.push(hazard.average_wind_speed_max)
      temperature_max.push(hazard.temperature_max)
      temperature_min.push(hazard.temperature_min)
      wind_speed_max.push(hazard.wind_speed_max)

    }
    average_temeperature_max.push(hazard.average_temeperature_max)
    average_temeperature_min.push(hazard.average_temeperature_min)
    average_wind_speed_max.push(hazard.average_wind_speed_max)
    temperature_max.push(hazard.temperature_max)
    temperature_min.push(hazard.temperature_min)
    wind_speed_max.push(hazard.wind_speed_max)

  }
  finalAverage.average_temeperature_max = average_temeperature_max.reduce((acc, value) => acc + value, 0) / average_temeperature_max.length;
  finalAverage.average_temeperature_min = average_temeperature_min.reduce((acc, value) => acc + value, 0) / average_temeperature_min.length;
  finalAverage.average_wind_speed_max = average_wind_speed_max.reduce((acc, value) => acc + value, 0) / average_wind_speed_max.length;
  finalAverage.temperature_max = temperature_max.reduce((acc, value) => acc + value, 0) / temperature_max.length;
  finalAverage.temperature_min = temperature_min.reduce((acc, value) => acc + value, 0) / temperature_min.length;
  finalAverage.wind_speed_max = wind_speed_max.reduce((acc, value) => acc + value, 0) / wind_speed_max.length;
  finalAverage.timeCode = new Date().toISOString().split('T')[0];
  finalAverage.state = state;
  return finalAverage;
}
export const getStatePolygon = (state) => {
  let currentState = statesData.features.filter((s) => s.properties.name === state)[0];
  if (currentState.geometry.type === "Polygon") {
    return  polygon([currentState.geometry.coordinates[0]], { name: currentState.properties.name });
  }
  //when a state is in multiple polygons
  else if (currentState.geometry.type === "MultiPolygon") {
    return multiPolygon(currentState.geometry.coordinates, { name: currentState.properties.name });
  }
}
export const findPointState = (coord) => {
  for (const feature of statesData.features) {
    if (isPointInStatePoly(coord, feature)) {
      return feature.properties.name;
    }
  }
  return 'State not found';
};
export const getAllStatePolys = () => {

  let allPolygons = [];
  for (const feature of statesData.features) {
    if (feature.geometry.type === "Polygon") {
      allPolygons.push(polygon([feature.geometry.coordinates[0]], { name: feature.properties.name }));
    }
    if (feature.geometry.type === "MultiPolygon") {
      allPolygons.push(multiPolygon(feature.geometry.coordinates, { name: feature.properties.name }));
    }
  }
  return allPolygons;
}
export const isPointInStatePoly = (pointCoords, statePoly) => {
  let poly;
  //when a state is in a single polygon
  if (statePoly.geometry.type === "Polygon") {
    poly = polygon([statePoly.geometry.coordinates[0]], { name: statePoly.properties.name });
  }
  //when a state is in multiple polygons
  else if (statePoly.geometry.type === "MultiPolygon") {
    poly = multiPolygon(statePoly.geometry.coordinates, { name: statePoly.properties.name });
  }
  //when the JSON data is wrong?
  else {
    console.error("Unsupported geometry type:", statePoly.geometry.type);
    return false;
  }

  const pt = point(pointCoords);
  return booleanPointInPolygon(pt, poly);
};
export const getConsistentPointsInState = (state) => {
  let points = [];
  let statePoly = getStatePolygon(state);
  let stateBbox = calculateBBox(getStatePolygon(state));
  points.push([stateBbox[0], stateBbox[1]], [stateBbox[0], stateBbox[3]], [stateBbox[2], stateBbox[1]], [stateBbox[2], stateBbox[3]]);
  points.push(center(statePoly).geometry.coordinates)
  return points;
};
export const getSamplePointsInState = (count, state) => {
  let statePoly = getStatePolygon(state)
  let points = [];
  while (points.length < count) {
    const [lon, lat] = randomPoint(1,  {bbox: bbox(statePoly)}).features[0].geometry.coordinates;
    if (isPointInStatePoly([lon, lat], statePoly)) {
      points.push([lon, lat]);
    }
  }
  return points;

};
function calculateBBox(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  if (poly.geometry.type === "Polygon") {
    poly.geometry.coordinates[0].forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
  }
  else if (poly.geometry.type === "MultiPolygon") {
    poly.geometry.coordinates.forEach(polygon => {
      polygon[0].forEach(([x, y]) => {
        //API only accepts until -180
        if (x < -180){
          x = -180
        }
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
    });
  }

  return [minX, minY, maxX, maxY];
}
