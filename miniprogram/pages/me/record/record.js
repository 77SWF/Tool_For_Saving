// pages/me/record/record.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    recordTypeArr: ['全部流水账类型', '收入', '支出'],
    recordTypeIndex: 0,
    incomeFlag: true,
    payFlag: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var recordData = wx.getStorageSync('recordData')
    recordData.forEach( item => {
      // 处理IOS转换Date数据格式不兼容问题，IOS仅支持yyyy/MM/dd格式
      let olddata = item.time
      let mydata = new Date(olddata)
      let newdata = mydata.getTime()
      let olddata2 = olddata.replace(/-/g, '/')
      item.timeformat = new Date(olddata2).Format('MM-dd hh:mm')
    })
    recordData.reverse()
    this.setData({
      recordData: recordData
    })
  },

  bindTypePickerChange: function (e) {
    var incomeFlag
    var payFlag
    if (e.detail.value == 0) {
      incomeFlag = true
      payFlag = true
    }
    else if (e.detail.value == 1) {
      incomeFlag = true
      payFlag = false
    }
    else if (e.detail.value == 2) {
      incomeFlag = false
      payFlag = true
    }
    this.setData({
      recordTypeIndex: e.detail.value,
      incomeFlag: incomeFlag,
      payFlag: payFlag
    })
  }

})