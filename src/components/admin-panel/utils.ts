export const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const formatDateShort = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

export const getTimeAgo = (dateStr: string): string => {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffSeconds < 60) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return formatDateShort(dateStr)
}

export const numberToVietnameseWords = (num: number): string => {
  if (num === 0) return 'không đồng'
  const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
  const tiers = ['', 'ngàn', 'triệu', 'tỷ']
  let result = ''
  let tierIndex = 0
  let n = Math.floor(num)
  while (n > 0) {
    const chunk = n % 1000
    n = Math.floor(n / 1000)
    if (chunk > 0) {
      let chunkText = ''
      const hundreds = Math.floor(chunk / 100)
      const remainder = chunk % 100
      if (hundreds > 0) chunkText += units[hundreds] + ' trăm'
      if (remainder > 0) {
        if (hundreds > 0 && remainder < 10) chunkText += ' lẻ'
        const tens = Math.floor(remainder / 10)
        const ones = remainder % 10
        if (tens > 1) {
          chunkText += ' ' + units[tens] + ' mươi'
          if (ones === 1) chunkText += ' mốt'
          else if (ones === 5) chunkText += ' lăm'
          else if (ones > 0) chunkText += ' ' + units[ones]
        } else if (tens === 1) {
          chunkText += ' mười'
          if (ones === 5) chunkText += ' lăm'
          else if (ones > 0) chunkText += ' ' + units[ones]
        } else {
          chunkText += ' ' + units[ones]
        }
      }
      result = chunkText.trim() + ' ' + tiers[tierIndex] + (result ? ' ' + result : '')
    }
    tierIndex++
  }
  return result.trim() + ' đồng'
}
