import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface GroupBuy {
  _id: string
  creatorId: string
  community: string
  productName: string
  productImages: string[]
  spec: string
  targetPrice: number
  targetCount: number
  currentCount: number
  tieredPrices: { count: number; price: number }[]
  status: 'active' | 'success' | 'failed' | 'canceled'
  deadline: string
  goodsReceivedAt: string | null
  pickupPoint: string
  remark: string
  createdAt: string
}

export interface Order {
  _id: string
  groupId: string
  userId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  deposit: number
  status: 'pending' | 'wait_pay' | 'paid' | 'picked' | 'refunded'
  pickupCode: string
  createdAt: string
  payTime: string | null
}

export interface Message {
  _id: string
  userId: string
  type: 'system' | 'order' | 'group'
  title: string
  content: string
  groupId: string | null
  read: boolean
  createdAt: string
}

export const useGroupBuyStore = defineStore('groupBuy', () => {
  const groupBuys = ref<GroupBuy[]>([])
  const myOrders = ref<Order[]>([])
  const messages = ref<Message[]>([])

  function setGroupBuys(list: GroupBuy[]) {
    groupBuys.value = list
  }

  function addGroupBuy(item: GroupBuy) {
    groupBuys.value.unshift(item)
  }

  function updateGroupBuy(id: string, data: Partial<GroupBuy>) {
    const index = groupBuys.value.findIndex(g => g._id === id)
    if (index !== -1) {
      groupBuys.value[index] = { ...groupBuys.value[index], ...data }
    }
  }

  function setOrders(list: Order[]) {
    myOrders.value = list
  }

  function addOrder(order: Order) {
    myOrders.value.unshift(order)
  }

  function setMessages(list: Message[]) {
    messages.value = list
  }

  function addMessage(msg: Message) {
    messages.value.unshift(msg)
  }

  function markMessageRead(id: string) {
    const index = messages.value.findIndex(m => m._id === id)
    if (index !== -1) {
      messages.value[index].read = true
    }
  }

  return {
    groupBuys,
    myOrders,
    messages,
    setGroupBuys,
    addGroupBuy,
    updateGroupBuy,
    setOrders,
    addOrder,
    setMessages,
    addMessage,
    markMessageRead
  }
})