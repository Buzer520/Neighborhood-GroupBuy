const app = getApp();
const db = wx.cloud.database();
const util = require("../../utils/util.js");
const { enrichGroupBuy } = require("../../utils/group-buy.js");

Page({
  data: {
    groupId: "",
    groupBuy: null,
    creator: null,
    participants: [],
    currentPrice: 0,
    progress: 0,
    countdown: "",
    hasJoined: false,
    myOrder: null,
    currentTab: "deposit",
    quantity: 1,
    showJoinModal: false,
    isCreator: false,
    countdownTimer: null,
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ groupId: options.id });
      this.loadGroupBuyDetail();
    }
  },

  onUnload: function () {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
  },

  loadGroupBuyDetail: function () {
    wx.showLoading({ title: "加载中..." });

    db.collection("group_buy")
      .doc(this.data.groupId)
      .get()
      .then((res) => {
        const groupBuy = enrichGroupBuy(res.data);
        const isCreator = groupBuy.creatorId === app.globalData.openId;

        this.setData({
          groupBuy,
          currentPrice: groupBuy.currentPrice,
          progress: groupBuy.progress,
          isCreator,
        });

        this.startCountdown();
        this.loadCreatorInfo(groupBuy.creatorId);
        this.loadParticipants();
        this.checkIfJoined();
      })
      .catch((err) => {
        console.error(err);
        wx.showToast({ title: "加载失败", icon: "none" });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  startCountdown: function () {
    const updateCountdown = () => {
      const { groupBuy } = this.data;
      if (!groupBuy) return;

      const countdownStr = util.formatCountdownStr(groupBuy.deadline);
      this.setData({ countdown: countdownStr });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    this.setData({ countdownTimer: timer });
  },

  loadCreatorInfo: function (creatorId) {
    db.collection("user")
      .doc(creatorId)
      .get()
      .then((res) => {
        this.setData({ creator: res.data });
      })
      .catch(() => {
        this.setData({
          creator: {
            nickName: "热心团长",
            avatarUrl: "/assets/images/mine-active.png",
          },
        });
      });
  },

  loadParticipants: function () {
    db.collection("order")
      .where({
        groupId: this.data.groupId,
        status: db.command.in(["pending", "wait_pay", "paid"]),
      })
      .limit(20)
      .get()
      .then((res) => {
        const participantIds = res.data.map((o) => o.userId);
        if (participantIds.length === 0) {
          this.setData({ participants: [] });
          return;
        }

        db.collection("user")
          .where({
            _id: db.command.in(participantIds),
          })
          .field({ avatarUrl: true, nickName: true })
          .get()
          .then((userRes) => {
            this.setData({ participants: userRes.data });
          });
      });
  },

  checkIfJoined: function () {
    const openId = app.globalData.openId;
    if (!openId) return;

    db.collection("order")
      .where({
        groupId: this.data.groupId,
        userId: openId,
      })
      .get()
      .then((res) => {
        if (res.data.length > 0) {
          this.setData({
            hasJoined: true,
            myOrder: res.data[0],
          });
        }
      });
  },

  onSwiperChange: function (e) {
    this.setData({
      currentSwiper: e.detail.current,
    });
  },

  showJoinModal: function () {
    if (this.data.groupBuy.status !== "active") {
      wx.showToast({ title: "拼单已结束", icon: "none" });
      return;
    }

    this.setData({
      showJoinModal: true,
      quantity: 1,
    });
  },

  hideJoinModal: function () {
    this.setData({ showJoinModal: false });
  },

  onQuantityChange: function (e) {
    const action = e.currentTarget.dataset.action;
    if (action === "minus") {
      this.setData({ quantity: Math.max(1, this.data.quantity - 1) });
      return;
    }
    if (action === "plus") {
      this.setData({ quantity: this.data.quantity + 1 });
      return;
    }
    const { value } = e.detail;
    this.setData({ quantity: Math.max(1, parseInt(value, 10) || 1) });
  },

  selectPayType: function (e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ currentTab: type });
  },

  calculateAmount: function () {
    const { currentPrice, quantity, currentTab } = this.data;
    const total = currentPrice * quantity;
    if (currentTab === "deposit") {
      return util.calculateDeposit(currentPrice, quantity);
    }
    return total;
  },

  joinGroupBuy: function () {
    const { currentPrice, quantity, currentTab, hasJoined } = this.data;

    if (hasJoined) {
      wx.showToast({ title: "您已参与过此拼单", icon: "none" });
      return;
    }

    const amount = this.calculateAmount();

    wx.showModal({
      title: "确认参与",
      content:
        currentTab === "deposit"
          ? `支付定金 ¥${amount}（30%），拼单成功后需支付尾款 ¥${(currentPrice * quantity - amount).toFixed(2)}`
          : `支付全款 ¥${amount}`,
      success: (res) => {
        if (res.confirm) {
          this.processPayment(amount);
        }
      },
    });
  },

  processPayment: function (amount) {
    wx.showLoading({ title: "支付中..." });

    wx.cloud.callFunction({
      name: "joinGroupBuy",
      data: {
        groupId: this.data.groupId,
        quantity: this.data.quantity,
        payType: this.data.currentTab,
        totalAmount: this.data.currentPrice * this.data.quantity,
        deposit: this.data.currentTab === "deposit" ? amount : 0,
      },
      success: (res) => {
        if (res.result && res.result.success) {
          wx.showToast({ title: "参与成功", icon: "success" });
          this.hideJoinModal();
          this.loadGroupBuyDetail();
        } else {
          wx.showToast({
            title: res.result?.message || "参与失败",
            icon: "none",
          });
        }
      },
      fail: (err) => {
        console.error(err);
        wx.showToast({ title: "参与失败", icon: "none" });
      },
      complete: () => {
        wx.hideLoading();
      },
    });
  },

  goToShare: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"],
    });
    wx.showToast({
      title: "请点击右上角转发给邻居",
      icon: "none",
    });
  },

  goToMyOrder: function () {
    wx.switchTab({
      url: "/pages/mine/mine",
    });
  },

  onShareAppMessage: function () {
    const { groupBuy } = this.data;
    return {
      title: `【拼单】${groupBuy.productName} - 仅需¥${this.data.currentPrice}`,
      path: `/pages/detail/detail?id=${this.data.groupId}`,
      imageUrl: groupBuy.productImages[0],
    };
  },

  onShareTimeline: function () {
    const { groupBuy } = this.data;
    return {
      title: `【拼单】${groupBuy.productName} - 仅需¥${this.data.currentPrice}`,
      query: `id=${this.data.groupId}`,
      imageUrl: groupBuy.productImages[0],
    };
  },
});
