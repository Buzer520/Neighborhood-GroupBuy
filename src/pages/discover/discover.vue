<template>
  <view class="page-container">
    <view class="search-header">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          v-model="searchText" 
          placeholder="搜索商品或拼单"
          confirm-type="search"
          @confirm="handleSearch"
        />
        <text class="clear-icon" v-if="searchText" @click="clearSearch">✕</text>
      </view>
    </view>

    <scroll-view class="tabs-scroll" scroll-x>
      <view class="tabs">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === tab.value }" 
          v-for="tab in tabs" 
          :key="tab.value"
          @click="switchTab(tab.value)"
        >
          <text class="tab-text">{{ tab.label }}</text>
          <view class="tab-indicator" v-if="activeTab === tab.value"></view>
        </view>
      </view>
    </scroll-view>

    <view class="filter-bar">
      <view class="filter-item" :class="{ active: sortType === 'time' }" @click="sortType = 'time'">
        <text>最新</text>
      </view>
      <view class="filter-item" :class="{ active: sortType === 'hot' }" @click="sortType = 'hot'">
        <text>热门</text>
      </view>
      <view class="filter-item" :class="{ active: sortType === 'price' }" @click="sortType = 'price'">
        <text>价格</text>
      </view>
    </view>

    <scroll-view class="content-scroll" scroll-y :refresher-enabled="true" @refresherrefresh="onRefresh">
      <view class="group-list" v-if="groupBuys.length > 0">
        <GroupCard v-for="group in groupBuys" :key="group._id" :group="group" />
      </view>
      <EmptyState 
        v-else 
        icon-text="🔍" 
        title="暂无拼单" 
        description="还没有人发布拼单，快来成为第一个吧！"
        button-text="发布拼单"
        @action="goPublish"
      />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import GroupCard from '@/components/GroupCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useUserStore } from '@/stores/user'
import type { GroupBuy } from '@/stores/groupBuy'

const userStore = useUserStore()
const searchText = ref('')
const activeTab = ref('all')
const sortType = ref('time')

const tabs = ref([
  { value: 'all', label: '全部' },
  { value: 'fruit', label: '水果' },
  { value: 'vegetable', label: '蔬菜' },
  { value: 'meat', label: '肉类' },
  { value: 'dairy', label: '乳品' },
  { value: 'snack', label: '零食' }
])

const groupBuys = ref<GroupBuy[]>([])

const filteredGroupBuys = computed(() => {
  let result = groupBuys.value
  
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(g => 
      g.productName.toLowerCase().includes(keyword) ||
      g.community.toLowerCase().includes(keyword)
    )
  }
  
  if (activeTab.value !== 'all') {
    result = result.filter(g => {
      const name = g.productName.toLowerCase()
      switch(activeTab.value) {
        case 'fruit': return name.includes('苹果') || name.includes('梨') || name.includes('橙') || name.includes('樱桃') || name.includes('葡萄') || name.includes('草莓') || name.includes('西瓜') || name.includes('芒果')
        case 'vegetable': return name.includes('菜') || name.includes('瓜') || name.includes('豆') || name.includes('葱') || name.includes('姜') || name.includes('蒜')
        case 'meat': return name.includes('肉') || name.includes('鸡') || name.includes('鸭') || name.includes('鱼') || name.includes('虾')
        case 'dairy': return name.includes('奶') || name.includes('蛋') || name.includes('芝士') || name.includes('酸奶')
        case 'snack': return name.includes('零食') || name.includes('饼干') || name.includes('薯片') || name.includes('巧克力')
        default: return true
      }
    })
  }
  
  switch(sortType.value) {
    case 'time':
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'hot':
      result = [...result].sort((a, b) => b.currentCount - a.currentCount)
      break
    case 'price':
      result = [...result].sort((a, b) => a.targetPrice - b.targetPrice)
      break
  }
  
  return result
})

