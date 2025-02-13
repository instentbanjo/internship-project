<script setup>
import {
  shallowRef,
  onMounted,
  nextTick,
  watch
} from 'vue';
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

const heatSelected = shallowRef(true);
const selectedTemps = shallowRef(['min', 'max']);  // Array to track selected options

const timeSpan = shallowRef(30);

watch(timeSpan, () => {
  drawChart();
});

watch(selectedTemps, () => {
  drawChart();
});

watch(heatSelected, () => {
  drawChart();
});

const getChartData = () => {
  const parseTime = d3.timeParse("%Y-%m-%d");
  const data = currentWeatherData.daily.time
    .slice(-timeSpan.value) // Get only the last `timeSpan.value` entries
    .map((date, i) => ({
      date: parseTime(date),
      tempMax: currentWeatherData.daily.temperature_2m_max.slice(-timeSpan.value)[i],
      tempMin: currentWeatherData.daily.temperature_2m_min.slice(-timeSpan.value)[i],
      windMax: currentWeatherData.daily.wind_speed_10m_max.slice(-timeSpan.value)[i],
    }));
  return data;
};

const selectState = async (state) => {
  selectedState.value = state;
  stateHazardExtremes.value = null;
  stateHazardExtremes.value = await getHazardExtremesForState(state);
  if (cardSelected.value == 'chart') {
    drawChart();
  }
};


const drawChart = async () => {
  await nextTick(); // Ensure DOM is updated

  const width = 800;
  const height = 500;
  const margin = { top: 20, right: 30, bottom: 70, left: 50 };

  const svg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height)
    .html(""); // Clear previous chart

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const data = getChartData();


  if (heatSelected.value){

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.tempMin) - 5, d3.max(data, d => d.tempMax) + 5])
      .range([height - margin.top - margin.bottom, 0]);

    const xAxis = d3.axisBottom(x).ticks(12).tickFormat(d3.timeFormat("%b %d"));
    const yAxis = d3.axisLeft(y).ticks(6);

    g.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll("text")  // Rotate text for better readability
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end");

    g.append("g").call(yAxis);

    const maxTemperatureLine = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.tempMax));

    const minTemperatureLine = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.tempMin));

    // Conditionally append lines
    if (selectedTemps.value.includes("max")) {
      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", maxTemperatureLine);
    }

    if (selectedTemps.value.includes("min")) {
      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", minTemperatureLine);
    }

  }
  else {
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.windMax) - 5, d3.max(data, d => d.windMax) + 5])
      .range([height - margin.top - margin.bottom, 0]);

    const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %d"));
    const yAxis = d3.axisLeft(y).ticks(6);

    g.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(xAxis);

    g.append("g").call(yAxis);

    const maxWindLine = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.windMax));

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("d", maxWindLine);

  }

};


const switchView = () => {
  cardSelected.value = cardSelected.value === 'details' ? 'chart' : 'details';
  if(cardSelected.value == 'chart'){
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
    <h1>Map N Chart</h1>
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
        <div id="chart-settings" class="card">
          <h2>Chart Settings</h2>

          <div style="display: flex;">
            <div>

              <div>
                <label for="f-option" class="l-radio">
                  <input type="radio" id="f-option" @click="heatSelected = true" name="selector" tabindex="1" checked>
                  <span>Temperature</span>
                </label>
                <label for="s-option" class="l-radio">
                  <input type="radio" id="s-option" @click="heatSelected = false" name="selector" tabindex="2">
                  <span>Wind</span>
                </label>
              </div>

              <div v-if="heatSelected">
                <label for="a-option" class="l-radio">
                  <input type="checkbox" id="a-option" v-model="selectedTemps" value="max" tabindex="3">
                  <span>Max</span>
                </label>
                <label for="b-option" class="l-radio">
                  <input type="checkbox" id="b-option" v-model="selectedTemps" value="min" tabindex="4">
                  <span>Min</span>
                </label>
              </div>
            </div>
            <div>
              <label class="select" for="slct">
                <select id="slct" v-model="timeSpan" required="required">
                  <option :value="30">Last Month</option>
                  <option :value="90">Last Three Months</option>
                  <option :value="180">Last Six Months</option>
                  <option :value="360">Last Year</option>
                </select>
                <svg>
                  <use xlink:href="#select-arrow-down"></use>
                </svg>
              </label>
              <!-- SVG Sprites-->
              <svg class="sprites">
                <symbol id="select-arrow-down" viewbox="0 0 10 6">
                  <polyline points="1 1 5 5 9 1"></polyline>
                </symbol>
              </svg>
            </div>
          </div>

        </div>
        <svg id="chart"></svg>
        </div>
      </div>
    </div>
</template>


<style scoped>

#chart-settings{
  display: flex;
  justify-content: space-between;
  padding: 15px;
  align-items: center;
  text-align: center;
  flex-direction: column;
  flex-wrap: wrap;
}

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



.l-radio {
  padding: 6px;
  border-radius: 50px;
  display: inline-flex;
  cursor: pointer;
  transition: background 0.2s ease;
  margin: 8px 0;
  -webkit-tap-highlight-color: transparent;
}
.l-radio:hover, .l-radio:focus-within {
  background: rgba(159, 159, 159, 0.1);
}
.l-radio input {
  vertical-align: middle;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: none;
  border: 0;
  box-shadow: inset 0 0 0 1px #9F9F9F;
  box-shadow: inset 0 0 0 1.5px #9F9F9F;
  appearance: none;
  padding: 0;
  margin: 0;
  transition: box-shadow 150ms cubic-bezier(0.95, 0.15, 0.5, 1.25);
  pointer-events: none;
}
.l-radio input:focus {
  outline: none;
}
.l-radio input:checked {
  box-shadow: inset 0 0 0 6px #6743ee;
}
.l-radio span {
  vertical-align: middle;
  display: inline-block;
  line-height: 20px;
  padding: 0 8px;
}

.select {
  position: relative;
  min-width: 200px;
}
.select svg {
  position: absolute;
  right: 12px;
  top: calc(50% - 3px);
  width: 10px;
  height: 6px;
  stroke-width: 2px;
  stroke: #9098a9;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}
.select select {
  -webkit-appearance: none;
  padding: 7px 40px 7px 12px;
  margin: 10px 0px;
  width: 100%;
  border: 1px solid #e8eaed;
  border-radius: 5px;
  background: #fff;
  box-shadow: 0 1px 3px -2px #9098a9;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  transition: all 150ms ease;
}
.select select:required:invalid {
  color: #5a667f;
}
.select select option {
  color: #223254;
}
.select select option[value=""][disabled] {
  display: none;
}
.select select:focus {
  outline: none;
  border-color: #6743ee;
  box-shadow: 0 0 0 2px rgba(0,119,255,0.2);
}
.select select:hover + svg {
  stroke: #6743ee;
}
.sprites {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
  user-select: none;
}


</style>

