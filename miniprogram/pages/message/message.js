const app = getApp();
const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({
  data: {
    currentTab: 'system',
    tabs: [
      { value: 'system', label: '系统通知' },
      { value: '互动', label: '互动消息' }
    ],
    systemMessages: [],
    interactionMessages: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    hasUnreadSystem: false,
    hasUnreadInteraction: false,
    showNoMore: false,
    showEmpty: false
  },

  onLoad: function() {
    this.loadMessages();
  },

  onPullDownRefresh: function() {
    this.setData({ page: 1, hasMore: true });
    this.loadMessages().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMessages(true);
    }
  },

  onShow: function() {
    this.watchMessages();
  },

  onUnload: function() {
    if (this.messageWatcher) {
      this.messageWatcher.close();
    }
  },

  watchMessages: function() {
    const openId = app.globalData.openId;
    if (!openId) return;

    if (this.messageWatcher) {
      this.messageWatcher.close();
    }

    this.messageWatcher = db.collection('message')
      .where({ userId: openId })
      .watch({
        onChange: () => {
          this.setData({ page: 1, hasMore: true });
          this.loadMessages();
        },
        onError: err => {
          console.error(err);
        }
      });
  },

  loadMessages: function(isLoadMore = false) {
    if (this.loading) return Promise.resolve();

    this.setData({ loading: true });

    const openId = app.globalData.openId;
    if (!openId) {
      this.setData({ loading: false });
      return Promise.resolve();
    }

    const page = isLoadMore ? this.data.page + 1 : 1;
    const { currentTab } = this.data;

    let query = db.collection('message')
      .where({
        userId: openId,
        type: currentTab === 'system' ? 'system' : 'interaction'
      })
      .orderBy('createdAt', 'desc');

    return query
      .skip((page - 1) * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const list = res.data.map(item => ({
          ...item,
          timeStr: util.getRelativeTime(item.createdAt)
        }));

        const key = currentTab === 'system' ? 'systemMessages' : 'interactionMessages';
        const newList = isLoadMore ? [...this.data[key], ...list] : list;
        const hasUnreadSystem = currentTab === 'system' 
          ? newList.some(function(m) { return !m.read; })
          : this.data.hasUnreadSystem;
        const hasUnreadInteraction = currentTab === 'interaction' 
          ? newList.some(function(m) { return !m.read; })
          : this.data.hasUnreadInteraction;

        const showNoMore = !hasMore && newList.length > 0;
        const showEmpty = newList.length === 0 && !loading;

        this.setData({
          [key]: newList,
          page: page,
          hasMore: list.length >= this.data.pageSize,
          loading: false,
          hasUnreadSystem: hasUnreadSystem,
          hasUnreadInteraction: hasUnreadInteraction,
          showNoMore: showNoMore,
          showEmpty: showEmpty
        });
      })
      .catch(err => {
        console.error(err);
        this.setData({ loading: false });
      });
  },

  onTabChange: function(e) {
    const { value } = e.detail;
    if (value === this.data.currentTab) return;

    this.setData({
      currentTab: value,
      page: 1,
      hasMore: true
    });

    const key = value === 'system' ? 'systemMessages' : 'interactionMessages';
    if (this.data[key].length === 0) {
      this.loadMessages();
    }
  },

  goToDetail: function(e) {
    const { id, groupid } = e.currentTarget.dataset;
    if (!groupid) return;

    db.collection('message').doc(id).update({
      data: { read: true }
    });

    wx.navigateTo({
      url: `/pages/detail/detail?id=${groupid}`
    });
  },

  markAsRead: function(e) {
    const { id } = e.currentTarget.dataset;

    db.collection('message').doc(id).update({
      data: { read: true }
    }).then(() => {
      this.setData({ page: 1, hasMore: true });
      this.loadMessages();
    });
  },

  markAllRead: function() {
    const openId = app.globalData.openId;
    if (!openId) return;

    const key = this.data.currentTab === 'system' ? 'systemMessages' : 'interactionMessages';
    const unreadIds = this.data[key].filter(m => !m.read).map(m => m._id);

    if (unreadIds.length === 0) return;

    Promise.all(unreadIds.map(id =>
      db.collection('message').doc(id).update({ data: { read: true } })
    )).then(() => {
      this.setData({ page: 1, hasMore: true });
      this.loadMessages();
    });
  }
});