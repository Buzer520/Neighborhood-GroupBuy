const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  const { groupId } = event;

  if (!groupId) {
    return {
      success: false,
      message: '拼单ID不能为空'
    };
  }

  try {
    const groupRes = await db.collection('group_buy').doc(groupId).get();
    const groupBuy = groupRes.data;

    if (!groupBuy) {
      return {
        success: false,
        message: '拼单不存在'
      };
    }

    let currentPrice = groupBuy.targetPrice;
    if (groupBuy.tieredPrices && groupBuy.tieredPrices.length > 0) {
      for (const tier of groupBuy.tieredPrices) {
        if (groupBuy.currentCount >= tier.min) {
          currentPrice = tier.price;
        }
      }
    }

    return {
      success: true,
      config: {
        groupId,
        productName: groupBuy.productName,
        productImage: groupBuy.productImages[0] || '',
        currentPrice,
        targetCount: groupBuy.targetCount,
        currentCount: groupBuy.currentCount,
        deadline: groupBuy.deadline,
        community: groupBuy.community,
        creatorId: groupBuy.creatorId,
        openId
      }
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message || '获取失败'
    };
  }
};