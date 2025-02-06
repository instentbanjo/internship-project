import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import Coordinates from "@/views/Coordinates.vue";
import WeatherAPi from "@/views/WeatherAPi.vue";
import MapSelect from "@/views/MapSelect.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/weatherApi",
    name: "weatherApi",
    component: WeatherAPi,
  },
  {
    path: "/mapSelect",
    name: "mapSelect",
    component: MapSelect,
  },
  {
    path: "/coordinates",
    name: "coordinates",
    component: Coordinates,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
