<script>
import { collapsed, toggleSidebar, sideBarWidth } from "@/components/sidebar/state";
import SidebarLink from "@/components/sidebar/SidebarLink.vue";
export default {
  name: "SidebarItem",
  components: { SidebarLink },
  props: {},
  setup() {
    return { collapsed, toggleSidebar, sideBarWidth };
  },
};
</script>

<template>
  <div class="sidebar" :style="{ width: sideBarWidth }">
    <h1>
      <span v-if="collapsed">
        <div>P</div>
      </span>
      <span v-else>
        <span>Project</span>
      </span>
    </h1>


    <SidebarLink to="/" icon="fas fa-home">Home</SidebarLink>
    <SidebarLink to="/coordinates" icon="fas fa-location-dot">Coordinates</SidebarLink>
    <SidebarLink to="/weatherAPI" icon="fas fa-cloud-sun-rain">Weather API</SidebarLink>
    <SidebarLink to="/mapSelect" icon="fas fa-map-location-dot">Map Select</SidebarLink>
    <SidebarLink to="/hazardMap" icon="fas fa-map">Hazard Map</SidebarLink>
    <SidebarLink to="/mapCharts" icon="fas fa-chart-line">Hazard Map</SidebarLink>

    <span
      class="collapse-icon"
      :class="{ 'rotate-180': collapsed }"
      @click="toggleSidebar"
    >
      <i class="fas fa-angle-double-left" />
    </span>
  </div>
</template>

<style>
:root {
  --sidebar-bg-color: #333;
  --sidebar-item-hover: #5d5a5a;
  --sidebar-item-active: #868383;
}
</style>
<style scoped>
.sidebar {
  color: white;
  background-color: var(--sidebar-bg-color);

  float: left;
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  bottom: 0;
  padding: 0.5em;

  transition: 0.3s ease;

  display: flex;
  flex-direction: column;
}

.collapse-icon {
  position: absolute;
  bottom: 0;
  padding: 0.75em;

  color: rgba(255, 255, 255, 0.75);
  transition: 0.2s linear;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: 0.2s linear;
}
</style>