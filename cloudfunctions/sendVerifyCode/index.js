const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function generateCode() {
  return Math.random().toString().slice(2, 8);
}

exports.main = async (event, context) => {
  const { phone, type } = event;

  if (!phone || !type) {
    return {
      success: false,
      message: '手机号和类型不能为空'
    };
  }

  const code = generateCode();

  try {
    await db.collection('verify_code').add({
      data: {
        phone,
        code,
        type,
        expireAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        createdAt: new Date()
      }
    });

    console.log(`验证码 ${code} 已发送到 ${phone}`);

    return {
      success: true,
      message: '验证码已发送',
      code: code
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: '发送失败'
    };
  }
};