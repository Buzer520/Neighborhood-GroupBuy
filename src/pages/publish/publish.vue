<template>
  <view class="page-container">
    <view class="form-section">
      <view class="section-title">
        <text class="title-icon">📷</text>
        <text>商品图片</text>
      </view>
      <view class="image-upload">
        <view class="upload-item" v-for="(img, index) in images" :key="index">
          <image :src="img" mode="aspectFill" class="upload-img" />
          <view class="remove-btn" @click="removeImage(index)">✕</view>
        </view>
        <view class="upload-btn" v-if="images.length < 9" @click="chooseImage">
          <text class="upload-icon">+</text>
          <text class="upload-text">上传图片</text>
        </view>
      </view>
    </view>

    <view class="form-section">
      <view class="section-title">
        <text class="title-icon">📝</text>
        <text>商品信息</text>
      </view>
      
      <view class="form-item">
        <text class="form-label">商品名称</text>
        <input 
          class="form-input" 
          v-model="formData.productName" 
          placeholder="请输入商品名称"
          maxlength="50"
        />
      </view>

      <view class="form-item">
        <text class="form-label">商品规格</text>
        <input 
          class="form-input" 
          v-model="formData.spec" 
          placeholder="请输入商品规格（可选）"
          maxlength="30"
        />
      </view>

      <view class="form-item">
        <text class="form-label">目标价格</text>
        <view class="price-input-wrap">
          <text class="price-symbol">¥</text>
          <input 
            class="price-input" 
            v-model="formData.targetPrice" 
            placeholder="0.00"
            type="digit"
          />
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">拼单人数</text>
        <view class="count-input-wrap">
          <view class="count-btn" @click="decreaseCount">-</view>
          <input 
            class="count-input" 
            v-model="formData.targetCount" 
            type="number"
          />
          <view class="count-btn" @click="increaseCount">+</view>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">阶梯价格</text>
        <view class="tiered-section">
          <view class="tiered-item" v-for="(tier, index) in formData.tieredPrices" :key="index">
            <view class="tier-input-wrap">
              <input 
                class="tier-count" 
                v-model="tier.count" 
                placeholder="人数"
                type="number"
              />
              <text class="tier-separator">人</text>
              <text class="tier-symbol">¥</text>
              <input 
                class="tier-price" 
                v-model="tier.price" 
                placeholder="价格"
                type="digit"
              />
            </view>
            <view class="tier-remove" v-if="formData.tieredPrices.length > 1" @click="removeTier(index)">✕</view>
          </view>
          <view class="add-tier-btn" @click="addTier">
            <text>+ 添加阶梯</text>
          </view>
        </view>
      </view>
    </view>

    <view class="form-section">
      <view class="section-title">
        <text class="title-icon">📍</text>
        <text>配送信息</text>
      </view>

      <view class="form-item">
        <text class="form-label">自提地点</text>
        <input 
          class="form-input" 
          v-model="formData.pickupPoint" 
          placeholder="请输入自提地点"
          maxlength="50"
        />
      </view>

      <view class="form-item">
        <text class="form-label">截止时间</text>
        <picker mode="date" :value="formData.deadline" @change="onDateChange">
          <view class="picker-value">
            <text>{{ formData.deadline || '请选择截止日期' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="form-section">
      <view class="section-title">
        <text class="title-icon">💬</text>
        <text>备注说明</text>
      </view>
      <textarea 
        class="form-textarea" 
        v-model="formData.remark" 
        placeholder="请输入商品说明或注意事项（可选）"
        maxlength="200"
      />
    </view>
  </view>

  <view class="bottom-bar">
    <view class="btn-submit" @click="submitForm">
      <text>发布拼单</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const images = ref<string[]>([])
const formData = reactive({
  productName: '',
  spec: '',
  targetPrice: '',
  targetCount: '10',
  tieredPrices: [{ count: '', price: '' }],
  pickupPoint: '',
  deadline: '',
  remark: ''
})

function chooseImage() {
  uni.chooseImage({
    count: 9 - images.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      images.value = [...images.value, ...res.tempFilePaths]
    }
  })
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

function increaseCount() {
  let count = parseInt(formData.targetCount) || 0
  if (count < 100) {
    formData.targetCount = String(count + 1)
  }
}

function decreaseCount() {
  let count = parseInt(formData.targetCount) || 0
  if (count > 2) {
    formData.targetCount = String(count - 1)
  }
}

function addTier() {
  if (formData.tieredPrices.length < 5) {
    formData.tieredPrices.push({ count: '', price: '' })
  }
}

function removeTier(index: number) {
  formData.tieredPrices.splice(index, 1)
}

function onDateChange(e: { detail: { value: string } }) {
  formData.deadline = e.detail.value
}

function submitForm() {
  if (!images.value.length) {
    uni.showToast({ title: '请上传商品图片', icon: 'none' })
    return
  }
  if (!formData.productName.trim()) {
    uni.showToast({ title: '请输入商品名称', icon: 'none' })
    return
  }
  if (!formData.targetPrice) {
    uni.showToast({ title: '请输入目标价格', icon: 'none' })
    return
  }
  if (!formData.pickupPoint.trim()) {
    uni.showToast({ title: '请输入自提地点', icon: 'none' })
    return
  }
  if (!formData.deadline) {
    uni.showToast({ title: '请选择截止时间', icon: 'none' })
    return
  }

  uni.showLoading({ title: '发布中...' })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }, 2000)
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 140rpx;
}

