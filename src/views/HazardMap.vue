<script setup>
import { shallowRef, onMounted, nextTick } from 'vue';
import "leaflet/dist/leaflet.css";
import * as L from 'leaflet';
import {
  getAllStatePolys,
  getStateHazardExtrems
} from "@/components/geolocation/geomath";

// Optimize reactivity by using shallowRef
const initialMap = shallowRef(null); // Only track root, not deep reactivity
const polygons = shallowRef([]); // Store immutable GeoJSON data

const selectedState = shallowRef('');
const stateHazardExtrems = shallowRef('');

const selectState = async (state) => {
  selectedState.value = state;
  stateHazardExtrems.value = await getStateHazardExtrems(state);
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
    <p v-if="selectedState">{{selectedState}} hazards</p>
    <p v-if="stateHazardExtrems">Average Precipitation: {{ stateHazardExtrems }}mm/h</p>
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
</style>
