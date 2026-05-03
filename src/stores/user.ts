import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  _id: string
  nickName: string
  avatarUrl: string
  balance: number
  vipLevel: number
  createdAt: string
  updatedAt: string
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const openId = ref('')
  const community = ref('幸福小区')
  const communityId = ref('')

  const isLogin = computed(() => !!openId.value)

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    openId.value = info._id
    uni.setStorageSync('userInfo', JSON.stringify(info))
    uni.setStorageSync('openId', info._id)
  }

  function setOpenId(id: string) {
    openId.value = id
    uni.setStorageSync('openId', id)
  }

  function setCommunity(name: string, id: string) {
    community.value = name
    communityId.value = id
    uni.setStorageSync('community', name)
    uni.setStorageSync('communityId', id)
  }

  function clearUser() {
    userInfo.value = null
    openId.value = ''
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('openId')
  }

  function loadFromStorage() {
    try {
      const infoStr = uni.getStorageSync('userInfo')
      if (infoStr) {
        userInfo.value = JSON.parse(infoStr)
      }
      const id = uni.getStorageSync('openId')
      if (id) {
        openId.value = id
      }
      const comm = uni.getStorageSync('community')
      if (comm) {
        community.value = comm
      }
      const commId = uni.getStorageSync('communityId')
      if (commId) {
        communityId.value = commId
      }
    } catch (e) {
      console.error('加载用户信息失败:', e)
    }
  }

  return {
    userInfo,
    openId,
    community,
    communityId,
    isLogin,
    setUserInfo,
    setOpenId,
    setCommunity,
    clearUser,
    loadFromStorage
  }
})