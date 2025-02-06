import statesData from "../../data/geojson/us-states.json"; // Adjust the path to the geojson file
import { bbox, booleanPointInPolygon, multiPolygon, point, polygon, randomPoint } from "@turf/turf";

export const getAllStates = () => {
  const states = [];
  for (const feature of statesData.features) {
      states.push(feature.properties.name);
  }
  return states
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

export const getAveragePrecipitationForState = async (state, numOfPoints = 5) => {

  let averageInState = 0;

  for (const point1 of getSamplePointsInState(numOfPoints, state)) {
    const averageOnPoint = await getAveragePrecipitationForPoint([point1[1], point1[0]]);
    averageInState += averageOnPoint;
  }
  console.log(averageInState / numOfPoints)
  return averageInState / numOfPoints;
}

export const getSamplePointsInState = (count, state) => {
  let statePoly;
  let currentState = statesData.features.filter((s) => s.properties.name === state)[0];
  if (currentState.geometry.type === "Polygon") {
    statePoly = polygon([currentState.geometry.coordinates[0]], { name: currentState.properties.name });
  }
  //when a state is in multiple polygons
  else if (currentState.geometry.type === "MultiPolygon") {
    statePoly = multiPolygon(currentState.geometry.coordinates, { name: currentState.properties.name });
  }

  let points = [];
  while (points.length < count) {
    const [lon, lat] = randomPoint(1,  {bbox: bbox(statePoly)}).features[0].geometry.coordinates;
    if (isPointInStatePoly([lon, lat], statePoly)) {
      points.push([lon, lat]);
    }
  }
return points;

};


export const findPointState = (coord) => {
  for (const feature of statesData.features) {
    if (isPointInStatePoly(coord, feature)) {
      return feature.properties.name;
    }
  }
  return 'State not found';
};

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
