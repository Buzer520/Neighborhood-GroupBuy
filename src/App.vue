<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'

onLaunch(() => {
  console.log('App Launch')
  initCloud()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})

function initCloud() {
  const userStore = useUserStore()
  userStore.loadFromStorage()
}
</script>

<style lang="scss">
page {
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

view, text {
  box-sizing: border-box;
}

image {
  display: block;
}
</style>