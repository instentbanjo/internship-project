<script setup>
import { shallowRef, onMounted, nextTick } from 'vue';
import "leaflet/dist/leaflet.css";
import * as L from 'leaflet';
import {
  getAllStatePolys,
  getHazardExtremesForState
} from "@/components/geolocation/geomath";

// Optimize reactivity by using shallowRef
const initialMap = shallowRef(null); // Only track root, not deep reactivity
const polygons = shallowRef([]); // Store immutable GeoJSON data

const selectedState = shallowRef('');
const stateHazardExtremes = shallowRef();

const selectState = async (state) => {
  selectedState.value = state;
  stateHazardExtremes.value = null;
  stateHazardExtremes.value = await getHazardExtremesForState(state);
  console.log(stateHazardExtremes.value);
};

onMounted(async () => {
  await nextTick(); // Ensure DOM is ready

  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error("Map container not found!");
    return;
  }

  // Initialize Leaflet map
  initialMap.value = L.map('map').setView([39.5720205, -102.0571526], 4);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(initialMap.value);

  // Fetch and set polygons
  polygons.value = getAllStatePolys();

  L.geoJSON(polygons.value, {
    style: {
      color: "#8d1442",  // Border color
      weight: 2,
      opacity: 0.65
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(`<b>${feature.properties.name}</b>`); // Show state name on click
      layer.on('click', () => selectState(feature.properties.name));
    }
  }).addTo(initialMap.value);
});
</script>

<template>
  <div>
    <h1>Hazard Map</h1>
    <div id="map"></div>
    <h2 v-if="selectedState">{{selectedState}}</h2>
    <div v-if="stateHazardExtremes" class="card">
      <h2>Hazard Data for {{ selectedState }}</h2>

      <h3>Rainfall Probability last 30 days: {{stateHazardExtremes.precipitation_percentage_max}}%</h3>

      <div class="hazard-grid">
        <div class="hazard-item">
          <span><i class="fa fa-temperature-arrow-up" /> Avg. Max Temp/Day:</span> <strong>{{ stateHazardExtremes.average_temperature_max }}°F</strong>
        </div>
        <div class="hazard-item">
          <span><i class="fa fa-temperature-arrow-up" /> Max Temp Last Year:</span> <strong>{{ stateHazardExtremes.temperature_max }}°F</strong>
        </div>
        <div class="hazard-item">
          <span><i class="fa fa-temperature-arrow-down" /> Avg. Min Temp/Day:</span> <strong>{{ stateHazardExtremes.average_temperature_min }}°F</strong>
        </div>
        <div class="hazard-item">
          <span><i class="fa fa-temperature-arrow-down" /> Min Temp Last Year:</span> <strong>{{ stateHazardExtremes.temperature_min }}°F</strong>
        </div>
        <div class="hazard-item">
          <span><i class="fa fa-wind" /> Avg. Max Wind Speed/Day:</span> <strong>{{ stateHazardExtremes.average_wind_speed_max }} mph</strong>
        </div>
        <div class="hazard-item">
          <span><i class="fa fa-wind" /> Max Wind Speed Last Year:</span> <strong>{{ stateHazardExtremes.wind_speed_max }} mph</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#map{
  border-radius: 7px;
  height: 400px;
  width: 80%;
  display: flex;
  margin: 30px auto;
}
.card {
  background: #f9f9f9;
  border-radius: 10px;
  padding: 20px;
  width: 60%;
  margin: 20px auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.updated-time {
  color: #555;
  font-size: 14px;
  margin-bottom: 10px;
}

.hazard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.hazard-item {
  background: #ffffff;
  padding: 10px;
  border-radius: 7px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hazard-item span {
  font-weight: 600;
  color: #444;
}

</style>
