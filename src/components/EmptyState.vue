<template>
  <view class="empty-state">
    <view class="empty-icon">
      <text class="icon-text">{{ iconText }}</text>
    </view>
    <view class="empty-title">{{ title }}</view>
    <view class="empty-desc">{{ description }}</view>
    <view class="empty-action" v-if="buttonText" @click="$emit('action')">
      <text class="action-text">{{ buttonText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  iconText?: string
  title?: string
  description?: string
  buttonText?: string
}>()

defineEmits<{
  action: []
}>()
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5f7fa, #e9ecef);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;

  .icon-text {
    font-size: 64rpx;
    opacity: 0.5;
  }
}

.empty-title {
  font-size: 32rpx;
  color: #2d3436;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #b2bec3;
  text-align: center;
  line-height: 1.6;
}

.empty-action {
  margin-top: 48rpx;
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  border-radius: 40rpx;

  .action-text {
    font-size: 28rpx;
    color: #fff;
    font-weight: 500;
  }
}
</style>