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

async function processSuccessfulGroup(groupBuy) {
  const orders = await db.collection('order')
    .where({
      groupId: groupBuy._id,
      status: 'pending'
    })
    .get();

  const updatePromises = orders.data.map(order => {
    const pickupCode = generatePickupCode();
    return db.collection('order').doc(order._id).update({
      data: {
        status: 'wait_pay',
        pickupCode
      }
    });
  });

  await Promise.all(updatePromises);

  await db.collection('group_buy').doc(groupBuy._id).update({
    data: {
      status: 'success'
    }
  });

  await db.collection('message').add({
    data: {
      userId: groupBuy.creatorId,
      type: 'system',
      title: '拼单成功',
      content: `恭喜！拼单"${groupBuy.productName}"已达到目标人数，拼单成功！`,
      groupId: groupBuy._id,
      read: false,
      createdAt: new Date()
    }
  });

  for (const order of orders.data) {
    await db.collection('message').add({
      data: {
        userId: order.userId,
        type: 'system',
        title: '拼单成功',
        content: `拼单"${groupBuy.productName}"已达到目标人数，拼单成功！请在规定时间内支付尾款。`,
        groupId: groupBuy._id,
        read: false,
        createdAt: new Date()
      }
    });
  }

  return { success: true, processed: orders.data.length };
}

async function processFailedGroup(groupBuy) {
  const orders = await db.collection('order')
    .where({
      groupId: groupBuy._id,
      status: _.in(['pending', 'paid'])
    })
    .get();

  const refundPromises = orders.data.map(async order => {
    let refundAmount = order.deposit || 0;

    if (order.status === 'paid') {
      refundAmount = order.totalAmount;
    }

    if (refundAmount > 0) {
      await db.collection('user').doc(order.userId).update({
        data: {
          balance: _.inc(refundAmount)
        }
      });

      await db.collection('deposit_log').add({
        data: {
          userId: order.userId,
          amount: refundAmount,
          type: 'refund',
          relatedId: groupBuy._id,
          createdAt: new Date()
        }
      });
    }

    await db.collection('order').doc(order._id).update({
      data: {
        status: 'refunded'
      }
    });
  });

  await Promise.all(refundPromises);

  await db.collection('group_buy').doc(groupBuy._id).update({
    data: {
      status: 'failed'
    }
  });

  const creatorRefund = 1;
  await db.collection('user').doc(groupBuy.creatorId).update({
    data: {
      balance: _.inc(creatorRefund)
    }
  });

  await db.collection('deposit_log').add({
    data: {
      userId: groupBuy.creatorId,
      amount: creatorRefund,
      type: 'refund',
      relatedId: groupBuy._id,
      createdAt: new Date()
    }
  });

  await db.collection('message').add({
    data: {
      userId: groupBuy.creatorId,
      type: 'system',
      title: '拼单失败',
      content: `很遗憾，拼单"${groupBuy.productName}"未达到目标人数，拼单失败。诚意金已退还。`,
      groupId: groupBuy._id,
      read: false,
      createdAt: new Date()
    }
  });

  for (const order of orders.data) {
    await db.collection('message').add({
      data: {
        userId: order.userId,
        type: 'system',
        title: '拼单失败退款',
        content: `拼单"${groupBuy.productName}"未达到目标人数，拼单失败。${order.deposit > 0 ? '定金已退还。' : ''}`,
        groupId: groupBuy._id,
        read: false,
        createdAt: new Date()
      }
    });
  }

  return { success: true, processed: orders.data.length + 1 };
}

exports.main = async (event, context) => {
  try {
    const now = new Date();

    const expiredGroups = await db.collection('group_buy')
      .where({
        status: 'active',
        deadline: _.lt(now)
      })
      .limit(50)
      .get();

    const results = [];

    for (const group of expiredGroups.data) {
      try {
        let result;

        if (group.currentCount >= group.targetCount) {
          result = await processSuccessfulGroup(group);
        } else {
          result = await processFailedGroup(group);
        }

        results.push({
          groupId: group._id,
          ...result
        });
      } catch (err) {
        console.error(`处理拼单 ${group._id} 失败:`, err);
        results.push({
          groupId: group._id,
          success: false,
          error: err.message
        });
      }
    }

    return {
      success: true,
      processed: results.length,
      results
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message || '检查失败'
    };
  }
};