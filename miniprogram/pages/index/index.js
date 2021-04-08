const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
      percent: 10
  },
  onLoad: function (options) {
    if (wx.getStorageSync('userData')) {
      this.setData({
        userData: wx.getStorageSync('userData')
      })
        this.getExp()
    }
    else {
      app.getUserDataCallback = () => {
        this.setData({
          userData: wx.getStorageSync('userData')
        })
        this.getExp()
      }
    }
    
  },
  onShow: function (options) {
    this.setData({
      userData: wx.getStorageSync('userData')
    })
    this.getExp()

  },
  goTask: function () {
    wx.navigateTo({
      url: 'task/task',
    })
  },
  goStore: function () {
    wx.navigateTo({
      url: 'store/store',
    })
  },
  getExp() {
      var level = this.data.userData.level
      var myexp = this.data.userData.exp
      var exp = app.globalData.levelExp[level + 1]
      this.setData({
          percent: ((myexp / exp) * 100)
      })
  }
})