App({
  globalData: {
    userInfo: null,
    openId: '',
    community: '幸福小区',
    communityId: '',
    serverUrl: ''
  },

  onLaunch: function() {
    console.log('App onLaunch');
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    
    try {
      const cloudEnv = wx.cloud.DYNAMIC_CURRENT_ENV || 'groupbuy-prod-d1g2aeyhy9dd21ed2';
      wx.cloud.init({
        env: cloudEnv,
        traceUser: true,
      });
      console.log('云开发初始化成功，env:', cloudEnv);
    } catch (e) {
      console.error('云开发初始化失败:', e);
    }
    
    this.checkLoginStatus();
  },

  checkLoginStatus: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
    const openId = wx.getStorageSync('openId');
    if (openId) {
      this.globalData.openId = openId;
    }
  },

  login: function(callback) {
    console.log('开始调用 login 云函数');
    
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      timeout: 10000,
      success: res => {
        console.log('login 云函数调用成功:', res);
        if (res.result && res.result.openid) {
          this.globalData.openId = res.result.openid;
          wx.setStorageSync('openId', res.result.openid);
          callback && callback(res.result);
        }
      },
      fail: err => {
        console.error('login 云函数调用失败:', err);
        const message = err && err.errMsg && err.errMsg.includes('timeout')
          ? '云函数调用超时，请确认已选择正确云环境并部署 login 云函数'
          : err.message;
        callback && callback({ success: false, message: message || '登录失败' });
      },
      complete: () => {
        console.log('login 云函数调用完成');
      }
    });
  },

  setCommunity: function(community, communityId) {
    this.globalData.community = community;
    this.globalData.communityId = communityId;
    wx.setStorageSync('community', community);
    wx.setStorageSync('communityId', communityId);
  }
});
