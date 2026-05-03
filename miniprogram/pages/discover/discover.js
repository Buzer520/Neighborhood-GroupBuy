const app = getApp();
const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({
  data: {
    keyword: '',
    categoryId: '',
    categoryName: '',
    sortBy: 'default',
    sortOptions: [
      { value: 'default', label: '默认排序' },
      { value: 'distance', label: '距离最近' },
      { value: 'hot', label: '热度最高' },
      { value: 'time', label: '即将结束' },
      { value: 'price', label: '价格低到高' }
    ],
    categories: [
      { id: '', name: '全部' },
      { id: 1, name: '生鲜' },
      { id: 2, name: '水果' },
      { id: 3, name: '粮油' },
      { id: 4, name: '日化' },
      { id: 5, name: '母婴' },
      { id: 6, name: '宠物' }
    ],
    groupBuys: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    scrollTop: 0,
    currentSortLabel: '默认排序',
    showNoMore: false,
    showEmpty: false,
    resultCount: 0
  },

  onLoad: function(options) {
    if (options.keyword) {
      this.setData({ keyword: decodeURIComponent(options.keyword) });
    }
    if (options.categoryId) {
      this.setData({
        categoryId: options.categoryId,
        categoryName: decodeURIComponent(options.categoryName || '')
      });
    }
    this.loadGroupBuys();
  },

  onShow: function() {
    if (this.data.keyword || this.data.categoryId) {
      this.loadGroupBuys();
    }
  },

  onPullDownRefresh: function() {
    this.setData({ page: 1, hasMore: true });
    this.loadGroupBuys().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadGroupBuys(true);
    }
  },

  onPageScroll: function(e) {
    this.setData({ scrollTop: e.scrollTop });
  },

  loadGroupBuys: function(isLoadMore = false) {
    if (this.data.loading) return Promise.resolve();

    this.setData({ loading: true });

    const page = isLoadMore ? this.data.page + 1 : 1;
    const { keyword, categoryId, sortBy } = this.data;

    let query = db.collection('group_buy').where({
      status: 'active',
      deadline: db.command.gt(new Date())
    });

    if (keyword) {
      query = query.where({
        productName: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      });
    }

    let orderField = 'deadline';
    let orderType = 'asc';

    switch (sortBy) {
      case 'hot':
        orderField = 'currentCount';
        orderType = 'desc';
        break;
      case 'time':
        orderField = 'deadline';
        orderType = 'asc';
        break;
      case 'price':
        orderField = 'targetPrice';
        orderType = 'asc';
        break;
      default:
        orderField = 'createdAt';
        orderType = 'desc';
    }

    const sortLabels = {
      'default': '默认排序',
      'distance': '距离最近',
      'hot': '热度最高',
      'time': '即将结束',
      'price': '价格低到高'
    };

    return query
      .orderBy(orderField, orderType)
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

        const newList = isLoadMore ? [...this.data.groupBuys, ...list] : list;
        const showNoMore = !this.data.hasMore && newList.length > 0;
        const showEmpty = newList.length === 0 && !this.data.loading;

        this.setData({
          groupBuys: newList,
          page: page,
          hasMore: list.length >= this.data.pageSize,
          loading: false,
          currentSortLabel: sortLabels[sortBy] || '默认排序',
          showNoMore: showNoMore,
          showEmpty: showEmpty,
          resultCount: newList.length
        });
      })
      .catch(err => {
        console.error(err);
        this.setData({ loading: false, showEmpty: true });
      });
  },

  onSearch: function(e) {
    const keyword = e.detail.value || '';
    if (keyword === this.data.keyword) return;
    this.setData({ keyword, page: 1, hasMore: true });
    this.loadGroupBuys();
  },

  onSortChange: function(e) {
    const { value } = e.detail;
    if (value === this.data.sortBy) return;
    this.setData({ sortBy: value, page: 1, hasMore: true });
    this.loadGroupBuys();
  },

  onCategoryChange: function(e) {
    const { id } = e.currentTarget.dataset;
    if (id === this.data.categoryId) return;
    this.setData({ categoryId: id, page: 1, hasMore: true });
    this.loadGroupBuys();
  },

  goToDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  onShareAppMessage: function() {
    return {
      title: '邻里拼单 - 发现更多好物',
      path: '/pages/discover/discover'
    };
  }
});