<template>
  <view class="page-container">
    <view class="header">
      <view class="header-content">
        <view class="location" @click="selectCommunity">
          <text class="location-icon">📍</text>
          <text class="location-text">{{ community }}</text>
          <text class="location-arrow">▼</text>
        </view>
        <view class="search-box" @click="goSearch">
          <text class="search-icon">🔍</text>
          <text class="search-placeholder">搜索商品或拼单</text>
        </view>
      </view>
    </view>

    <swiper class="banner-swiper" indicator-dots autoplay circular indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff">
      <swiper-item v-for="(item, index) in banners" :key="index">
        <image :src="item" mode="aspectFill" class="banner-img" />
      </swiper-item>
    </swiper>

    <view class="category-section">
      <view class="category-grid">
        <view class="category-item" v-for="(item, index) in categories" :key="index" @click="handleCategoryClick(item)">
          <view class="category-icon">{{ item.icon }}</view>
          <text class="category-name">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <view class="section-title">
          <text class="title-icon">🔥</text>
          <text class="title-text">热门拼单</text>
        </view>
        <view class="section-more" @click="goDiscover">更多 ›</view>
      </view>
      <view class="group-list">
        <GroupCard v-for="group in groupBuys" :key="group._id" :group="group" />
      </view>
    </view>

    <view class="float-button" @click="goPublish">
      <text class="float-icon">✏️</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import GroupCard from '@/components/GroupCard.vue'
import { useUserStore } from '@/stores/user'
import type { GroupBuy } from '@/stores/groupBuy'

const userStore = useUserStore()
const community = ref('幸福小区')
const banners = ref([
  'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=group%20buying%20promotion%20banner%20with%20fresh%20vegetables%20and%20fruits%20colorful%20modern%20design&image_size=landscape_16_9',
  'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=neighborhood%20community%20shopping%20app%20banner%20warm%20friendly%20atmosphere&image_size=landscape_16_9',
  'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20grocery%20delivery%20service%20promotion%20vibrant%20colors&image_size=landscape_16_9'
])

const categories = ref([
  { icon: '🍎', name: '水果' },
  { icon: '🥬', name: '蔬菜' },
  { icon: '🥩', name: '肉类' },
  { icon: '🥛', name: '乳品' },
  { icon: '🍞', name: '面点' },
  { icon: '🍚', name: '粮油' },
  { icon: '🧂', name: '调料' },
  { icon: '🍦', name: '零食' }
])

const groupBuys = ref<GroupBuy[]>([])
const loading = ref(false)

function selectCommunity() {
  uni.showActionSheet({
    itemList: ['幸福小区', '阳光花园', '丽景湾', '星河城'],
    success: (res) => {
      const communities = ['幸福小区', '阳光花园', '丽景湾', '星河城']
      community.value = communities[res.tapIndex]
      userStore.setCommunity(community.value, String(res.tapIndex + 1))
    }
  })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/discover/discover' })
}

function handleCategoryClick(item: { name: string }) {
  uni.navigateTo({ url: `/pages/discover/discover?category=${item.name}` })
}

function goDiscover() {
  uni.switchTab({ url: '/pages/discover/discover' })
}

function goPublish() {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    uni.switchTab({ url: '/pages/mine/mine' })
    return
  }
  uni.navigateTo({ url: '/pages/publish/publish' })
}

