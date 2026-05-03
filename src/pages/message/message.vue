<template>
  <view class="page-container">
    <view class="message-header">
      <view class="header-title">消息通知</view>
      <view class="header-action" @click="markAllRead">
        <text>全部已读</text>
      </view>
    </view>

    <view class="message-list" v-if="messages.length > 0">
      <view 
        class="message-item" 
        :class="{ unread: !msg.read }"
        v-for="msg in messages" 
        :key="msg._id"
        @click="openMessage(msg)"
      >
        <view class="msg-icon" :class="msg.type">
          <text>{{ getIcon(msg.type) }}</text>
        </view>
        <view class="msg-content">
          <view class="msg-header">
            <text class="msg-title">{{ msg.title }}</text>
            <text class="msg-time">{{ formatTime(msg.createdAt) }}</text>
          </view>
          <text class="msg-text">{{ msg.content }}</text>
        </view>
        <view class="msg-dot" v-if="!msg.read"></view>
      </view>
    </view>

    <EmptyState 
      v-else 
      icon-text="📭" 
      title="暂无消息" 
      description="您还没有任何消息通知"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Message } from '@/stores/groupBuy'

interface MessageItem extends Message {
  type: 'system' | 'order' | 'group'
}

const messages = ref<MessageItem[]>([
  {
    _id: '1',
    userId: 'user1',
    type: 'system',
    title: '系统通知',
    content: '您参与的「新疆阿克苏冰糖心苹果」拼单已成功成团！',
    groupId: 'group1',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    _id: '2',
    userId: 'user1',
    type: 'order',
    title: '订单提醒',
    content: '您的订单 ORD20240115001 已发货，预计明天到达自提点',
    groupId: 'group1',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '3',
    userId: 'user1',
    type: 'group',
    title: '拼单动态',
    content: '张三 加入了您发起的「农家土鸡蛋」拼单',
    groupId: 'group2',
    read: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '4',
    userId: 'user1',
    type: 'system',
    title: '系统通知',
    content: '新功能上线：支持阶梯价格拼单，快来体验！',
    groupId: null,
    read: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '5',
    userId: 'user1',
    type: 'order',
    title: '订单提醒',
    content: '您的订单 ORD20240114002 已完成提货',
    groupId: 'group3',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
])

function getIcon(type: string): string {
  const map: Record<string, string> = {
    system: '🔔',
    order: '📦',
    group: '👥'
  }
  return map[type] || '📩'
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function openMessage(msg: MessageItem) {
  msg.read = true
  uni.showToast({ title: `查看「${msg.title}」详情`, icon: 'none' })
}

function markAllRead() {
  messages.value.forEach(msg => msg.read = true)
  uni.showToast({ title: '已全部标为已读', icon: 'success' })
}

onMounted(() => {
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #f1f3f5;

  .header-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #2d3436;
  }

  .header-action {
    padding: 12rpx 24rpx;
    background: rgba(255, 107, 107, 0.1);
    border-radius: 24rpx;

    text {
      font-size: 26rpx;
      color: #ff6b6b;
    }
  }
}

.message-list {
  padding: 24rpx;
}

.message-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;

  &.unread {
    background: linear-gradient(135deg, #fff5f5, #fff);
  }
}

.msg-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-right: 20rpx;

  &.system {
    background: linear-gradient(135deg, #74c0fc, #7b8ce4);
  }

  &.order {
    background: linear-gradient(135deg, #69db7c, #8ce99a);
  }

  &.group {
    background: linear-gradient(135deg, #ffd43b, #ffc078);
  }
}

.msg-content {
  flex: 1;

  .msg-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;

    .msg-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #2d3436;
    }

    .msg-time {
      font-size: 22rpx;
      color: #b2bec3;
    }
  }

  .msg-text {
    font-size: 26rpx;
    color: #636e72;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.msg-dot {
  width: 16rpx;
  height: 16rpx;
  background: #ff6b6b;
  border-radius: 50%;
  margin-left: 16rpx;
}
</style>