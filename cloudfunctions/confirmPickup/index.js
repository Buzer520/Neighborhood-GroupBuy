const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  const { orderId, pickupCode } = event;

  if (!orderId && !pickupCode) {
    return {
      success: false,
      message: '订单ID或提货码不能为空'
    };
  }

  try {
    let order;

    if (orderId) {
      const orderRes = await db.collection('order').doc(orderId).get();
      order = orderRes.data;
    } else {
      const orderRes = await db.collection('order')
        .where({ pickupCode })
        .get();
      order = orderRes.data[0];
    }

    if (!order) {
      return {
        success: false,
        message: '订单不存在'
      };
    }

    if (order.status !== 'paid') {
      return {
        success: false,
        message: '订单状态不允许核销'
      };
    }

    await db.collection('order').doc(order._id).update({
      data: {
        status: 'picked'
      }
    });

    const groupRes = await db.collection('group_buy').doc(order.groupId).get();
    const groupBuy = groupRes.data;

    await db.collection('message').add({
      data: {
        userId: order.userId,
        type: 'system',
        title: '提货成功',
        content: `您的拼单"${groupBuy.productName}"已提货成功，感谢您的参与！`,
        groupId: order.groupId,
        read: false,
        createdAt: new Date()
      }
    });

    return {
      success: true
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message || '核销失败'
    };
  }
};