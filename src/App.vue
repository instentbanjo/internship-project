<script>
import { defineComponent } from "vue";
import Sidebar from "@/components/sidebar/Sidebars.vue";
import { sideBarWidth } from "@/components/sidebar/state";

export default defineComponent({
  components: { Sidebar },
  setup() {
    return { sideBarWidth };
  },
});


</script>
<template>
  <Sidebar />
  <div :style="{'margin-left': sideBarWidth}">
    <router-view />
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
