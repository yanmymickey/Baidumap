const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

module.exports = {
  formatTime: formatTime
}
export const MSG = {
  show: function (text) {
    wx.showLoading({
      title: text || "加载中",
      mask: true
    });
  },
  hide: function () {
    wx.hideLoading()
  },
  toast: function (text, time) {
    console.log(text, time);
    wx.showToast({
      title: typeof text === 'object' ? JSON.stringify(text) : text,
      icon: 'none',
      duration: time || 3000
    })
  },
  toastIcon: function (text, iconName) {
    wx.showToast({
      title: text,
      icon: iconName || 'success',
      duration: 2000
    })
  }
};