async function loadGroupBuys() {
  loading.value = true
  try {
    const mockData: GroupBuy[] = [
      {
        _id: '1',
        creatorId: 'user1',
        community: '幸福小区',
        productName: '新疆阿克苏冰糖心苹果 5斤装',
        productImages: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20red%20apples%20on%20white%20background%20studio%20lighting&image_size=square'],
        spec: '单果约200g',
        targetPrice: 29.9,
        targetCount: 10,
        currentCount: 7,
        tieredPrices: [{ count: 5, price: 34.9 }, { count: 10, price: 29.9 }, { count: 20, price: 26.9 }],
        status: 'active',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        goodsReceivedAt: null,
        pickupPoint: '小区北门自提点',
        remark: '产地直发，新鲜到家',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        creatorId: 'user2',
        community: '幸福小区',
        productName: '云南沃柑 8斤装',
        productImages: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20orange%20mandarin%20oranges%20on%20white%20background&image_size=square'],
        spec: '精选大果',
        targetPrice: 39.9,
        targetCount: 8,
        currentCount: 8,
        tieredPrices: [{ count: 5, price: 45.9 }, { count: 8, price: 39.9 }],
        status: 'success',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        goodsReceivedAt: new Date().toISOString(),
        pickupPoint: '小区南门超市',
        remark: '',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '3',
        creatorId: 'user3',
        community: '幸福小区',
        productName: '智利车厘子 JJ级 2斤装',
        productImages: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20dark%20red%20cherries%20on%20white%20background&image_size=square'],
        spec: '果径28-30mm',
        targetPrice: 89.9,
        targetCount: 15,
        currentCount: 12,
        tieredPrices: [{ count: 10, price: 99.9 }, { count: 15, price: 89.9 }],
        status: 'active',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        goodsReceivedAt: null,
        pickupPoint: '小区北门自提点',
        remark: '顺丰冷链配送',
        createdAt: new Date().toISOString()
      }
    ]
    groupBuys.value = mockData
  } catch (e) {
    console.error('加载拼单列表失败:', e)
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

onMounted(() => {
  userStore.loadFromStorage()
  community.value = userStore.community
  loadGroupBuys()
})

onShow(() => {
  community.value = userStore.community
})

onPullDownRefresh(() => {
  loadGroupBuys()
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 120rpx;
}

.header {
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  padding: 80rpx 32rpx 32rpx;

  .header-content {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .location {
    display: flex;
    align-items: center;
    padding: 12rpx 20rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 24rpx;

    .location-icon {
      font-size: 28rpx;
      margin-right: 8rpx;
    }

    .location-text {
      font-size: 26rpx;
      color: #fff;
      font-weight: 500;
    }

    .location-arrow {
      font-size: 20rpx;
      color: rgba(255, 255, 255, 0.7);
      margin-left: 8rpx;
    }
  }

  .search-box {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 16rpx 24rpx;
    background: #fff;
    border-radius: 32rpx;

    .search-icon {
      font-size: 28rpx;
      margin-right: 12rpx;
    }

    .search-placeholder {
      font-size: 26rpx;
      color: #b2bec3;
    }
  }
}

.banner-swiper {
  height: 280rpx;
  margin: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;

  .banner-img {
    width: 100%;
    height: 100%;
  }
}

.category-section {
  padding: 0 24rpx;
  margin-bottom: 32rpx;

  .category-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24rpx;
    background: #fff;
    padding: 32rpx 0;
    border-radius: 16rpx;
  }

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .category-icon {
      width: 100rpx;
      height: 100rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fff5f5, #ffe0e0);
      border-radius: 24rpx;
      font-size: 48rpx;
      margin-bottom: 16rpx;
      box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.1);
    }

    .category-name {
      font-size: 24rpx;
      color: #2d3436;
    }
  }
}

.section {
  padding: 0 24rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .section-title {
      display: flex;
      align-items: center;

      .title-icon {
        font-size: 32rpx;
        margin-right: 8rpx;
      }

      .title-text {
        font-size: 32rpx;
        font-weight: 600;
        color: #2d3436;
      }
    }

    .section-more {
      font-size: 26rpx;
      color: #636e72;
    }
  }

  .group-list {
    display: flex;
    flex-direction: column;
  }
}

.float-button {
  position: fixed;
  right: 40rpx;
  bottom: 180rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.4);
  z-index: 100;

  .float-icon {
    font-size: 36rpx;
  }
}
</style>