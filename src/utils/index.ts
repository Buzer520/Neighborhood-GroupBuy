export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

export function formatCountdown(date: Date | string): string {
  const target = new Date(date).getTime()
  const now = Date.now()
  const diff = target - now
  
  if (diff <= 0) return '已结束'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟`
  }
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${seconds}秒`
  }
  return `${minutes}分钟${seconds}秒`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let lastTime = 0
  return ((...args: any[]) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn(...args)
    }
  }) as T
}