<script setup>

</script>

<template>
  <div class="body">
    <h1>Next Steps</h1>
    My next steps with the Project would be:
    <ol class="alternating-colors">
      <li>
        <strong>City Weather</strong>
        <p>
          Add the weather data of the specific city you click on the map additionally to the state weather data.
        </p>
      </li>
      <li>
        <strong>Noaa data</strong>
        <p>
          Use the noaa data for the weather norms, and include seasonal norms for more precise hazards.
        </p>
      </li>
      <li>
        <strong>Quote engine</strong>
        <p>
          Calculate the quote for the selected place.
        </p>
      </li>
    </ol>
  </div>

</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap");
.body {
  font-family: "Space Mono", monospace;
  display: flex;
  flex-direction: column;
  max-width: 420px;
  padding: 32px;
  margin: 60px auto;
  border: 1px solid #eee;
  box-shadow: 0px 12px 24px rgba(0, 0, 0, 0.06);
}

* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizelegibility;
  letter-spacing: -0.25px;
}

li {
  color: #4F4F4F;
  padding-left: 16px;
  margin-top: 24px;
  position: relative;
  font-size: 16px;
  line-height: 20px;
  list-style: none;
}

strong {
  color: #292929;
}

</style>