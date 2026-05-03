Component({
  properties: {
    groupBuy: {
      type: Object,
      value: {}
    },
    type: {
      type: String,
      value: 'default'
    }
  },

  data: {
    countdownStr: '',
    progress: 0,
    currentPrice: 0
  },

  lifetimes: {
    attached: function() {
      this.updateData();
    }
  },

  observers: {
    'groupBuy': function() {
      this.updateData();
    }
  },

  methods: {
    updateData: function() {
      const { groupBuy } = this.data;
      if (!groupBuy || !groupBuy.deadline) return;

      const now = Date.now();
      const end = new Date(groupBuy.deadline).getTime();
      const diff = end - now;

      let countdownStr = '已结束';
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          countdownStr = `${days}天${hours}时${minutes}分`;
        } else if (hours > 0) {
          countdownStr = `${hours}时${minutes}分${seconds}秒`;
        } else {
          countdownStr = `${minutes}分${seconds}秒`;
        }
      }

      const progress = groupBuy.targetCount > 0
        ? Math.min(100, Math.round((groupBuy.currentCount / groupBuy.targetCount) * 100))
        : 0;

      let currentPrice = groupBuy.targetPrice;
      if (groupBuy.tieredPrices && groupBuy.tieredPrices.length > 0) {
        for (const tier of groupBuy.tieredPrices) {
          if (groupBuy.currentCount >= tier.min) {
            currentPrice = tier.price;
          }
        }
      }

      this.setData({ countdownStr, progress, currentPrice });
    },

    onTap: function() {
      this.triggerEvent('tap', { groupBuy: this.data.groupBuy });
    }
  }
});