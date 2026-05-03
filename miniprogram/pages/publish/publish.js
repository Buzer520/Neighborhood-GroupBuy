const app = getApp();
const db = wx.cloud.database();
const util = require('../../utils/util.js');

Page({
  data: {
    productName: '',
    productImages: [],
    targetPrice: '',
    spec: '',
    targetCount: 10,
    deadlineIndex: 0,
    deadlineOptions: ['24小时', '48小时', '72小时'],
    deadlineHours: [24, 48, 72],
    remark: '',
    uploading: false,
    community: '',
    pickupPoint: '',
    loading: false
  },

  onLoad: function() {
    this.setData({
      community: app.globalData.community || '幸福小区'
    });
    this.loadPickupPoints();
  },

  loadPickupPoints: function() {
    db.collection('pick_up_point')
      .where({
        community: this.data.community
      })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          this.setData({
            pickupPoint: res.data[0].name
          });
        }
      });
  },

  onProductNameInput: function(e) {
    this.setData({ productName: e.detail.value });
  },

  onTargetPriceInput: function(e) {
    this.setData({ targetPrice: e.detail.value });
  },

  onSpecInput: function(e) {
    this.setData({ spec: e.detail.value });
  },

  onTargetCountChange: function(e) {
    this.setData({ targetCount: parseInt(e.detail.value) || 2 });
  },

  onDeadlineChange: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({ deadlineIndex: index });
  },

  onRemarkInput: function(e) {
    this.setData({ remark: e.detail.value });
  },

  chooseImage: function() {
    const maxCount = 6 - this.data.productImages.length;
    if (maxCount <= 0) {
      wx.showToast({ title: '最多上传6张图片', icon: 'none' });
      return;
    }

    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.uploadImages(res.tempFilePaths);
      }
    });
  },

  uploadImages: function(filePaths) {
    this.setData({ uploading: true });

    const promises = filePaths.map(filePath => {
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      return wx.cloud.uploadFile({
        cloudPath: `products/${fileName}`,
        filePath: filePath
      });
    });

    Promise.all(promises)
      .then(uploadResults => {
        const urls = uploadResults.map(r => r.fileID);
        this.setData({
          productImages: [...this.data.productImages, ...urls]
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '上传失败', icon: 'none' });
      })
      .finally(() => {
        this.setData({ uploading: false });
      });
  },

  removeImage: function(e) {
    const { index } = e.currentTarget.dataset;
    const images = [...this.data.productImages];
    images.splice(index, 1);
    this.setData({ productImages: images });
  },

  previewImage: function(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      current: this.data.productImages[index],
      urls: this.data.productImages
    });
  },

  validateForm: function() {
    const { productName, productImages, targetPrice, targetCount } = this.data;

    if (!util.validateRequired(productName)) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return false;
    }

    if (productImages.length === 0) {
      wx.showToast({ title: '请上传商品图片', icon: 'none' });
      return false;
    }

    if (!util.validateNumber(targetPrice) || parseFloat(targetPrice) <= 0) {
      wx.showToast({ title: '请输入正确的期望价格', icon: 'none' });
      return false;
    }

    if (!util.validatePositiveInteger(targetCount) || targetCount < 2 || targetCount > 100) {
      wx.showToast({ title: '拼团人数需为2-100的整数', icon: 'none' });
      return false;
    }

    return true;
  },

  generateTieredPrices: function(targetPrice) {
    const price = parseFloat(targetPrice);
    return [
      { min: 1, price: Math.ceil(price * 1.2) },
      { min: Math.ceil(targetCount * 0.5), price: Math.ceil(price * 1.05) },
      { min: targetCount, price: price }
    ];
  },

  publishGroupBuy: function() {
    if (!this.validateForm()) return;

    const { productName, productImages, targetPrice, spec, targetCount, deadlineIndex, remark, community, pickupPoint } = this.data;
    const deadlineHours = [24, 48, 72][deadlineIndex];
    const deadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

    this.setData({ loading: true });

    const tieredPrices = [
      { min: 1, price: Math.ceil(parseFloat(targetPrice) * 1.2) },
      { min: Math.ceil(targetCount * 0.5), price: Math.ceil(parseFloat(targetPrice) * 1.05) },
      { min: targetCount, price: parseFloat(targetPrice) }
    ];

    wx.cloud.callFunction({
      name: 'createGroupBuy',
      data: {
        productName: productName.trim(),
        productImages,
        targetPrice: parseFloat(targetPrice),
        spec: spec.trim(),
        targetCount,
        tieredPrices,
        deadline: deadline.toISOString(),
        remark: remark.trim(),
        community,
        pickupPoint
      },
      success: res => {
        if (res.result && res.result.success) {
          wx.showToast({ title: '发布成功', icon: 'success' });
          setTimeout(() => {
            wx.redirectTo({
              url: `/pages/detail/detail?id=${res.result.groupId}`
            });
          }, 1500);
        } else {
          wx.showToast({ title: res.result?.message || '发布失败', icon: 'none' });
        }
      },
      fail: err => {
        console.error(err);
        wx.showToast({ title: '发布失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  onShareAppMessage: function() {
    return {
      title: '邻里拼单 - 一起拼更便宜',
      path: '/pages/index/index'
    };
  }
});