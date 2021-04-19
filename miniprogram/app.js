const { patchPage, patchComponent } = require('./pages/util/miniprogrampatch.js')

// 对Date的扩展，将 Date 转化为指定格式的String 
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function(fmt) 
{ //author: meizz 
  var o = { 
    "M+" : this.getMonth()+1,                 //月份 
    "d+" : this.getDate(),                    //日 
    "h+" : this.getHours(),                   //小时 
    "m+" : this.getMinutes(),                 //分 
    "s+" : this.getSeconds(),                 //秒 
    "q+" : Math.floor((this.getMonth()+3)/3), //季度 
    "S"  : this.getMilliseconds()             //毫秒 
  }; 
  if(/(y+)/.test(fmt)) 
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
  for(var k in o) 
    if(new RegExp("("+ k +")").test(fmt)) 
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length))); 
  return fmt; 
}

Page = patchPage(Page)
Component = patchComponent(Component)

App({
  globalData: {
    levelExp: [0, 10, 30, 50, 80, 100]//升级index级需要的经验数
  },
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-7gifxcr72cc2cec2',
        //我刚刚从云开发控制台里复制过来的自己的环境ID，
        traceUser: true,
      })
    }
    this.globalData = {
        levelExp: [0, 10, 30, 50, 80, 100]
    }
    // 获取用户openid
    this.onGetOpenid()
  },
  onGetOpenid: function () {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        this.globalData.openid = res.result.openid
        // 从云端获取用户信息，若没有则创建新用户
        this.onGetUserInfo()
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    })
  },
  onGetUserInfo: function () {
    const db = wx.cloud.database()
    db.collection('userData').where({
      _openid: this.globalData.openid
    }).get({
      success: res => {
        if (res.data.length) {
          console.log('[数据库] [查询记录] 用户数据查询成功')
          wx.setStorageSync('userData', res.data[0])
          if (this.getUserDataCallback) {
            this.getUserDataCallback()
          }
          this.onQuery('taskData')
          this.onQuery('recordData')
        }
        else {
          console.log('[数据库] [查询记录] 成功 云端没有该用户信息，建立新用户')
          wx.navigateTo({
            url: '../login/login',
          })
        }
      }
    })
  },
  onQuery: function (table) {
    const db = wx.cloud.database()
    // 查询当前用户的所有任务
    db.collection(table).where({
      _openid: this.globalData.openid
    }).get({
      success: res => {
        // 对taskData进行处理
        if (table === 'taskData') {
          var taskData = res.data
          taskData.forEach(item => {
            // 如果任务存在DDL，则判断是否过期
            if (item.due) {
              var ddl = new Date(item.due)
              var current = new Date(new Date().Format('yyyy-MM-dd'))
              if (!item.status.finished && ddl.getTime() - current.getTime() < 0) {
                item.status.expired = true
                item.expiredstr = `${ddl.getMonth() + 1}月${ddl.getDate()}日`
              }
              item.timestr = `${ddl.getMonth() + 1}月${ddl.getDate()}日`
            }
          })
        }
        if (table === 'taskData') {
          wx.setStorageSync('taskData', taskData)
        }
        else {
          wx.setStorageSync(table, res.data)
        }
      },
      fail: err => {
        console.error('[数据库] [查新记录] 失败', err)
      }
    })
  },
  // 小程序被切到后台，提交数据到云端
  onHide: function () {
    const db = wx.cloud.database()
    // 更新userData
    var userData = wx.getStorageSync('userData')
    db.collection('userData').doc(userData._id).update({
      data: {
          exp: userData.exp,
          level: userData.level,
        money: userData.money
      },
      success: res => {
        console.log('[数据库] [更新记录] 成功 ' + res)
      },
      fail: err => {
        console.error('[数据库] [更新记录] 失败 ', err)
      }
    })

    // 更新taskData
    var taskData = wx.getStorageSync('taskData')
    taskData.forEach(item => {
      if (item.today) {
        task.lastwork = new Date().Format('yyyy-MM-dd')
      }
      db.collection('taskData').doc(item._id).update({
        data: {
          checkcount: item.checkcount,
          status: item.status
        },
        success: res => {
          console.log('[数据库] [更新记录] 成功 ' + res)
        },
        fail: err => {
          console.error('[数据库] [更新记录] 失败 ', err)
        }
      })
    })

  
    // 上传recordData
    var recordData = wx.getStorageSync('recordData')
    recordData.forEach(item => {
      db.collection('recordData').where({
        _openid: this.globalData.openid,
        optid: item.optid
      }).get({
        success: res => {
          // 0表明找不到这条操作记录
          if (res.data.length === 0) {
            db.collection('recordData').add({
              data: item,
              success: res => {
                console.log('[数据库] [插入记录] 添加操作记录成功')
              },
              fail: err => {
                console.error('[数据库] [插入记录] 添加操作记录失败', err)
              }
            })
          }
        }
      })
    })
  }
})