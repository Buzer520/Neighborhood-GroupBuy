const app = getApp();
const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({
  data: {
    community: '',
    searchKeyword: '',
    hotGroupBuys: [],
    categories: [
      { id: 1, name: '生鲜', icon: '🥬' },
      { id: 2, name: '水果', icon: '🍎' },
      { id: 3, name: '粮油', icon: '🌾' },
      { id: 4, name: '日化', icon: '🧴' },
      { id: 5, name: '母婴', icon: '👶' },
      { id: 6, name: '宠物', icon: '🐶' }
    ],
    nearbyGroupBuys: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    showNoMore: false,
    showEmpty: false
  },

  onLoad: function() {
    this.setData({
      community: app.globalData.community || '幸福小区'
    });
    this.loadHotGroupBuys();
    this.loadNearbyGroupBuys();
  },

  onShow: function() {
    this.setData({
      community: app.globalData.community || '幸福小区'
    });
  },

  onPullDownRefresh: function() {
    this.setData({ page: 1, hasMore: true });
    Promise.all([
      this.loadHotGroupBuys(),
      this.loadNearbyGroupBuys()
    ]).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadNearbyGroupBuys(true);
    }
  },

  loadHotGroupBuys: function() {
    db.collection('group_buy')
      .where({
        status: 'active',
        deadline: db.command.gt(new Date())
      })
      .orderBy('currentCount', 'desc')
      .limit(5)
      .get()
      .then(res => {
        const hotGroupBuys = res.data.map(item => ({
          ...item,
          countdownStr: util.formatCountdownStr(item.deadline),
          progress: util.getProgress(item.currentCount, item.targetCount),
          currentPrice: util.getCurrentPrice(item.tieredPrices, item.currentCount)
        }));
        this.setData({ hotGroupBuys });
      });
  },

  loadNearbyGroupBuys: function(isLoadMore = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    const page = isLoadMore ? this.data.page + 1 : 1;

    db.collection('group_buy')
      .where({
        status: 'active',
        deadline: db.command.gt(new Date())
      })
      .orderBy('deadline', 'asc')
      .skip((page - 1) * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const list = res.data.map(item => ({
          ...item,
          countdownStr: util.formatCountdownStr(item.deadline),
          progress: util.getProgress(item.currentCount, item.targetCount),
          currentPrice: util.getCurrentPrice(item.tieredPrices, item.currentCount)
        }));

        const newList = isLoadMore ? [...this.data.nearbyGroupBuys, ...list] : list;
        const showNoMore = !this.data.hasMore && newList.length > 0;
        const showEmpty = newList.length === 0 && !this.data.loading;

        this.setData({
          nearbyGroupBuys: newList,
          page: page,
          hasMore: list.length >= this.data.pageSize,
          loading: false,
          showNoMore: showNoMore,
          showEmpty: showEmpty
        });
      })
      .catch(err => {
        console.error(err);
        this.setData({ loading: false, showEmpty: true });
      });
  },

  onSearch: function(e) {
    const keyword = e.detail.value || '';
    if (!keyword.trim()) return;

    wx.navigateTo({
      url: `/pages/discover/discover?keyword=${encodeURIComponent(keyword)}`
    });
  },

  switchCommunity: function() {
    wx.showActionSheet({
      itemList: ['幸福小区', '阳光花园', '绿城锦园', '碧桂园'],
      success: res => {
        const communities = ['幸福小区', '阳光花园', '绿城锦园', '碧桂园'];
        app.setCommunity(communities[res.tapIndex], `community_${res.tapIndex}`);
        this.setData({ community: communities[res.tapIndex] });
      }
    });
  },

  goToDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  goToCategory: function(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/discover/discover?categoryId=${id}&categoryName=${encodeURIComponent(name)}`
    });
  },

  onShareAppMessage: function() {
    return {
      title: '邻里拼单 - 一起拼更便宜',
      path: '/pages/index/index'
    };
  }
});