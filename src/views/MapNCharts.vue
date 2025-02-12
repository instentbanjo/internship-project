<script setup>
import { shallowRef, onMounted, nextTick } from 'vue';
import "leaflet/dist/leaflet.css";
import * as L from 'leaflet';
import * as d3 from 'd3'
import {
  currentWeatherData,
  getAllStatePolys,
  getHazardExtremesForState
} from "@/components/geolocation/geomath";

// Optimize reactivity by using shallowRef
const initialMap = shallowRef(null); // Only track root, not deep reactivity
const polygons = shallowRef([]); // Store immutable GeoJSON data

const selectedState = shallowRef('');
const stateHazardExtremes = shallowRef();
const cardSelected = shallowRef('details');

const timeSpan = shallowRef(30);

const getChartData = () => {
  const parseTime = d3.timeParse("%Y-%m-%d");
  const data = currentWeatherData.daily.time
    .slice(-timeSpan.value) // Get only the last `timeSpan.value` entries
    .map((date, i) => ({
      date: parseTime(date),
      tempMax: currentWeatherData.daily.temperature_2m_max.slice(-timeSpan.value)[i],
      tempMin: currentWeatherData.daily.temperature_2m_min.slice(-timeSpan.value)[i]
    }));
  return data;
};

const selectState = async (state) => {
  selectedState.value = state;
  stateHazardExtremes.value = null;
  stateHazardExtremes.value = await getHazardExtremesForState(state);
  console.log(stateHazardExtremes.value);
};


const drawChart = async () => {
  await nextTick(); // Ensure DOM is updated

  const width = 800;
  const height = 500;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };

  const svg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height)
    .html(""); // Clear previous chart

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);


  // Convert data into an array of objects
  const data = getChartData();

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width - margin.left - margin.right]);

  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.tempMin) - 5, d3.max(data, d => d.tempMax) + 5])
    .range([height - margin.top - margin.bottom, 0]);

  const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %d"));
  const yAxis = d3.axisLeft(y).ticks(6);

  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(xAxis);

  g.append("g").call(yAxis);

  const maxTemperatureLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.tempMax))
    .curve(d3.curveMonotoneX);

  const minTemperatureLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.tempMin))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", maxTemperatureLine);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", minTemperatureLine);
};


const switchView = () => {
  cardSelected.value = cardSelected.value === 'details' ? 'chart' : 'details';
  if(cardSelected.value == 'chart'){
    console.log(currentWeatherData.daily);
    drawChart()
  }
}


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
      color: "#3f947d",  // Border color
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
    <h2 v-if="selectedState">{{ selectedState }}</h2>
    <div v-if="stateHazardExtremes">
      <button class="switch-btn" @click="switchView">
        Switch View
      </button>
      <div v-if="cardSelected !== 'chart'" class="card">
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
      <div v-else>
        <h2>Chart</h2>
        <svg id="chart"></svg>
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

.switch-btn {
  background: #8d1442; /* Deep red color */
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
  display: block;
  margin: 15px auto;
}

.switch-btn:hover {
  background: #a3174d; /* Slightly lighter red */
  transform: scale(1.05);
}

.switch-btn:active {
  background: #6f0f30;
  transform: scale(0.98);
}


</style>

