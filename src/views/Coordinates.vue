<template>
    <h1>Coordinates Finder</h1>
    <p>Enter latitude and longitude to find the state.</p>

    <form @submit.prevent="findStateFromCoords">
      <label for="latitude">Latitude:</label>
      <input type="text" v-model="latitude" id="latitude" required><br><br>

      <label for="longitude">Longitude:</label>
      <input type="text" v-model="longitude" id="longitude" required><br><br>

      <button type="submit">Find State</button>
    </form>

    <div v-if="state" style="margin-top: 20px;">
      <p>Coordinates are located in: {{ state }}</p>
    </div>
</template>

<script>
import { findPointState } from "@/components/geolocation/geomath";

export default {
  name: 'CoordinatesItem',
  data() {
    return {
      latitude: '',
      longitude: '',
      state: '',
    };
  },
  methods: {
    async findStateFromCoords() {
      const coords = [parseFloat(this.longitude), parseFloat(this.latitude)];
      this.state = await findPointState(coords);
    }
  }
};
</script>

<style scoped>
</style>
