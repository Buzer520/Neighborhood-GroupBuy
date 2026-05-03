const app = getApp();
const db = wx.cloud.database();
const { enrichGroupBuyList } = require('../../utils/group-buy.js');
const { COMMUNITY_OPTIONS, CATEGORY_OPTIONS, HOME_METRICS, QUICK_ENTRIES } = require('../../config/preset.js');

Page({
  data: {
    community: '',
    keyword: '',
    categories: CATEGORY_OPTIONS.filter(item => item.id !== ''),
    metrics: HOME_METRICS,
    quickEntries: QUICK_ENTRIES,
    hotGroupBuys: [],
    nearbyGroupBuys: [],
    page: 1,
    pageSize: 8,
    hasMore: true,
    loading: false,
    showNoMore: false,
    showEmpty: false
  },

  onLoad() {
    this.syncCommunity();
    this.refreshPageData();
  },

  onShow() {
    this.syncCommunity();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.refreshPageData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadNearbyGroupBuys(true);
    }
  },

  syncCommunity() {
    this.setData({
      community: app.globalData.community || COMMUNITY_OPTIONS[0]
    });
  },

  refreshPageData() {
    return Promise.all([this.loadHotGroupBuys(), this.loadNearbyGroupBuys()]);
  },

  createBaseQuery() {
    return db.collection('group_buy').where({
      status: 'active',
      deadline: db.command.gt(new Date())
    });
  },

  loadHotGroupBuys() {
    return this.createBaseQuery()
      .orderBy('currentCount', 'desc')
      .limit(4)
      .get()
      .then(res => {
        this.setData({
          hotGroupBuys: enrichGroupBuyList(res.data)
        });
      })
      .catch(err => {
        console.error('loadHotGroupBuys error', err);
      });
  },

  loadNearbyGroupBuys(isLoadMore = false) {
    if (this.data.loading) {
      return Promise.resolve();
    }

    this.setData({ loading: true });
    const nextPage = isLoadMore ? this.data.page + 1 : 1;

    return this.createBaseQuery()
      .orderBy('deadline', 'asc')
      .skip((nextPage - 1) * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const list = enrichGroupBuyList(res.data);
        const nearbyGroupBuys = isLoadMore ? this.data.nearbyGroupBuys.concat(list) : list;
        const hasMore = list.length >= this.data.pageSize;

        this.setData({
          nearbyGroupBuys,
          page: nextPage,
          hasMore,
          loading: false,
          showNoMore: !hasMore && nearbyGroupBuys.length > 0,
          showEmpty: nearbyGroupBuys.length === 0
        });
      })
      .catch(err => {
        console.error('loadNearbyGroupBuys error', err);
        this.setData({
          loading: false,
          showEmpty: this.data.nearbyGroupBuys.length === 0
        });
      });
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value || '' });
  },

  onSearchConfirm() {
    const keyword = (this.data.keyword || '').trim();
    wx.navigateTo({
      url: `/pages/discover/discover${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`
    });
  },

  switchCommunity() {
    wx.showActionSheet({
      itemList: COMMUNITY_OPTIONS,
      success: res => {
        const selectedCommunity = COMMUNITY_OPTIONS[res.tapIndex];
        app.setCommunity(selectedCommunity, `community_${res.tapIndex}`);
        this.setData({ community: selectedCommunity });
        this.refreshPageData();
      }
    });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  goToCategory(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/discover/discover?categoryId=${id}&categoryName=${encodeURIComponent(name)}`
    });
  },

  goToDiscover() {
    wx.switchTab({
      url: '/pages/discover/discover'
    });
  },

  goToPublish() {
    wx.switchTab({
      url: '/pages/publish/publish'
    });
  },

  handleQuickEntry(e) {
    const { key } = e.currentTarget.dataset;
    if (key === 'publish') {
      this.goToPublish();
      return;
    }
    if (key === 'pickup') {
      wx.navigateTo({ url: '/pages/pickup/pickup' });
      return;
    }
    this.goToDiscover();
  },

  onShareAppMessage() {
    return {
      title: '邻里拼单，一起拼更省心',
      path: '/pages/index/index'
    };
  }
});
