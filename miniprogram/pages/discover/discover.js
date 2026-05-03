const db = wx.cloud.database();
const {
  enrichGroupBuyList,
  getSortLabel,
} = require("../../utils/group-buy.js");
const { CATEGORY_OPTIONS, SORT_OPTIONS } = require("../../config/preset.js");

Page({
  data: {
    keyword: "",
    categoryId: "",
    categoryName: "",
    sortBy: "default",
    sortOptions: SORT_OPTIONS,
    sortIndex: 0,
    categories: CATEGORY_OPTIONS,
    groupBuys: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    currentSortLabel: getSortLabel("default"),
    showNoMore: false,
    showEmpty: false,
    resultCount: 0,
  },

  onLoad(options) {
    const state = {};
    if (options.keyword) {
      state.keyword = decodeURIComponent(options.keyword);
    }
    if (options.categoryId !== undefined) {
      state.categoryId = String(options.categoryId);
      state.categoryName = decodeURIComponent(options.categoryName || "");
    }
    this.setData(state);
    this.loadGroupBuys();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.loadGroupBuys().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadGroupBuys(true);
    }
  },

  getQueryConditions() {
    return {
      status: "active",
      deadline: db.command.gt(new Date()),
    };
  },

  loadGroupBuys(isLoadMore = false) {
    if (this.data.loading) {
      return Promise.resolve();
    }

    this.setData({ loading: true });
    const nextPage = isLoadMore ? this.data.page + 1 : 1;
    const { keyword, sortBy, categoryId, categoryName } = this.data;

    let query = db.collection("group_buy").where(this.getQueryConditions());
    if (keyword || (categoryId && categoryName && categoryId !== "")) {
      const keywords = [keyword, categoryName].filter(Boolean).join("|");
      query = query.where({
        productName: db.RegExp({
          regexp: keywords,
          options: "i",
        }),
      });
    }

    let orderField = "createdAt";
    let orderType = "desc";
    if (sortBy === "hot") {
      orderField = "currentCount";
      orderType = "desc";
    } else if (sortBy === "time") {
      orderField = "deadline";
      orderType = "asc";
    } else if (sortBy === "price") {
      orderField = "targetPrice";
      orderType = "asc";
    }

    return query
      .orderBy(orderField, orderType)
      .skip((nextPage - 1) * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then((res) => {
        const list = enrichGroupBuyList(res.data);
        const groupBuys = isLoadMore ? this.data.groupBuys.concat(list) : list;
        const hasMore = list.length >= this.data.pageSize;

        this.setData({
          groupBuys,
          page: nextPage,
          hasMore,
          loading: false,
          currentSortLabel: getSortLabel(sortBy),
          showNoMore: !hasMore && groupBuys.length > 0,
          showEmpty: groupBuys.length === 0,
          resultCount: groupBuys.length,
        });
      })
      .catch((err) => {
        console.error("loadGroupBuys error", err);
        this.setData({
          loading: false,
          showEmpty: this.data.groupBuys.length === 0,
        });
      });
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value || "" });
  },

  onSearchConfirm() {
    this.setData({ page: 1, hasMore: true });
    this.loadGroupBuys();
  },

  onSortChange(e) {
    const sortIndex = Number(e.detail.value || 0);
    const sortBy = this.data.sortOptions[sortIndex].value;
    if (sortBy === this.data.sortBy) {
      return;
    }
    this.setData({
      sortIndex,
      sortBy,
      page: 1,
      hasMore: true,
    });
    this.loadGroupBuys();
  },

  onCategoryChange(e) {
    const { id, name } = e.currentTarget.dataset;
    const categoryId = String(id);
    if (categoryId === this.data.categoryId) {
      return;
    }
    this.setData({
      categoryId,
      categoryName: name,
      page: 1,
      hasMore: true,
    });
    this.loadGroupBuys();
  },

  clearFilters() {
    this.setData({
      keyword: "",
      categoryId: "",
      categoryName: "",
      sortBy: "default",
      sortIndex: 0,
      page: 1,
      hasMore: true,
    });
    this.loadGroupBuys();
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },

  onShareAppMessage() {
    return {
      title: "邻里拼单，发现更多附近好物",
      path: "/pages/discover/discover",
    };
  },
});
