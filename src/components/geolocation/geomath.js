import statesData from "../../data/geojson/us-states.json";  // Adjust the path to the geojson file
import { polygon, multiPolygon, point, booleanPointInPolygon } from "@turf/turf";

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
  pastMonth.setMonth(currentDate.getMonth() - 1); // Subtract one month from the current date

  const startDate = pastMonth.toISOString().split('T')[0]; // Format the date as YYYY-MM-DD
  const endDate = currentDate.toISOString().split('T')[0]; // Format the current date as YYYY-MM-DD

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${pointCoord[0]}&longitude=${pointCoord[1]}&hourly=precipitation&timezone=GMT&start_date=${startDate}&end_date=${endDate}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const precipitationArray = data.hourly.precipitation;

    const sum = precipitationArray.reduce((acc, value) => acc + value, 0);

    const averagePrecipitation = sum / precipitationArray.length;

    console.log('Average Precipitation:', averagePrecipitation);

  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

export const getSamplePointsInState = (state) => {
  let statePoly;
  let currentState = statesData.features.filter((s) => s.properties.name === state)[0];
  if (currentState.geometry.type === "Polygon") {
    statePoly = polygon([currentState.geometry.coordinates[0]], { name: currentState.properties.name });
  }
  //when a state is in multiple polygons
  else if (currentState.geometry.type === "MultiPolygon") {
    statePoly = multiPolygon(currentState.geometry.coordinates, { name: currentState.properties.name });
  }

  console.log(statePoly)
  // let points = [];

  // while (points.length < count) {
  //   const [lon, lat] = randomPoint(1, { statePoly.bbox }).features[0].geometry.coordinates;
  //   if (isPointInState([lon, lat], state)) {
  //     points.push([lon, lat]);
  //   }
  // }

};


export const findPointState = (coord) => {
  for (const feature of statesData.features) {
    if (isPointInState(coord, feature)) {
      console.log("State found:", feature.properties.name);
      return feature.properties.name;
    }
  }
  return 'State not found';
};

export const isPointInState = (pointCoords, state) => {
  let poly;
  //when a state is in a single polygon
  if (state.geometry.type === "Polygon") {
    poly = polygon([state.geometry.coordinates[0]], { name: state.properties.name });
  }
  //when a state is in multiple polygons
  else if (state.geometry.type === "MultiPolygon") {
    poly = multiPolygon(state.geometry.coordinates, { name: state.properties.name });
  }
  //when the JSON data is wrong?
  else {
    console.error("Unsupported geometry type:", state.geometry.type);
    return false;
  }

  const pt = point(pointCoords);
  return booleanPointInPolygon(pt, poly);
};
