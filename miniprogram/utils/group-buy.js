const util = require('./util.js');

function getStatusText(status) {
  const map = {
    active: '进行中',
    success: '已成团',
    failed: '未成团',
    canceled: '已取消'
  };
  return map[status] || '进行中';
}

function getCoverImage(item) {
  if (item.productImages && item.productImages.length > 0) {
    return item.productImages[0];
  }
  return '';
}

function getTierSummary(tieredPrices) {
  if (!Array.isArray(tieredPrices) || tieredPrices.length === 0) {
    return '';
  }
  return [...tieredPrices]
    .sort((a, b) => a.min - b.min)
    .map(item => `${item.min}人¥${util.formatPrice(item.price)}`)
    .join(' / ');
}

function enrichGroupBuy(item = {}) {
  const currentCount = Number(item.currentCount || 0);
  const targetCount = Number(item.targetCount || 0);
  const currentPrice = util.getCurrentPrice(item.tieredPrices, currentCount) || Number(item.targetPrice || 0);
  const progress = util.getProgress(currentCount, targetCount);
  const remainingCount = Math.max(targetCount - currentCount, 0);

  return {
    ...item,
    coverImage: getCoverImage(item),
    currentCount,
    targetCount,
    currentPrice: Number(util.formatPrice(currentPrice)),
    progress,
    countdownStr: util.formatCountdownStr(item.deadline),
    statusText: getStatusText(item.status),
    tierSummary: getTierSummary(item.tieredPrices),
    remainingCount,
    remainingText: remainingCount > 0 ? `还差${remainingCount}人` : '已达成目标'
  };
}

function enrichGroupBuyList(list = []) {
  return list.map(enrichGroupBuy);
}

function getSortLabel(value) {
  const labelMap = {
    default: '最新发布',
    hot: '热度优先',
    time: '即将结束',
    price: '价格低到高'
  };
  return labelMap[value] || '最新发布';
}

module.exports = {
  enrichGroupBuy,
  enrichGroupBuyList,
  getSortLabel,
  getStatusText
};
