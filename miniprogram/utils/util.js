const formatTime = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`;
};

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

const formatCountdown = endTime => {
  const now = Date.now();
  const end = new Date(endTime).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
};

const formatCountdownStr = endTime => {
  const { days, hours, minutes, seconds, isExpired } = formatCountdown(endTime);

  if (isExpired) {
    return '已结束';
  }

  if (days > 0) {
    return `${days}天${hours}时${minutes}分`;
  }
  if (hours > 0) {
    return `${hours}时${minutes}分${seconds}秒`;
  }
  return `${minutes}分${seconds}秒`;
};

const formatPrice = price => {
  if (typeof price !== 'number') {
    price = parseFloat(price) || 0;
  }
  return price.toFixed(2);
};

const generatePickupCode = () => {
  const code = Math.random().toString().slice(2, 8);
  return code.padStart(6, '0');
};

const getRelativeTime = date => {
  const now = Date.now();
  const target = new Date(date).getTime();
  const diff = now - target;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  }

  const d = new Date(date);
  return `${d.getMonth() + 1}-${d.getDate()}`;
};

const validatePhone = phone => {
  return /^1[3-9]\d{9}$/.test(phone);
};

const validateRequired = value => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

const validateNumber = value => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

const validatePositiveInteger = value => {
  return /^[1-9]\d*$/.test(value);
};

const debounce = (fn, delay = 500) => {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

const throttle = (fn, delay = 500) => {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last > delay) {
      last = now;
      fn.apply(this, args);
    }
  };
};

const calculateDeposit = (price, quantity = 1) => {
  return parseFloat((price * quantity * 0.3).toFixed(2));
};

const getCurrentPrice = (tieredPrices, currentCount) => {
  if (!tieredPrices || tieredPrices.length === 0) {
    return null;
  }

  let price = tieredPrices[0].price;
  for (const tier of tieredPrices) {
    if (currentCount >= tier.min) {
      price = tier.price;
    }
  }
  return price;
};

const getProgress = (current, target) => {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
};

module.exports = {
  formatTime,
  formatNumber,
  formatCountdown,
  formatCountdownStr,
  formatPrice,
  generatePickupCode,
  getRelativeTime,
  validatePhone,
  validateRequired,
  validateNumber,
  validatePositiveInteger,
  debounce,
  throttle,
  calculateDeposit,
  getCurrentPrice,
  getProgress
};