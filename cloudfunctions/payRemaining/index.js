const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  const { orderId } = event;

  if (!orderId) {
    return {
      success: false,
      message: '订单ID不能为空'
    };
  }

  try {
    const orderRes = await db.collection('order').doc(orderId).get();
    const order = orderRes.data;

    if (!order) {
      return {
        success: false,
        message: '订单不存在'
      };
    }

    if (order.userId !== openId) {
      return {
        success: false,
        message: '无权操作此订单'
      };
    }

    if (order.status !== 'wait_pay') {
      return {
        success: false,
        message: '订单状态不允许支付尾款'
      };
    }

    const remainingAmount = order.totalAmount - order.deposit;

    const userRes = await db.collection('user').doc(openId).get();
    const user = userRes.data;

    if (user.balance < remainingAmount) {
      return {
        success: false,
        message: '余额不足，请先充值'
      };
    }

    await db.collection('user').doc(openId).update({
      data: {
        balance: _.inc(-remainingAmount)
      }
    });

    const pickupCode = Math.random().toString().slice(2, 8).padStart(6, '0');

    await db.collection('order').doc(orderId).update({
      data: {
        status: 'paid',
        deposit: order.totalAmount,
        pickupCode,
        payTime: new Date()
      }
    });

    const groupRes = await db.collection('group_buy').doc(order.groupId).get();
    const groupBuy = groupRes.data;

    await db.collection('message').add({
      data: {
        userId: openId,
        type: 'system',
        title: '尾款支付成功',
        content: `您已成功支付拼单"${groupBuy.productName}"的尾款${remainingAmount}元。请保管好提货码：${pickupCode}`,
        groupId: order.groupId,
        read: false,
        createdAt: new Date()
      }
    });

    return {
      success: true,
      pickupCode
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message || '支付失败'
    };
  }
};