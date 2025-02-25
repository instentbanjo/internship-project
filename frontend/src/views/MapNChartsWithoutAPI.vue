<script setup>
import {
  shallowRef,
  onMounted,
  nextTick,
  watch, ref
} from "vue";
import "leaflet/dist/leaflet.css";
import * as L from 'leaflet';
import * as d3 from 'd3'
import {
  getAllStatePolys,
} from "@/components/geolocation/geomath";

// Optimize reactivity by using shallowRef
const initialMap = shallowRef(null); // Only track root, not deep reactivity
const polygons = shallowRef([]); // Store immutable GeoJSON data

const selectedState = ref('');
const selectedWeatherData = ref();
const stateHazardExtremes = ref();
const cardSelected = ref('details');

const isLoading = ref(false)

const heatSelected = ref(true);
const selectedTemps = ref(['min', 'max']);  // Array to track selected options

const timeSpan = ref(30);

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
  const data = selectedWeatherData.value.time
    .slice(-timeSpan.value) // Get only the last `timeSpan.value` entries
    .map((date, i) => ({
      date: parseTime(date),
      tempMax: selectedWeatherData.value.temperature_2m_max.slice(-timeSpan.value)[i],
      tempMin: selectedWeatherData.value.temperature_2m_min.slice(-timeSpan.value)[i],
      windMax: selectedWeatherData.value.wind_speed_10m_max.slice(-timeSpan.value)[i],
    }));
  return data;
};

const getWeatherDataForState = async (state) => {

  let response = await fetch(`http://localhost:5001/weather/state?state=${encodeURIComponent(state)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
  });


  if (!response.ok) {
    console.error("GET request failed. Updating the database...");

    // Send a POST request to update the DB
    const postResponse = await fetch("http://localhost:5001/weather/state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ state })
    });

    if (!postResponse.ok) {
      console.error("POST request failed. Cannot update weather data.");
      return null;
    }

    console.log("Database updated. Retrying GET request...");

    // Retry GET request after successful update
    response = await fetch(`http://localhost:5001/weather/state?state=${encodeURIComponent(state)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      console.error("Second GET request failed. Data may still be unavailable.");
      return null;
    }
  }

  return await response.json();
};
const getWeatherExtremesForState = () => {
  const data = selectedWeatherData.value;
  const lastYear = data.time.length - 365;
  const lastYearData = {
    temperature_max: Math.round(d3.max(data.temperature_2m_max.slice(lastYear))),
    temperature_min: Math.round(d3.min(data.temperature_2m_min.slice(lastYear))),
    wind_speed_max: Math.round(d3.max(data.wind_speed_10m_max.slice(lastYear))),
    average_temperature_max: Math.round(d3.mean(data.temperature_2m_max.slice(lastYear))),
    average_temperature_min: Math.round(d3.mean(data.temperature_2m_min.slice(lastYear))),
    average_wind_speed_max: Math.round(d3.mean(data.wind_speed_10m_max.slice(lastYear))),
    precipitation_percentage_max: Math.round(d3.mean(data.precipitation_probability_max.slice(lastYear)))
  };
  return lastYearData;
};
const selectState = async (state) => {
  isLoading.value = true
  selectedState.value = state;
  stateHazardExtremes.value = null;
  selectedWeatherData.value = await getWeatherDataForState(state);
  stateHazardExtremes.value = getWeatherExtremesForState(state);
  if (cardSelected.value == 'chart') {
    drawChart();
  }
  isLoading.value = false
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

  // Scale setup
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width - margin.left - margin.right]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(data, d => heatSelected.value ? d.tempMin : d.windMax) - 5,
      d3.max(data, d => heatSelected.value ? d.tempMax : d.windMax) + 5
    ])
    .range([height - margin.top - margin.bottom, 0]);

  const xAxis = d3.axisBottom(x).ticks(12).tickFormat(d3.timeFormat("%b %d"));
  const yAxis = d3.axisLeft(y).ticks(6);

  g.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end");

  g.append("g").call(yAxis);

  // Add X-axis label
  g.append("text")
    .attr("class", "axis-label")
    .attr("x", (width - margin.left - margin.right) / 2)
    .attr("y", height - margin.bottom + 50) // Position below the x-axis
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#333")
    .text("Date");

