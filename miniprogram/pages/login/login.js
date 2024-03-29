//数据库中没有的用户会执行以下注册
const initTaskData = require('../data/initTaskData.js')
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  bindGetUserInfo(e) {
    wx.getUserProfile({
      desc: '用于同步与完善个人资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        app.globalData.userInfo = res.userInfo
        const db = wx.cloud.database()
        db.collection('userData').add({
          data: {
            level: 0,//初始0级
            money: 0,
            exp: 0,//初始0分
            username: app.globalData.userInfo.nickName
          },
          success: res => {
            console.log('新用户创建成功，远程数据库新增用户......将用户信息存入本地Storage')
            db.collection('userData').where({
              _openid: app.globalData.openid
            }).get({
              success: res => {
                wx.setStorageSync('userData', res.data[0])
                // 初始化任务
                this.initTask()
                wx.showToast({
                  title: '登陆成功',
                  duration: 1500,
                  mask: true,
                  success: function () {
                    setTimeout(function () {
                      wx.navigateBack({
                        delta: 1
                      })
                    }, 1500);
                  }
                })
              },
              fail: err => {
                console.log('用户创建完毕，但重新获取云端用户信息失败' + err)
              }
            })
          },
          fail: err => {
            console.log('新用户创建失败')
          }
        })
      }
    })
    //app.globalData.userInfo = e.detail.userInfo
    //console.log(app.globalData.userInfo)
   
  },
  // 设置用户初始化指引任务和欲望空列表
  initTask: function () {
    const db = wx.cloud.database()
    var initTasks = initTaskData.initTaskData
    initTasks.forEach(item => {
      db.collection('taskData').add({
        data: item,
        success: res => {
          console.log('[数据库] [插入数据] 初始任务 _id: ' + res._id)
          item._id = res._id
        },
        fail: err => {
          console.error('[数据库] [插入数据] 初始任务失败', err)
        }
      })
    })
    wx.setStorageSync('taskData', initTasks)
    wx.setStorageSync('desireData', [])
  }
})