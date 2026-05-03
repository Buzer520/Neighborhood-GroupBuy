<template>
  <view class="page-container">
    <view class="user-header">
      <view class="avatar-section" @click="handleLogin">
        <view class="avatar" v-if="!userStore.userInfo">
          <text class="avatar-icon">👤</text>
        </view>
        <image :src="userStore.userInfo?.avatarUrl" mode="aspectFill" class="avatar" v-else />
        <view class="user-info" v-if="userStore.userInfo">
          <text class="user-name">{{ userStore.userInfo.nickName }}</text>
          <text class="user-community">🏘️ {{ userStore.community }}</text>
        </view>
        <view class="login-text" v-else>
          <text>点击登录</text>
          <text class="login-arrow">›</text>
        </view>
      </view>

      <view class="balance-section" v-if="userStore.userInfo">
        <view class="balance-item">
          <text class="balance-label">余额</text>
          <view class="balance-value">
            <text class="balance-symbol">¥</text>
            <text class="balance-amount">{{ userStore.userInfo.balance.toFixed(2) }}</text>
          </view>
        </view>
        <view class="balance-divider"></view>
        <view class="balance-item">
          <text class="balance-label">VIP等级</text>
          <text class="balance-value vip-level">Lv.{{ userStore.userInfo.vipLevel }}</text>
        </view>
        <view class="balance-divider"></view>
        <view class="balance-item">
          <text class="balance-label">诚意金</text>
          <text class="balance-value deposit">¥1.00</text>
        </view>
      </view>
    </view>

    <view class="order-section" v-if="userStore.userInfo">
      <view class="section-header">
        <text class="section-title">我的订单</text>
        <view class="section-more">查看全部 ›</view>
      </view>
      <view class="order-tabs">
        <view class="order-tab" @click="goOrder('pending')">
          <view class="order-icon">🛒</view>
          <text class="order-label">待拼单</text>
          <view class="order-badge" v-if="pendingCount">{{ pendingCount }}</view>
        </view>
        <view class="order-tab" @click="goOrder('wait_pay')">
          <view class="order-icon">💳</view>
          <text class="order-label">待付款</text>
          <view class="order-badge" v-if="waitPayCount">{{ waitPayCount }}</view>
        </view>
        <view class="order-tab" @click="goOrder('paid')">
          <view class="order-icon">📦</view>
          <text class="order-label">待提货</text>
          <view class="order-badge" v-if="paidCount">{{ paidCount }}</view>
        </view>
        <view class="order-tab" @click="goOrder('picked')">
          <view class="order-icon">✅</view>
          <text class="order-label">已完成</text>
        </view>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-list">
        <view class="menu-item" @click="goMessage">
          <view class="menu-icon">💬</view>
          <text class="menu-text">消息通知</text>
          <view class="menu-badge" v-if="unreadCount">{{ unreadCount }}</view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goAddress">
          <view class="menu-icon">📍</view>
          <text class="menu-text">收货地址</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goDepositLog">
          <view class="menu-icon">💰</view>
          <text class="menu-text">诚意金记录</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goCommunity">
          <view class="menu-icon">🏘️</view>
          <text class="menu-text">小区管理</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goSettings">
          <view class="menu-icon">⚙️</view>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="login-modal" v-if="showLoginModal" @click="showLoginModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-close" @click="showLoginModal = false">✕</view>
        <view class="modal-avatar">👤</view>
        <text class="modal-title">登录体验完整功能</text>
        <text class="modal-desc">登录后可发布拼单、参与拼单等</text>
        <view class="modal-btn" @click="handleWechatLogin">
          <text>微信登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const showLoginModal = ref(false)

const pendingCount = ref(2)
const waitPayCount = ref(1)
const paidCount = ref(1)
const unreadCount = ref(3)

function handleLogin() {
  if (!userStore.isLogin) {
    showLoginModal.value = true
  }
}

