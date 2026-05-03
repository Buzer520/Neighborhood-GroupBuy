const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

function generatePickupCode() {
  const code = Math.random().toString().slice(2, 8);
  return code.padStart(6, '0');
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  const {
    groupId,
    quantity,
    payType,
    totalAmount,
    deposit
  } = event;

  if (!groupId || !quantity || !payType) {
    return {
      success: false,
      message: '参数不完整'
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

    if (groupBuy.status !== 'active') {
      return {
        success: false,
        message: '拼单已结束'
      };
    }

    if (new Date(groupBuy.deadline) < new Date()) {
      return {
        success: false,
        message: '拼单已过期'
      };
    }

    const existingOrderRes = await db.collection('order')
      .where({
        groupId,
        userId: openId,
        status: _.in(['pending', 'wait_pay', 'paid'])
      })
      .get();

    if (existingOrderRes.data.length > 0) {
      return {
        success: false,
        message: '您已参与过此拼单'
      };
    }

    const userRes = await db.collection('user').doc(openId).get();
    const user = userRes.data;

    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    let orderData = {
      groupId,
      userId: openId,
      quantity: parseInt(quantity),
      unitPrice: groupBuy.targetPrice,
      totalAmount: parseFloat(totalAmount) || parseFloat(groupBuy.targetPrice) * parseInt(quantity),
      deposit: parseFloat(deposit) || 0,
      status: payType === 'full' ? 'paid' : 'pending',
      pickupCode: payType === 'full' ? generatePickupCode() : '',
      createdAt: new Date(),
      payTime: payType === 'full' ? new Date() : null
    };

    if (payType === 'deposit') {
      const depositAmount = parseFloat(deposit) || parseFloat(totalAmount) * 0.3;

      if (user.balance < depositAmount) {
        return {
          success: false,
          message: '余额不足'
        };
      }

      await db.collection('user').doc(openId).update({
        data: {
          balance: _.inc(-depositAmount)
        }
      });

      orderData.status = 'pending';
    }

    await db.collection('order').add({
      data: orderData
    });

    await db.collection('group_buy').doc(groupId).update({
      data: {
        currentCount: _.inc(parseInt(quantity))
      }
    });

    await db.collection('message').add({
      data: {
        userId: openId,
        type: 'system',
        title: '参与拼单成功',
        content: `您已成功参与拼单"${groupBuy.productName}"，${payType === 'full' ? '已支付全款' : '已支付定金'}${payType === 'deposit' ? '，拼单成功后需支付尾款' : ''}。`,
        groupId,
        read: false,
        createdAt: new Date()
      }
    });

    const creatorMsg = {
      userId: groupBuy.creatorId,
      type: 'interaction',
      title: '有人加入您的拼单',
      content: `用户加入了您的拼单"${groupBuy.productName}"，当前${groupBuy.currentCount + parseInt(quantity)}人`,
      groupId,
      read: false,
      createdAt: new Date()
    };

    if (groupBuy.creatorId !== openId) {
      await db.collection('message').add({
        data: creatorMsg
      });
    }

    return {
      success: true,
      orderId: orderData._id
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message || '参与失败'
    };
  }
};