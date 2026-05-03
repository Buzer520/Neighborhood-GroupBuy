<template>
  <view class="group-card" @click="goDetail">
    <view class="card-image">
      <image :src="group.productImages[0]" mode="aspectFill" class="product-img" />
      <view class="status-badge" :class="statusClass">{{ statusText }}</view>
    </view>
    <view class="card-content">
      <view class="product-name">{{ group.productName }}</view>
      <view class="product-spec" v-if="group.spec">{{ group.spec }}</view>
      <view class="price-area">
        <view class="current-price">
          <text class="price-symbol">¥</text>
          <text class="price-value">{{ group.targetPrice.toFixed(2) }}</text>
        </view>
        <view class="tier-info" v-if="group.tieredPrices && group.tieredPrices.length > 0">
          <text class="tier-label">阶梯价</text>
          <text class="tier-detail">{{ getTierText }}</text>
        </view>
      </view>
      <view class="progress-area">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <view class="progress-text">
          <text class="current-count">{{ group.currentCount }}</text>
          <text class="target-count">/{{ group.targetCount }}人</text>
        </view>
      </view>
      <view class="footer">
        <view class="community">{{ group.community }}</view>
        <view class="countdown">{{ countdownText }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GroupBuy } from '@/stores/groupBuy'
import { formatCountdown } from '@/utils'

const props = defineProps<{
  group: GroupBuy
}>()

const statusClass = computed(() => {
  const map: Record<string, string> = {
    active: 'status-active',
    success: 'status-success',
    failed: 'status-failed',
    canceled: 'status-canceled'
  }
  return map[props.group.status] || ''
})

const statusText = computed(() => {
  const map: Record<string, string> = {
    active: '进行中',
    success: '已成功',
    failed: '已失败',
    canceled: '已取消'
  }
  return map[props.group.status] || props.group.status
})

const progressPercent = computed(() => {
  return Math.min((props.group.currentCount / props.group.targetCount) * 100, 100)
})

const countdownText = computed(() => {
  return formatCountdown(props.group.deadline)
})

const getTierText = computed(() => {
  if (!props.group.tieredPrices || props.group.tieredPrices.length === 0) return ''
  const tiers = props.group.tieredPrices.sort((a, b) => a.count - b.count)
  return tiers.map(t => `${t.count}人¥${t.price}`).join(' ')
})

function goDetail() {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${props.group._id}`
  })
}
</script>

<style lang="scss" scoped>
.group-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  }
}

.card-image {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  flex-shrink: 0;

  .product-img {
    width: 100%;
    height: 100%;
  }

  .status-badge {
    position: absolute;
    top: 16rpx;
    left: 16rpx;
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    font-weight: 500;

    &.status-active {
      background: linear-gradient(135deg, #ff6b6b, #ff8787);
      color: #fff;
    }

    &.status-success {
      background: linear-gradient(135deg, #51cf66, #69db7c);
      color: #fff;
    }

    &.status-failed, &.status-canceled {
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
    }
  }
}

.card-content {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #2d3436;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-spec {
  font-size: 24rpx;
  color: #636e72;
  margin-top: 8rpx;
}

.price-area {
  display: flex;
  align-items: baseline;
  margin-top: 16rpx;

  .current-price {
    display: flex;
    align-items: baseline;

    .price-symbol {
      font-size: 24rpx;
      color: #ff6b6b;
      font-weight: 600;
    }

    .price-value {
      font-size: 40rpx;
      color: #ff6b6b;
      font-weight: 700;
    }
  }

  .tier-info {
    margin-left: 16rpx;
    display: flex;
    align-items: center;

    .tier-label {
      font-size: 20rpx;
      color: #b2bec3;
      margin-right: 6rpx;
    }

    .tier-detail {
      font-size: 22rpx;
      color: #636e72;
    }
  }
}

.progress-area {
  margin-top: 16rpx;

  .progress-bar {
    height: 12rpx;
    background: #f1f3f5;
    border-radius: 6rpx;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff6b6b, #ff8787);
      border-radius: 6rpx;
      transition: width 0.3s ease;
    }
  }

  .progress-text {
    display: flex;
    align-items: baseline;
    margin-top: 8rpx;
    font-size: 24rpx;

    .current-count {
      color: #ff6b6b;
      font-weight: 600;
    }

    .target-count {
      color: #b2bec3;
    }
  }
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12rpx;

  .community {
    font-size: 24rpx;
    color: #636e72;
  }

  .countdown {
    font-size: 22rpx;
    color: #ff6b6b;
    font-weight: 500;
  }
}
</style>