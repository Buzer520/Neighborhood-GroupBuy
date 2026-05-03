const app = getApp();
const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({
  data: {
    isLoggedIn: false,
    managerInfo: null,
    phone: '',
    verifyCode: '',
    verifyCodeSent: false,
    countdown: 60,
    pendingOrders: [],
    pickupCode: '',
    showConfirmModal: false,
    selectedOrder: null,
    loading: false
  },

  onLoad: function() {
    this.checkManagerLogin();
  },

  checkManagerLogin: function() {
    const managerInfo = wx.getStorageSync('managerInfo');
    if (managerInfo) {
      this.setData({
        isLoggedIn: true,
        managerInfo
      });
      this.loadPendingOrders();
    }
  },

  onPhoneInput: function(e) {
    this.setData({ phone: e.detail.value });
  },

  onVerifyCodeInput: function(e) {
    this.setData({ verifyCode: e.detail.value });
  },

  sendVerifyCode: function() {
    const { phone } = this.data;

    if (!util.validatePhone(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    wx.cloud.callFunction({
      name: 'sendVerifyCode',
      data: { phone, type: 'manager_login' },
      success: res => {
        if (res.result && res.result.success) {
          wx.showToast({ title: '验证码已发送', icon: 'success' });
          this.startCountdown();
        } else {
          wx.showToast({ title: res.result?.message || '发送失败', icon: 'none' });
        }
      },
      fail: err => {
        console.error(err);
        wx.showToast({ title: '发送失败', icon: 'none' });
      }
    });
  },

  startCountdown: function() {
    this.setData({ verifyCodeSent: true, countdown: 60 });

    const timer = setInterval(() => {
      const { countdown } = this.data;
      if (countdown <= 1) {
        clearInterval(timer);
        this.setData({ verifyCodeSent: false, countdown: 60 });
      } else {
        this.setData({ countdown: countdown - 1 });
      }
    }, 1000);

    this.setData({ countdownTimer: timer });
  },

  login: function() {
    const { phone, verifyCode } = this.data;

    if (!util.validatePhone(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (!verifyCode || verifyCode.length !== 6) {
      wx.showToast({ title: '请输入6位验证码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    wx.cloud.callFunction({
      name: 'managerLogin',
      data: { phone, verifyCode },
      success: res => {
        if (res.result && res.result.success) {
          const managerInfo = res.result.manager;
          this.setData({
            isLoggedIn: true,
            managerInfo
          });
          wx.setStorageSync('managerInfo', managerInfo);
          this.loadPendingOrders();
        } else {
          wx.showToast({ title: res.result?.message || '登录失败', icon: 'none' });
        }
      },
      fail: err => {
        console.error(err);
        wx.showToast({ title: '登录失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  logout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出团长登录吗？',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('managerInfo');
          if (this.data.countdownTimer) {
            clearInterval(this.data.countdownTimer);
          }
          this.setData({
            isLoggedIn: false,
            managerInfo: null,
            phone: '',
            verifyCode: '',
            pendingOrders: []
          });
        }
      }
    });
  },

  loadPendingOrders: function() {
    const { managerInfo } = this.data;
    if (!managerInfo) return;

    this.setData({ loading: true });

    db.collection('pick_up_point')
      .where({ managerPhone: managerInfo.phone })
      .get()
      .then(res => {
        if (res.data.length === 0) {
          this.setData({ loading: false });
          return;
        }

        const pickupPoint = res.data[0];
        return db.collection('order')
          .where({
            status: 'paid',
            pickupPoint: pickupPoint.name
          })
          .get();
      })
      .then(orderRes => {
        if (orderRes) {
          const orderIds = orderRes.data.map(o => o.userId);
          return db.collection('user')
            .where({ _id: db.command.in(orderIds) })
            .field({ _id: true, nickName: true, avatarUrl: true })
            .get()
            .then(userRes => {
              const userMap = {};
              userRes.data.forEach(u => { userMap[u._id] = u; });

              const pendingOrders = orderRes.data.map(order => ({
                ...order,
                userInfo: userMap[order.userId] || {}
              }));
              this.setData({ pendingOrders, loading: false });
            });
        }
      })
      .catch(err => {
        console.error(err);
        this.setData({ loading: false });
      });
  },

  scanCode: function() {
    wx.scanCode({
      onlyFromCamera: true,
      success: res => {
        const code = res.result;
        this.findAndConfirmOrder(code);
      },
      fail: err => {
        console.error(err);
        wx.showToast({ title: '扫码失败', icon: 'none' });
      }
    });
  },

  onPickupCodeInput: function(e) {
    this.setData({ pickupCode: e.detail.value });
  },

  searchOrder: function() {
    const { pickupCode } = this.data;
    if (!pickupCode || pickupCode.length !== 6) {
      wx.showToast({ title: '请输入6位提货码', icon: 'none' });
      return;
    }
    this.findAndConfirmOrder(pickupCode);
  },

  findAndConfirmOrder: function(code) {
    const { pendingOrders } = this.data;
    const order = pendingOrders.find(o => o.pickupCode === code);

    if (order) {
      this.setData({
        showConfirmModal: true,
        selectedOrder: order
      });
    } else {
      wx.showToast({ title: '未找到对应订单', icon: 'none' });
    }
  },

  hideConfirmModal: function() {
    this.setData({
      showConfirmModal: false,
      selectedOrder: null,
      pickupCode: ''
    });
  },

  confirmPickup: function() {
    const { selectedOrder } = this.data;
    if (!selectedOrder) return;

    wx.showLoading({ title: '核销中...' });

    wx.cloud.callFunction({
      name: 'confirmPickup',
      data: { orderId: selectedOrder._id },
      success: res => {
        if (res.result && res.result.success) {
          wx.showToast({ title: '核销成功', icon: 'success' });
          this.hideConfirmModal();
          this.loadPendingOrders();
        } else {
          wx.showToast({ title: res.result?.message || '核销失败', icon: 'none' });
        }
      },
      fail: err => {
        console.error(err);
        wx.showToast({ title: '核销失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  onUnload: function() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
  }
});