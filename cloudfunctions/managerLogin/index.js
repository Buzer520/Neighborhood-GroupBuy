const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { phone, verifyCode } = event;

  if (!phone || !verifyCode) {
    return {
      success: false,
      message: '手机号和验证码不能为空'
    };
  }

  try {
    const managerRes = await db.collection('pick_up_point')
      .where({ managerPhone: phone })
      .get();

    if (managerRes.data.length === 0) {
      return {
        success: false,
        message: '该手机号未注册为团长'
      };
    }

    const manager = managerRes.data[0];

    return {
      success: true,
      manager: {
        _id: manager._id,
        name: manager.managerName,
        phone: manager.managerPhone,
        pickupPoint: manager.name
      }
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: err.message || '登录失败'
    };
  }
};