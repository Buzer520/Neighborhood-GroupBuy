<template>
  <view class="page-container">
    <view class="pickup-header">
      <view class="header-icon">📍</view>
      <view class="header-info">
        <text class="header-title">自提管理</text>
        <text class="header-desc">查看和管理您的自提订单</text>
      </view>
    </view>

    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'pending' }" 
        @click="activeTab = 'pending'"
      >
        <text>待提货</text>
        <view class="tab-badge" v-if="pendingOrders.length">{{ pendingOrders.length }}</view>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'picked' }" 
        @click="activeTab = 'picked'"
      >
        <text>已提货</text>
      </view>
    </view>

    <view class="order-list" v-if="currentOrders.length > 0">
      <view class="order-card" v-for="order in currentOrders" :key="order._id">
        <view class="order-header">
          <view class="order-id">订单号：{{ order._id }}</view>
          <view class="order-status" :class="order.status">{{ order.statusText }}</view>
        </view>
        
        <view class="order-content">
          <image :src="order.groupInfo.productImages[0]" mode="aspectFill" class="order-image" />
          <view class="order-info">
            <text class="product-name">{{ order.groupInfo.productName }}</text>
            <text class="product-spec" v-if="order.groupInfo.spec">{{ order.groupInfo.spec }}</text>
            <view class="order-detail">
              <text class="order-price">¥{{ order.totalAmount.toFixed(2) }}</text>
              <text class="order-quantity">x{{ order.quantity }}</text>
            </view>
          </view>
        </view>

        <view class="order-footer">
          <view class="pickup-info">
            <text class="pickup-label">自提点：</text>
            <text class="pickup-value">{{ order.groupInfo.pickupPoint }}</text>
          </view>
          <view class="pickup-code" v-if="order.pickupCode">
            <text class="code-label">提货码：</text>
            <text class="code-value">{{ order.pickupCode }}</text>
          </view>
        </view>

        <view class="order-actions">
          <view class="btn-primary" v-if="order.status === 'paid'" @click="confirmPickup(order)">
            <text>确认提货</text>
          </view>
          <view class="btn-secondary" v-else-if="order.status === 'pending'">
            <text>等待付款</text>
          </view>
          <view class="btn-success" v-else>
            <text>已完成</text>
          </view>
        </view>
      </view>
    </view>

    <EmptyState 
      v-else 
      :icon-text="activeTab === 'pending' ? '📦' : '✅'"
      :title="activeTab === 'pending' ? '暂无待提货订单' : '暂无已提货订单'"
      :description="activeTab === 'pending' ? '付款成功后，商品到达自提点会通知您' : '所有订单都已完成提货'"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onMounted } from '@dcloudio/uni-app'
import EmptyState from '@/components/EmptyState.vue'

interface Order {
  _id: string
  groupId: string
  userId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  deposit: number
  status: 'pending' | 'wait_pay' | 'paid' | 'picked' | 'refunded'
  statusText: string
  pickupCode: string
  groupInfo: {
    productName: string
    productImages: string[]
    spec?: string
    pickupPoint: string
  }
}

const activeTab = ref<'pending' | 'picked'>('pending')

const orders = ref<Order[]>([
  {
    _id: 'ORD20240115001',
    groupId: 'group1',
    userId: 'user1',
    quantity: 2,
    unitPrice: 29.9,
    totalAmount: 59.8,
    deposit: 1,
    status: 'paid',
    statusText: '待提货',
    pickupCode: 'A1234',
    groupInfo: {
      productName: '新疆阿克苏冰糖心苹果 5斤装',
      productImages: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20red%20apples%20on%20white%20background&image_size=square'],
      spec: '单果约200g',
      pickupPoint: '小区北门自提点'
    }
  },
  {
    _id: 'ORD20240114002',
    groupId: 'group2',
    userId: 'user1',
    quantity: 1,
    unitPrice: 39.9,
    totalAmount: 39.9,
    deposit: 0,
    status: 'picked',
    statusText: '已完成',
    pickupCode: 'B5678',
    groupInfo: {
      productName: '云南沃柑 8斤装',
      productImages: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20orange%20mandarin%20oranges%20on%20white%20background&image_size=square'],
      pickupPoint: '小区南门超市'
    }
  },
  {
    _id: 'ORD20240113003',
    groupId: 'group3',
    userId: 'user1',
    quantity: 1,
    unitPrice: 45.9,
    totalAmount: 45.9,
    deposit: 1,
    status: 'pending',
    statusText: '待付款',
    pickupCode: '',
    groupInfo: {
      productName: '农家土鸡蛋 30枚',
      productImages: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20brown%20eggs%20in%20basket%20on%20white%20background&image_size=square'],
      pickupPoint: '小区门口自提'
    }
  }
])

