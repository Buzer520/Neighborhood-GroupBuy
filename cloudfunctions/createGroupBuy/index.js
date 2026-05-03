const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  const {
    productName,
    productImages,
    targetPrice,
    spec,
    targetCount,
    tieredPrices,
    deadline,
    remark,
    community,
    pickupPoint
  } = event;

  if (!productName || productImages.length === 0 || !targetPrice || !targetCount) {
    return {
      success: false,
      message: '参数不完整'
    };
  }

  if (targetCount < 2 || targetCount > 100) {
    return {
      success: false,
      message: '拼团人数需在2-100之间'
    };
  }

  try {
    const userRes = await db.collection('user').doc(openId).get();
    const user = userRes.data;

    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const DEPOSIT_FEE = 1;

    if (user.balance < DEPOSIT_FEE) {
      return {
        success: false,
        message: '余额不足，需支付1元诚意金'
      };
    }

    await db.collection('user').doc(openId).update({
      data: {
        balance: _.inc(-DEPOSIT_FEE)
      }
    });

    const groupBuy = {
      _id: `${openId}_${Date.now()}`,
      creatorId: openId,
      community: community || '幸福小区',
      productName,
      productImages,
      spec: spec || '',
      targetPrice: parseFloat(targetPrice),
      targetCount: parseInt(targetCount),
      currentCount: 1,
      tieredPrices,
      status: 'active',
      deadline: new Date(deadline),
      goodsReceivedAt: null,
      pickupPoint: pickupPoint || '',
      remark: remark || '',
      createdAt: new Date()
    };

    await db.collection('group_buy').add({
      data: groupBuy
    });

    await db.collection('deposit_log').add({
      data: {
        userId: openId,
        amount: -DEPOSIT_FEE,
        type: 'pay',
        relatedId: groupBuy._id,
        createdAt: new Date()
      }
    });

    await db.collection('order').add({
      data: {
        groupId: groupBuy._id,
        userId: openId,
        quantity: 1,
        unitPrice: targetPrice,
        totalAmount: parseFloat(targetPrice),
        deposit: 0,
        status: 'pending',
        pickupCode: '',
        createdAt: new Date(),
        payTime: null
      }
    });

    await db.collection('message').add({
      data: {
        userId: openId,
        type: 'system',
        title: '拼单发布成功',
        content: `您已成功发布拼单"${productName}"，诚意金1元已扣除。`,
        groupId: groupBuy._id,
        read: false,
        createdAt: new Date()
      }
    });

    return {
      success: true,
      groupId: groupBuy._id
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message || '发布失败'
    };
  }
};