// Add Y-axis label
  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height - margin.top - margin.bottom) / 2)
    .attr("y", -margin.left + 15) // Adjust positioning
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#333")
    .text(heatSelected.value ? "Temperature (°F)" : "Wind Speed (mph)");


  // Line Generators
  const maxTemperatureLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.tempMax));

  const minTemperatureLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.tempMin));

  const maxWindLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.windMax));

  // Draw Lines
  if (heatSelected.value) {
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
  } else {
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "lime")
      .attr("stroke-width", 2)
      .attr("d", maxWindLine);
  }

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("pointer-events", "none");

  const bisectDate = d3.bisector(d => d.date).left;

  // Mouseover Effect
  const mouseMove = function (event) {
    const [mouseX] = d3.pointer(event, this);
    const adjustedMouseX = mouseX - margin.left; // Adjust for margins
    const x0 = x.invert(adjustedMouseX);
    const i = bisectDate(data, x0, 1);
    const d0 = data[i - 1];
    const d1 = data[i];
    if (!d0 || !d1) return;
    const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

    // Remove previous circles before adding new ones
    g.selectAll(".hover-circle").remove();

    if (heatSelected.value) {
      if (selectedTemps.value.includes("max")){
        g.append("circle")
          .attr("class", "hover-circle")
          .attr("cx", x(d.date))
          .attr("cy", y(d.tempMax))
          .attr("r", 6)
          .attr("fill", "red"); // Max temp color
      }
      if (selectedTemps.value.includes("min")){
        g.append("circle")
          .attr("class", "hover-circle")
          .attr("cx", x(d.date))
          .attr("cy", y(d.tempMin))
          .attr("r", 6)
          .attr("fill", "blue"); // Min temp color
      }

    } else {
      // Show only wind speed circle
      g.append("circle")
        .attr("class", "hover-circle")
        .attr("cx", x(d.date))
        .attr("cy", y(d.windMax))
        .attr("r", 6)
        .attr("fill", "lime");
    }

    tooltip.transition().duration(100).style("opacity", 0.9);
    tooltip
      .html(`<strong>${d3.timeFormat("%b %d")(d.date)}</strong><br>
      ${selectedTemps.value.includes("max")
        ? `Max Temp: ${d.tempMax}°F <br>`
        : ""}
      ${selectedTemps.value.includes("min")
        ? `Min Temp: ${d.tempMin}°F <br>`
        : ""}
      ${!selectedTemps.value.includes("max") && !selectedTemps.value.includes("min")
        ? `Wind Speed: ${d.windMax} mph`
        : ""}`)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 30}px`);
  };

  // Remove tooltip and circles on mouse out
  const mouseOut = function () {
    g.selectAll(".hover-circle").remove();
    tooltip.transition().duration(300).style("opacity", 0);
  };

  // Add event listener for mouse interactions
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .on("mousemove", mouseMove)
    .on("mouseout", mouseOut);
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
    <div v-if="isLoading" style="display:flex;flex-direction: column;align-items: center">
      <p>Loading...</p>
      <p>This may take a few seconds.</p>
      <span class="loader">
      </span>
    </div>
    <div v-else>
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
            <div style="display: flex; justify-content: center; align-items: center; width: 100%; position: relative;">
              <!-- Centered Section -->
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="display: flex">
                  <label for="f-option" class="l-radio">
                    <button class="button-4" :class="{'selected-4': heatSelected}" @click="heatSelected = true">Temperature</button>
                  </label>
                  <label for="s-option" class="l-radio">
                    <button class="button-4" :class="{'selected-4': !heatSelected}" @click="heatSelected = false">Wind</button>
                  </label>
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
                    <symbol id="select-arrow-down" viewBox="0 0 10 6">
                      <polyline points="1 1 5 5 9 1"></polyline>
                    </symbol>
                  </svg>
                </div>
              </div>

              <!-- Right-aligned Section (Independent Position) -->
              <div v-if="heatSelected" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); display: flex;flex-direction: column; gap: 10px;">
                <label for="a-option" class="l-radio" style="display: flex; align-items: center;">
                  <input type="checkbox" id="a-option" v-model="selectedTemps" value="max" tabindex="3" class="temp-checkbox max">
                  <span class="line max-line"></span>
                  <span>Max. Temp</span>
                </label>
                <label for="b-option" class="l-radio" style="display: flex; align-items: center;">
                  <input type="checkbox" id="b-option" v-model="selectedTemps" value="min" tabindex="4" class="temp-checkbox min">
                  <span class="line min-line"></span>
                  <span>Min. Temp</span>
                </label>
              </div>
              <div v-else style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); display: flex;flex-direction: column; gap: 10px;">
                <label class="l-radio" style="display: flex; align-items: center;">
                  <input type="checkbox"  tabindex="4" checked disabled class="temp-checkbox min">
                  <span class="line wind-line"></span>
                  <span>Wind Speed</span>
                </label>
              </div>
            </div>
            <div style="display: flex;">
              <svg id="chart"></svg>
            </div>

          </div>
        </div>
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

.tab-button{
  border-style: none;
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


.loader {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  border: 3px solid;
  border-color: #3f947d #3f947d transparent transparent;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}
.loader::after,
.loader::before {
  content: '';
  box-sizing: border-box;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  border: 3px solid;
  border-color: transparent transparent rgba(63, 148, 125, 0.65) rgba(63, 148, 125, 0.65);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-sizing: border-box;
  animation: rotationBack 0.5s linear infinite;
  transform-origin: center center;
}
.loader::before {
  width: 32px;
  height: 32px;
  border-color: #3f947d #3f947d transparent transparent;
  animation: rotation 1.5s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes rotationBack {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}


.tab-button {
  transition: all 0.3s ease-in-out;
  font-weight: 500;
}
.tab-button:hover {
  background-color: #f3f4f6;
}
.tab-button.active {
  border-color: #2563eb;
  color: #2563eb;
}
.tab-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 0.5rem;
}



.temp-checkbox {
  display: none; /* Hide the default checkbox */
}

.l-radio {
  display: flex;
  align-items: center;
}

.l-radio > span{
  font-weight: bold;
  cursor: pointer;
}

.line {
  height: 2px;
  width: 20px;
  margin-right: 5px;
  transition: width 0.3s, opacity 0.3s;
}

.max-line {
  background-color: red;
}

.min-line {
  background-color: blue;
}

.wind-line{
  background-color: lime;
}


.temp-checkbox:not(:checked) + .line {
  opacity: 0.5;
}

.temp-checkbox:not(:checked) + .line + span {
  color: grey;
}


.button-4 {
  appearance: none;
  background-color: #FAFBFC;
  border: 1px solid rgba(27, 31, 35, 0.15);
  border-radius: 6px;
  box-shadow: rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 1px 0 inset;
  box-sizing: border-box;
  color: #24292E;
  cursor: pointer;
  display: inline-block;
  font-family: -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  list-style: none;
  padding: 6px 16px;
  margin: 6px;
  position: relative;
  transition: background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  vertical-align: middle;
  white-space: nowrap;
  word-wrap: break-word;
}

.selected-4{
  background-color: #3f947d;
  border-color: #3f947d;
  color: #ffffff;
}

.button-4:hover {
  background-color: #F3F4F6;
  text-decoration: none;
  transition-duration: 0.1s;
}

.button-4:disabled {
  background-color: #FAFBFC;
  border-color: rgba(27, 31, 35, 0.15);
  color: #959DA5;
  cursor: default;
}

.button-4:active {
  background-color: #EDEFF2;
  box-shadow: rgba(225, 228, 232, 0.2) 0 1px 0 inset;
  transition: none 0s;
}

.button-4:focus {
  outline: 1px transparent;
}

.button-4:before {
  display: none;
}

.button-4:-webkit-details-marker {
  display: none;
}
</style>

