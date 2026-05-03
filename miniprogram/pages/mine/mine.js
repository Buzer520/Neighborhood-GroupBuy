const app = getApp();
const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    myGroupBuys: [],
    myOrders: [],
    currentOrderTab: 'joined',
    orderTabs: [
      { value: 'joined', label: '我参与的' },
      { value: 'created', label: '我发起的' }
    ],
    orderStatus: [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待拼单成功' },
      { value: 'wait_pay', label: '待付尾款' },
      { value: 'paid', label: '待提货' },
      { value: 'picked', label: '已完成' }
    ],
    selectedStatus: 'all',
    currentStatusLabel: '全部',
    loading: false,
    showOrderEmpty: false,
    showGroupEmpty: false,
    loginDebug: ''
  },

  onLoad: function() {
    console.log('mine page onLoad');
    this.checkLoginStatus();
  },

  onShow: function() {
    console.log('mine page onShow');
    if (this.data.hasUserInfo) {
      this.loadMyGroupBuys();
      this.loadMyOrders();
    }
  },

  checkLoginStatus: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const openId = wx.getStorageSync('openId');
    console.log('检查登录状态 - userInfo:', userInfo, 'openId:', openId);
    
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      });
      this.loadMyGroupBuys();
      this.loadMyOrders();
    }
  },

  onLoginTap: function() {
    console.log('开始登录流程');
    
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: res => {
        console.log('getUserProfile 成功:', res.userInfo);
        
        const userInfo = res.userInfo;
        this.setData({
          userInfo,
          hasUserInfo: true
        });
        wx.setStorageSync('userInfo', userInfo);
        
        this.loginToCloud(userInfo);
      },
      fail: err => {
        console.error('getUserProfile 失败:', err);
        wx.showToast({ title: '请授权获取用户信息', icon: 'none' });
      }
    });
  },
  
  loginToCloud: function(userInfo) {
    wx.showLoading({ title: '登录中...' });
    
    app.login(res => {
      wx.hideLoading();
      
      if (res.success && res.openid) {
        const openId = res.openid;
        console.log('云函数登录成功，openId:', openId);
        
        this.saveUserInfo(userInfo, openId);
        this.loadMyGroupBuys();
        this.loadMyOrders();
        wx.showToast({ title: '登录成功', icon: 'success' });
      } else {
        wx.showToast({ title: res.message || '登录失败', icon: 'none' });
      }
    });
  },

  saveUserInfo: function(userInfo, openId) {
    if (!openId) return;

    db.collection('user').doc(openId).set({
      data: {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        balance: 10,
        vipLevel: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }).then(() => {
      console.log('用户信息保存成功，openId:', openId);
    }).catch(err => {
      console.error('用户信息保存失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  },

  loadMyGroupBuys: function() {
    const openId = app.globalData.openId;
    if (!openId) return;

    db.collection('group_buy')
      .where({ creatorId: openId })
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()
      .then(res => {
        const myGroupBuys = res.data.map(item => ({
          ...item,
          statusText: this.getGroupStatusText(item.status),
          countdownStr: util.formatCountdownStr(item.deadline)
        }));
        this.setData({ 
          myGroupBuys,
          showGroupEmpty: myGroupBuys.length === 0
        });
      });
  },

  loadMyOrders: function() {
    const openId = app.globalData.openId;
    if (!openId) return;

    let query = db.collection('order')
      .where({ userId: openId });

    if (this.data.selectedStatus !== 'all') {
      query = query.where({
        userId: openId,
        status: this.data.selectedStatus
      });
    }

    query.orderBy('createdAt', 'desc')
      .limit(20)
      .get()
      .then(res => {
        const orderIds = res.data.map(o => o.groupId);
        if (orderIds.length === 0) {
          this.setData({ myOrders: [], showOrderEmpty: true });
          return;
        }

        db.collection('group_buy')
          .where({
            _id: db.command.in(orderIds)
          })
          .field({ productName: true, productImages: true, community: true })
          .get()
          .then(groupRes => {
            const groupMap = {};
            groupRes.data.forEach(g => { groupMap[g._id] = g; });

            const myOrders = res.data.map(order => ({
              ...order,
              groupInfo: groupMap[order.groupId] || {},
              statusText: this.getOrderStatusText(order.status)
            }));
            this.setData({ myOrders, showOrderEmpty: myOrders.length === 0 });
          });
      });
  },

  getGroupStatusText: function(status) {
    const map = {
      active: '进行中',
      success: '已成功',
      failed: '已失败',
      canceled: '已取消'
    };
    return map[status] || status;
  },

  getOrderStatusText: function(status) {
    const map = {
      pending: '待拼单成功',
      wait_pay: '待付尾款',
      paid: '待提货',
      picked: '已完成',
      refunded: '已退款'
    };
    return map[status] || status;
  },

  onOrderTabChange: function(e) {
    const { value } = e.detail;
    this.setData({ currentOrderTab: value });
  },

  onOrderStatusChange: function(e) {
    const index = parseInt(e.detail.value);
    const status = this.data.orderStatus[index].value;
    const label = this.data.orderStatus[index].label;
    this.setData({ 
      selectedStatus: status,
      currentStatusLabel: label
    });
    this.loadMyOrders();
  },

  goToDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  goToAddresses: function() {
    wx.showToast({ title: '地址管理开发中', icon: 'none' });
  },

  goToDepositLog: function() {
    wx.showToast({ title: '诚意金记录开发中', icon: 'none' });
  },

  goToPickup: function() {
    wx.navigateTo({
      url: '/pages/pickup/pickup'
    });
  },

  goToSettings: function() {
    wx.showToast({ title: '设置开发中', icon: 'none' });
  },

  onShareAppMessage: function() {
    return {
      title: '邻里拼单 - 一起拼更便宜',
      path: '/pages/index/index'
    };
  }
});