const pendingOrders = computed(() => {
  return orders.value.filter(o => o.status !== 'picked' && o.status !== 'refunded')
})

const pickedOrders = computed(() => {
  return orders.value.filter(o => o.status === 'picked')
})

const currentOrders = computed(() => {
  return activeTab.value === 'pending' ? pendingOrders.value : pickedOrders.value
})

function confirmPickup(order: Order) {
  uni.showModal({
    title: '确认提货',
    content: `确认已提取「${order.groupInfo.productName}」吗？`,
    success: (res) => {
      if (res.confirm) {
        order.status = 'picked'
        order.statusText = '已完成'
        uni.showToast({ title: '提货成功', icon: 'success' })
      }
    }
  })
}

onMounted(() => {
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.pickup-header {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);

  .header-icon {
    width: 80rpx;
    height: 80rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
  }

  .header-info {
    margin-left: 20rpx;

    .header-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #fff;
      display: block;
    }

    .header-desc {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 8rpx;
    }
  }
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 24rpx;
}

.tab-item {
  position: relative;
  flex: 1;
  padding: 28rpx 0;
  text-align: center;

  text {
    font-size: 28rpx;
    color: #636e72;
  }

  .tab-badge {
    position: absolute;
    top: 16rpx;
    right: 50%;
    transform: translateX(30rpx);
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 8rpx;
    background: #ff6b6b;
    border-radius: 16rpx;
    font-size: 20rpx;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.active {
    text {
      color: #ff6b6b;
      font-weight: 600;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 6rpx;
      background: linear-gradient(90deg, #ff6b6b, #ff8787);
      border-radius: 3rpx;
    }
  }
}

.order-list {
  padding: 24rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .order-id {
    font-size: 24rpx;
    color: #b2bec3;
  }

  .order-status {
    font-size: 24rpx;
    padding: 6rpx 16rpx;
    border-radius: 16rpx;

    &.pending {
      background: #fff3cd;
      color: #856404;
    }

    &.paid {
      background: #cce5ff;
      color: #004085;
    }

    &.picked {
      background: #d4edda;
      color: #155724;
    }
  }
}

.order-content {
  display: flex;

  .order-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
  }

  .order-info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .product-name {
      font-size: 28rpx;
      font-weight: 600;
      color: #2d3436;
      display: block;
    }

    .product-spec {
      font-size: 24rpx;
      color: #636e72;
      margin-top: 8rpx;
    }

    .order-detail {
      display: flex;
      justify-content: space-between;
      margin-top: 12rpx;

      .order-price {
        font-size: 32rpx;
        color: #ff6b6b;
        font-weight: 700;
      }

      .order-quantity {
        font-size: 24rpx;
        color: #636e72;
      }
    }
  }
}

.order-footer {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f1f3f5;

  .pickup-info, .pickup-code {
    display: flex;
    margin-bottom: 12rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .pickup-label, .code-label {
      font-size: 24rpx;
      color: #636e72;
      width: 120rpx;
    }

    .pickup-value {
      font-size: 24rpx;
      color: #2d3436;
    }

    .code-value {
      font-size: 28rpx;
      color: #ff6b6b;
      font-weight: 600;
      font-family: monospace;
    }
  }
}

.order-actions {
  margin-top: 20rpx;

  .btn-primary {
    padding: 20rpx;
    background: linear-gradient(135deg, #ff6b6b, #ff8787);
    border-radius: 12rpx;
    text-align: center;

    text {
      font-size: 28rpx;
      color: #fff;
      font-weight: 500;
    }
  }

  .btn-secondary {
    padding: 20rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
    text-align: center;

    text {
      font-size: 28rpx;
      color: #636e72;
    }
  }

  .btn-success {
    padding: 20rpx;
    background: #d4edda;
    border-radius: 12rpx;
    text-align: center;

    text {
      font-size: 28rpx;
      color: #155724;
    }
  }
}
</style>