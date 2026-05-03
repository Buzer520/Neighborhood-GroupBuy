const COMMUNITY_OPTIONS = ['幸福小区', '阳光花园', '绿城锦园', '碧桂园'];

const CATEGORY_OPTIONS = [
  { id: '', name: '全部', icon: '✨', subtitle: '精选' },
  { id: 1, name: '生鲜', icon: '🥬', subtitle: '蔬果肉蛋' },
  { id: 2, name: '水果', icon: '🍎', subtitle: '时令鲜果' },
  { id: 3, name: '粮油', icon: '🌾', subtitle: '厨房常备' },
  { id: 4, name: '日化', icon: '🧴', subtitle: '家庭清洁' },
  { id: 5, name: '母婴', icon: '👶', subtitle: '宝宝用品' },
  { id: 6, name: '宠物', icon: '🐶', subtitle: '爱宠好物' }
];

const HOME_METRICS = [
  { label: '邻里热拼', value: '24h上新', accent: '暖心推荐' },
  { label: '拼成更省', value: '最高立减', accent: '省到看得见' },
  { label: '自提安心', value: '团长核销', accent: '到点即取' }
];

const QUICK_ENTRIES = [
  { key: 'fresh', title: '今日鲜选', desc: '新鲜蔬果肉蛋', tag: '热卖' },
  { key: 'pickup', title: '附近自提点', desc: '下楼就能拿', tag: '便捷' },
  { key: 'publish', title: '发起求购', desc: '邻居一起拼', tag: '快速' }
];

const PUBLISH_NOTICES = [
  '发布前请确认商品名称、规格和图片真实清晰。',
  '建议优先选择常见需求商品，提升成团效率。',
  '拼单成功后请按时到自提点取货，避免团长二次联系。',
  '如临时取消，请及时和参与成员沟通说明。'
];

const SORT_OPTIONS = [
  { value: 'default', label: '最新发布' },
  { value: 'hot', label: '热度优先' },
  { value: 'time', label: '即将结束' },
  { value: 'price', label: '价格低到高' }
];

module.exports = {
  COMMUNITY_OPTIONS,
  CATEGORY_OPTIONS,
  HOME_METRICS,
  QUICK_ENTRIES,
  PUBLISH_NOTICES,
  SORT_OPTIONS
};