function switchTab(value: string) {
  activeTab.value = value
}

function clearSearch() {
  searchText.value = ''
}

function handleSearch() {
  console.log('搜索:', searchText.value)
}

function goPublish() {
  if (!userStore.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    uni.switchTab({ url: '/pages/mine/mine' })
    return
  }
  uni.navigateTo({ url: '/pages/publish/publish' })
}

async function loadData() {
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
        community: '阳光花园',
        productName: '有机西兰花 2斤装',
        productImages: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20green%20broccoli%20on%20white%20background&image_size=square'],
        spec: '新鲜采摘',
        targetPrice: 15.9,
        targetCount: 6,
        currentCount: 4,
        tieredPrices: [{ count: 5, price: 14.9 }],
        status: 'active',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        goodsReceivedAt: null,
        pickupPoint: '小区超市',
        remark: '',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
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
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '4',
        creatorId: 'user4',
        community: '丽景湾',
        productName: '农家土鸡蛋 30枚',
        productImages: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20brown%20eggs%20in%20basket%20on%20white%20background&image_size=square'],
        spec: '散养土鸡',
        targetPrice: 45.9,
        targetCount: 10,
        currentCount: 8,
        tieredPrices: [{ count: 10, price: 42.9 }],
        status: 'active',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        goodsReceivedAt: null,
        pickupPoint: '小区门口自提',
        remark: '新鲜直达',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '5',
        creatorId: 'user5',
        community: '幸福小区',
        productName: '进口牛肉卷 3斤装',
        productImages: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fresh%20sliced%20beef%20rolls%20on%20white%20background&image_size=square'],
        spec: '火锅专用',
        targetPrice: 128.0,
        targetCount: 8,
        currentCount: 5,
        tieredPrices: [{ count: 5, price: 138 }, { count: 8, price: 128 }],
        status: 'active',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        goodsReceivedAt: null,
        pickupPoint: '小区西门超市',
        remark: '澳洲进口',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ]
    groupBuys.value = mockData
  } catch (e) {
    console.error('加载数据失败:', e)
  }
}

function onRefresh() {
  loadData()
  setTimeout(() => {
    uni.stopPullDownRefresh()
  }, 1000)
}

onMounted(() => {
  loadData()
})

onShow(() => {
  userStore.loadFromStorage()
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.search-header {
  padding: 24rpx;
  background: #fff;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #f5f7fa;
  border-radius: 32rpx;

  .search-icon {
    font-size: 32rpx;
    margin-right: 12rpx;
  }

  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: #2d3436;
  }

  .clear-icon {
    font-size: 28rpx;
    color: #b2bec3;
    padding: 8rpx;
  }
}

.tabs-scroll {
  white-space: nowrap;
  background: #fff;
  border-bottom: 1rpx solid #f1f3f5;
}

.tabs {
  display: inline-flex;
  padding: 0 16rpx;
}

.tab-item {
  position: relative;
  padding: 28rpx 32rpx;
  
  .tab-text {
    font-size: 28rpx;
    color: #636e72;
    transition: color 0.3s;
  }
  
  &.active {
    .tab-text {
      color: #ff6b6b;
      font-weight: 600;
    }
    
    .tab-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 6rpx;
      background: linear-gradient(90deg, #ff6b6b, #ff8787);
      border-radius: 3rpx;
    }
  }
}

.filter-bar {
  display: flex;
  background: #fff;
  padding: 20rpx 24rpx;
  gap: 48rpx;
}

.filter-item {
  padding: 8rpx 16rpx;
  
  text {
    font-size: 26rpx;
    color: #636e72;
  }
  
  &.active {
    background: rgba(255, 107, 107, 0.1);
    border-radius: 16rpx;
    
    text {
      color: #ff6b6b;
      font-weight: 500;
    }
  }
}

.content-scroll {
  height: calc(100vh - 280rpx);
}

.group-list {
  padding: 24rpx;
}
</style>