.form-section {
  background: #fff;
  margin: 24rpx;
  padding: 24rpx;
  border-radius: 16rpx;

  .section-title {
    display: flex;
    align-items: center;
    font-size: 30rpx;
    font-weight: 600;
    color: #2d3436;
    margin-bottom: 24rpx;
    padding-bottom: 16rpx;
    border-bottom: 2rpx solid #f1f3f5;

    .title-icon {
      margin-right: 12rpx;
      font-size: 32rpx;
    }
  }
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.upload-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;

  .upload-img {
    width: 100%;
    height: 100%;
    border-radius: 12rpx;
  }

  .remove-btn {
    position: absolute;
    top: -12rpx;
    right: -12rpx;
    width: 40rpx;
    height: 40rpx;
    background: #ff6b6b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24rpx;
  }
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #e9ecef;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .upload-icon {
    font-size: 48rpx;
    color: #b2bec3;
  }

  .upload-text {
    font-size: 24rpx;
    color: #b2bec3;
    margin-top: 8rpx;
  }
}

.form-item {
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 0;
  }

  .form-label {
    font-size: 26rpx;
    color: #636e72;
    margin-bottom: 12rpx;
    display: block;
  }

  .form-input {
    width: 100%;
    padding: 20rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #2d3436;
  }

  .price-input-wrap {
    display: flex;
    align-items: center;
    padding: 20rpx;
    background: #f8f9fa;
    border-radius: 12rpx;

    .price-symbol {
      font-size: 28rpx;
      color: #ff6b6b;
      font-weight: 600;
    }

    .price-input {
      flex: 1;
      font-size: 32rpx;
      color: #2d3436;
      font-weight: 600;
    }
  }

  .count-input-wrap {
    display: flex;
    align-items: center;
    justify-content: center;

    .count-btn {
      width: 72rpx;
      height: 72rpx;
      background: #f8f9fa;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
      color: #636e72;
    }

    .count-input {
      width: 120rpx;
      height: 72rpx;
      text-align: center;
      font-size: 32rpx;
      color: #2d3436;
      font-weight: 600;
      margin: 0 20rpx;
    }
  }
}

.tiered-section {
  .tiered-item {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;

    .tier-input-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 16rpx;
      background: #f8f9fa;
      border-radius: 12rpx;

      .tier-count {
        width: 80rpx;
        font-size: 26rpx;
        text-align: center;
        color: #2d3436;
      }

      .tier-separator {
        font-size: 24rpx;
        color: #636e72;
        margin: 0 8rpx;
      }

      .tier-symbol {
        font-size: 24rpx;
        color: #ff6b6b;
        margin-left: 16rpx;
      }

      .tier-price {
        flex: 1;
        font-size: 26rpx;
        color: #2d3436;
      }
    }

    .tier-remove {
      width: 48rpx;
      height: 48rpx;
      background: #ffe0e0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ff6b6b;
      font-size: 24rpx;
      margin-left: 16rpx;
    }
  }

  .add-tier-btn {
    padding: 16rpx;
    border: 2rpx dashed #e9ecef;
    border-radius: 12rpx;
    text-align: center;

    text {
      font-size: 26rpx;
      color: #636e72;
    }
  }
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;

  text {
    font-size: 28rpx;
    color: #2d3436;
  }

  .picker-arrow {
    font-size: 32rpx;
    color: #b2bec3;
  }
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #2d3436;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.btn-submit {
  padding: 28rpx;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  border-radius: 40rpx;
  text-align: center;

  text {
    font-size: 32rpx;
    color: #fff;
    font-weight: 600;
  }
}
</style>