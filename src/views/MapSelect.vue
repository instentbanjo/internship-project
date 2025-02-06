<script setup>
import { shallowRef, onMounted, nextTick } from 'vue';
import "leaflet/dist/leaflet.css";
import * as L from 'leaflet';
import { getAllStatePolys, getAveragePrecipitationForState } from "@/components/geolocation/geomath";

// Optimize reactivity by using shallowRef
const initialMap = shallowRef(null); // Only track root, not deep reactivity
const polygons = shallowRef([]); // Store immutable GeoJSON data

const selectedState = shallowRef('');
const averagePrecipitationForState = shallowRef('');

const selectState = async (state) => {
  selectedState.value = state;
  averagePrecipitationForState.value = await getAveragePrecipitationForState(state);
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
      color: "#5c2696",  // Border color
      weight: 2,
      opacity: 0.65
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(`<b>${feature.properties.name}</b>`); // Show state name on click
      // Call the selectState function asynchronously outside of the leaflet callback
      layer.on('click', () => selectState(feature.properties.name));
    }
  }).addTo(initialMap.value);
});
</script>

<template>
  <div>
    <h3>An interactive leaflet map</h3>
    <div id="map"></div>
    <p v-if="averagePrecipitationForState">Average Precipitation: {{ averagePrecipitationForState }}mm/h</p>
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
