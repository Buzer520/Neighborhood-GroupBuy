const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  
  console.log('login function called, openId:', openId);
  
  return {
    success: true,
    openid: openId,
    message: '登录成功'
  };
};