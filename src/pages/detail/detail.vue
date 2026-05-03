<template>
  <view class="page-container">
    <swiper class="images-swiper" indicator-dots indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff" v-if="groupBuy">
      <swiper-item v-for="(img, index) in groupBuy.productImages" :key="index">
        <image :src="img" mode="aspectFill" class="product-image" />
      </swiper-item>
    </swiper>

    <view class="content" v-if="groupBuy">
      <view class="status-badge" :class="statusClass">{{ statusText }}</view>
      
      <view class="product-header">
        <text class="product-name">{{ groupBuy.productName }}</text>
        <text class="product-spec" v-if="groupBuy.spec">{{ groupBuy.spec }}</text>
      </view>

      <view class="price-section">
        <view class="price-main">
          <text class="price-symbol">¥</text>
          <text class="price-value">{{ groupBuy.targetPrice.toFixed(2) }}</text>
        </view>
        <view class="tiered-prices" v-if="groupBuy.tieredPrices && groupBuy.tieredPrices.length > 0">
          <text class="tier-label">阶梯价：</text>
          <text class="tier-item" v-for="(tier, index) in groupBuy.tieredPrices" :key="index">
            {{ tier.count }}人¥{{ tier.price }}
          </text>
        </view>
      </view>

      <view class="progress-section">
        <view class="progress-info">
          <text class="progress-label">拼单进度</text>
          <text class="progress-count">{{ groupBuy.currentCount }}/{{ groupBuy.targetCount }}人</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <view class="progress-tips" v-if="groupBuy.status === 'active'">
          <text>还差 <text class="highlight">{{ groupBuy.targetCount - groupBuy.currentCount }}</text> 人成团</text>
        </view>
      </view>

      <view class="info-section">
        <view class="info-item">
          <text class="info-icon">📍</text>
          <text class="info-label">自提地点</text>
          <text class="info-value">{{ groupBuy.pickupPoint }}</text>
        </view>
        <view class="info-item">
          <text class="info-icon">🏘️</text>
          <text class="info-label">所在小区</text>
          <text class="info-value">{{ groupBuy.community }}</text>
        </view>
        <view class="info-item">
          <text class="info-icon">⏰</text>
          <text class="info-label">截止时间</text>
          <text class="info-value">{{ formatDeadline }}</text>
        </view>
      </view>

      <view class="remark-section" v-if="groupBuy.remark">
        <text class="remark-label">商品说明</text>
        <text class="remark-content">{{ groupBuy.remark }}</text>
      </view>

      <view class="creator-section">
        <view class="creator-avatar">
          <text class="avatar-icon">👤</text>
        </view>
        <view class="creator-info">
          <text class="creator-name">发布者</text>
          <text class="creator-time">{{ formatCreateTime }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-bar" v-if="groupBuy">
      <view class="action-left">
        <view class="action-item" @click="goHome">
          <text class="action-icon">🏠</text>
          <text class="action-text">首页</text>
        </view>
        <view class="action-item" @click="goMessage">
          <text class="action-icon">💬</text>
          <text class="action-text">消息</text>
        </view>
      </view>
      <view class="action-right">
        <view class="btn-secondary" v-if="groupBuy.status === 'active'" @click="joinGroup">
          <text>立即参与</text>
        </view>
        <view class="btn-disabled" v-else-if="groupBuy.status === 'success'">
          <text>拼单成功</text>
        </view>
        <view class="btn-disabled" v-else>
          <text>{{ statusText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import type { GroupBuy } from '@/stores/groupBuy'
import { formatDate } from '@/utils'

const userStore = useUserStore()
const groupBuy = ref<GroupBuy | null>(null)

const statusClass = computed(() => {
  if (!groupBuy.value) return ''
  const map: Record<string, string> = {
    active: 'status-active',
    success: 'status-success',
    failed: 'status-failed',
    canceled: 'status-canceled'
  }
  return map[groupBuy.value.status] || ''
})

const statusText = computed(() => {
  if (!groupBuy.value) return ''
  const map: Record<string, string> = {
    active: '进行中',
    success: '已成功',
    failed: '已失败',
    canceled: '已取消'
  }
  return map[groupBuy.value.status] || groupBuy.value.status
})

const progressPercent = computed(() => {
  if (!groupBuy.value) return 0
  return Math.min((groupBuy.value.currentCount / groupBuy.value.targetCount) * 100, 100)
})

const formatDeadline = computed(() => {
  if (!groupBuy.value) return ''
  return formatDate(groupBuy.value.deadline)
})

const formatCreateTime = computed(() => {
  if (!groupBuy.value) return ''
  return `发布于 ${formatDate(groupBuy.value.createdAt)}`
})

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

function goMessage() {
  uni.navigateTo({ url: '/pages/message/message' })
}

function joinGroup() {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    uni.switchTab({ url: '/pages/mine/mine' })
    return
  }
  
  uni.showModal({
    title: '确认参与',
    content: `确认参与「${groupBuy.value?.productName}」的拼单吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '参与中...' })
        setTimeout(() => {
          uni.hideLoading()
          uni.showToast({ title: '参与成功', icon: 'success' })
          if (groupBuy.value) {
            groupBuy.value.currentCount++
          }
        }, 1500)
      }
    }
  })
}

async function loadGroupBuy(id: string) {
  try {
    const mockData: GroupBuy = {
      _id: id,
      creatorId: 'user1',
      community: '幸福小区',
      productName: '新疆阿克苏冰糖心苹果 5斤装',
      productImages: [
        'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20red%20apples%20on%20white%20background%20studio%20lighting&image_size=square',
        'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=apple%20farm%20orchard%20with%20red%20apples%20on%20trees&image_size=square'
      ],
      spec: '单果约200g，精选大果',
      targetPrice: 29.9,
      targetCount: 10,
      currentCount: 7,
      tieredPrices: [{ count: 5, price: 34.9 }, { count: 10, price: 29.9 }, { count: 20, price: 26.9 }],
      status: 'active',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      goodsReceivedAt: null,
      pickupPoint: '小区北门自提点（门卫室旁）',
      remark: '产地直发，顺丰冷链配送，新鲜到家。苹果脆甜多汁，糖心饱满。',
      createdAt: new Date().toISOString()
    }
    groupBuy.value = mockData
  } catch (e) {
    console.error('加载拼单详情失败:', e)
  }
}

onLoad((options) => {
  const id = options?.id || '1'
  loadGroupBuy(id)
})

onMounted(() => {
  userStore.loadFromStorage()
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 140rpx;
}

.images-swiper {
  height: 600rpx;

  .product-image {
    width: 100%;
    height: 100%;
  }
}

.status-badge {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  font-weight: 600;

  &.status-active {
    background: linear-gradient(135deg, #ff6b6b, #ff8787);
    color: #fff;
  }

  &.status-success {
    background: linear-gradient(135deg, #51cf66, #69db7c);
    color: #fff;
  }

  &.status-failed, &.status-canceled {
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
  }
}

.content {
  background: #fff;
  margin-top: -30rpx;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx;
  position: relative;
}

.product-header {
  margin-bottom: 24rpx;

  .product-name {
    font-size: 36rpx;
    font-weight: 700;
    color: #2d3436;
    line-height: 1.4;
  }

  .product-spec {
    font-size: 26rpx;
    color: #636e72;
    margin-top: 12rpx;
  }
}

.price-section {
  padding: 24rpx;
  background: linear-gradient(135deg, #fff5f5, #ffe0e0);
  border-radius: 16rpx;
  margin-bottom: 24rpx;

  .price-main {
    display: flex;
    align-items: baseline;

    .price-symbol {
      font-size: 28rpx;
      color: #ff6b6b;
      font-weight: 600;
    }

    .price-value {
      font-size: 52rpx;
      color: #ff6b6b;
      font-weight: 700;
    }
  }

  .tiered-prices {
    display: flex;
    flex-wrap: wrap;
    margin-top: 16rpx;

    .tier-label {
      font-size: 24rpx;
      color: #636e72;
    }

    .tier-item {
      font-size: 24rpx;
      color: #ff6b6b;
      margin-left: 12rpx;
      padding: 4rpx 12rpx;
      background: rgba(255, 107, 107, 0.1);
      border-radius: 8rpx;
    }
  }
}

.progress-section {
  margin-bottom: 24rpx;

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12rpx;

    .progress-label {
      font-size: 26rpx;
      color: #636e72;
    }

    .progress-count {
      font-size: 26rpx;
      color: #ff6b6b;
      font-weight: 600;
    }
  }

  .progress-bar {
    height: 16rpx;
    background: #f1f3f5;
    border-radius: 8rpx;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff6b6b, #ff8787);
      border-radius: 8rpx;
      transition: width 0.5s ease;
    }
  }

  .progress-tips {
    text-align: center;
    margin-top: 16rpx;
    font-size: 24rpx;
    color: #636e72;

    .highlight {
      color: #ff6b6b;
      font-weight: 600;
      font-size: 32rpx;
    }
  }
}

.info-section {
  margin-bottom: 24rpx;

  .info-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f1f3f5;

    &:last-child {
      border-bottom: none;
    }

    .info-icon {
      font-size: 32rpx;
      margin-right: 16rpx;
    }

    .info-label {
      font-size: 26rpx;
      color: #636e72;
      width: 140rpx;
    }

    .info-value {
      font-size: 26rpx;
      color: #2d3436;
      flex: 1;
    }
  }
}

.remark-section {
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  margin-bottom: 24rpx;

  .remark-label {
    font-size: 26rpx;
    color: #636e72;
    margin-bottom: 12rpx;
    display: block;
  }

  .remark-content {
    font-size: 26rpx;
    color: #2d3436;
    line-height: 1.6;
  }
}

.creator-section {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: linear-gradient(135deg, #f8f9fa, #f1f3f5);
  border-radius: 12rpx;

  .creator-avatar {
    width: 72rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #ff6b6b, #ff8787);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    .avatar-icon {
      font-size: 36rpx;
    }
  }

  .creator-info {
    margin-left: 20rpx;

    .creator-name {
      font-size: 28rpx;
      color: #2d3436;
      font-weight: 500;
    }

    .creator-time {
      font-size: 24rpx;
      color: #b2bec3;
      margin-top: 4rpx;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);

  .action-left {
    display: flex;
    gap: 32rpx;
  }

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .action-icon {
      font-size: 40rpx;
    }

    .action-text {
      font-size: 22rpx;
      color: #636e72;
      margin-top: 4rpx;
    }
  }

  .action-right {
    flex: 1;
    margin-left: 32rpx;
  }

  .btn-secondary {
    padding: 24rpx;
    background: linear-gradient(135deg, #ff6b6b, #ff8787);
    border-radius: 40rpx;
    text-align: center;

    text {
      font-size: 30rpx;
      color: #fff;
      font-weight: 600;
    }
  }

  .btn-disabled {
    padding: 24rpx;
    background: #e9ecef;
    border-radius: 40rpx;
    text-align: center;

    text {
      font-size: 30rpx;
      color: #b2bec3;
    }
  }
}
</style>