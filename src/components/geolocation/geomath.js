import statesData from "../../data/geojson/us-states.json";  // Adjust the path to the geojson file
import { polygon, multiPolygon, point, booleanPointInPolygon } from "@turf/turf";

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
