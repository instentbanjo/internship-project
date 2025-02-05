<script>
import {
  getAllStates,
  getAveragePrecipitationForPoint,
  getRainfallForPoint,
  getSamplePointsInState
} from "@/components/geolocation/geomath";

export default {
  name: "WeatherAPI",
  data() {
    return {
      states: [],
      selectedState: "",
      searchQuery: "",
      isDropdownOpen: false,
    };
  },
  computed: {
    filteredStates() {
      return this.states.filter(state =>
        state.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
  created() {
    this.states = getAllStates();
  },
  methods: {
    getSamplePointsInState,
    getAveragePrecipitationForPoint,
    getRainfallForPoint,
    selectState(state) {
      this.selectedState = state;
      this.searchQuery = state;
      this.isDropdownOpen = false;
    },
    handleBlur(event) {
      // Delay closing to allow click event on the dropdown
      setTimeout(() => {
        if (!event.relatedTarget || !event.relatedTarget.classList.contains('dropdown-item')) {
          this.isDropdownOpen = false;
        }
      }, 200);
    }
  }
};
</script>

<template>
  <h1>Weather API</h1>
  <p>Enter a state to get the current weather.</p>

  <div class="dropdown" @focusin="isDropdownOpen = true" @focusout="handleBlur">
    <input
      type="text"
      v-model="searchQuery"
      placeholder="Search state..."
      @focus="isDropdownOpen = true"
    />
    <div v-if="isDropdownOpen" class="dropdown-menu">
      <div
        v-for="state in filteredStates"
        :key="state"
        class="dropdown-item"
        tabindex="0"
        @click="selectState(state)"
      >
        {{ state }}
      </div>
    </div>
  </div>

  <button v-if="selectedState" @click="getSamplePointsInState(selectedState)">Get Weather</button>
  <p v-if="selectedState">Selected State: {{ selectedState }}</p>
</template>

<style scoped>
.dropdown {
  position: relative;
  display: inline-block;
}
input {
  width: 100%;
  padding: 5px;
  margin-bottom: 5px;
}
.dropdown-menu {
  position: absolute;
  width: 100%;
  background: white;
  border: 1px solid #ccc;
  max-height: 150px;
  overflow-y: auto;
}
.dropdown-item {
  padding: 5px;
  cursor: pointer;
}
.dropdown-item:hover, .dropdown-item:focus {
  background-color: #f0f0f0;
}
</style>
