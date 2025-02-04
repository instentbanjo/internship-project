import {ref, computed} from "vue";
export const collapsed = ref(false);
export const toggleSidebar = () => (
collapsed.value = !collapsed.value
);
export const SIDE_BAR_WIDTH = 180;
export const SIDE_BAR_WIDTH_COLLAPSED = 38;
export const sideBarWidth = computed(
  () => `${collapsed.value ? SIDE_BAR_WIDTH_COLLAPSED : SIDE_BAR_WIDTH}px`
)