function handleWechatLogin() {
  showLoginModal.value = false
  uni.showLoading({ title: '登录中...' })
  
  setTimeout(() => {
    const mockUser = {
      _id: 'mock_openid_123',
      nickName: '邻里拼单用户',
      avatarUrl: '',
      balance: 10,
      vipLevel: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    userStore.setUserInfo(mockUser)
    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })
  }, 1500)
}

function goOrder(status: string) {
  uni.switchTab({ url: '/pages/pickup/pickup' })
}

function goMessage() {
  uni.navigateTo({ url: '/pages/message/message' })
}

function goAddress() {
  uni.showToast({ title: '地址管理开发中', icon: 'none' })
}

function goDepositLog() {
  uni.showToast({ title: '诚意金记录开发中', icon: 'none' })
}

function goCommunity() {
  uni.showToast({ title: '小区管理开发中', icon: 'none' })
}

function goSettings() {
  uni.showToast({ title: '设置开发中', icon: 'none' })
}

onMounted(() => {
  userStore.loadFromStorage()
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.user-header {
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  padding: 60rpx 32rpx 40rpx;
}

.avatar-section {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.5);

  &.avatar-icon {
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56rpx;
  }
}

.user-info {
  margin-left: 24rpx;

  .user-name {
    font-size: 34rpx;
    font-weight: 600;
    color: #fff;
    display: block;
  }

  .user-community {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 8rpx;
  }
}

.login-text {
  margin-left: 24rpx;
  display: flex;
  align-items: center;

  text {
    font-size: 28rpx;
    color: #fff;
  }

  .login-arrow {
    font-size: 32rpx;
    margin-left: 8rpx;
  }
}

.balance-section {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 32rpx;
}

.balance-item {
  flex: 1;
  text-align: center;

  .balance-label {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    display: block;
  }

  .balance-value {
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin-top: 8rpx;

    .balance-symbol {
      font-size: 24rpx;
      color: #fff;
      font-weight: 600;
    }

    .balance-amount {
      font-size: 40rpx;
      color: #fff;
      font-weight: 700;
    }

    &.vip-level {
      font-size: 28rpx;
      color: #ffd93d;
      font-weight: 600;
    }

    &.deposit {
      font-size: 28rpx;
      color: #6bcb77;
      font-weight: 600;
    }
  }
}

.balance-divider {
  width: 2rpx;
  background: rgba(255, 255, 255, 0.3);
}

.order-section {
  background: #fff;
  margin: -20rpx 24rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  position: relative;
  z-index: 10;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;

  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #2d3436;
  }

  .section-more {
    font-size: 24rpx;
    color: #636e72;
  }
}

.order-tabs {
  display: flex;
  justify-content: space-around;
}

.order-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  .order-icon {
    font-size: 48rpx;
    margin-bottom: 12rpx;
  }

  .order-label {
    font-size: 24rpx;
    color: #636e72;
  }

  .order-badge {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
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
}

.menu-section {
  padding: 0 24rpx;
}

.menu-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f1f3f5;
  position: relative;

  &:last-child {
    border-bottom: none;
  }

  .menu-icon {
    font-size: 36rpx;
    margin-right: 20rpx;
  }

  .menu-text {
    flex: 1;
    font-size: 28rpx;
    color: #2d3436;
  }

  .menu-badge {
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
    margin-right: 16rpx;
  }

  .menu-arrow {
    font-size: 32rpx;
    color: #b2bec3;
  }
}

.login-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx;
  position: relative;

  .modal-close {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    width: 48rpx;
    height: 48rpx;
    background: #f5f7fa;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    color: #636e72;
  }

  .modal-avatar {
    width: 120rpx;
    height: 120rpx;
    background: linear-gradient(135deg, #ff6b6b, #ff8787);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56rpx;
    margin: 0 auto 24rpx;
  }

  .modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #2d3436;
    text-align: center;
    display: block;
  }

  .modal-desc {
    font-size: 26rpx;
    color: #636e72;
    text-align: center;
    margin-top: 12rpx;
    display: block;
  }

  .modal-btn {
    margin-top: 32rpx;
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
}
</style>