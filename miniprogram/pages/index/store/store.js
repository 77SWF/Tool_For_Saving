const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        price: [2, 4, 9, 16],

        taskname: '',
        taskcount: '',
        desireData: [],

        difficulty: ['请选择难度', '简单', '普通', '中等', '困难'],
        index: 0,
        delBtnWidth: 120,
        delBtnHeight: 20
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.setData({
            desireData: wx.getStorageSync('desireData'),
            userData: wx.getStorageSync('userData')
        })
        this.getExp()
        wx.createSelectorQuery().select('.wrap').boundingClientRect(rect => {
            if (rect) {
                this.setData({
                    delBtnHeight: rect.height
                })
            }
        }).exec()
    },

    buyDesire: function(e) {
        var id = e.currentTarget.dataset.id
        var self = this
        var user = this.data.userData
        var desireArray = this.data.desireData

        let index = self.findItem(desireArray, id)
        let item = self.data.desireData[index]
        let price = this.data.price[item.grade]

        wx.showModal({
            title: '确认',
            content: '确定使用￥' + price + ' 购买 \"' + item.title + '\" 这个欲望吗？',

            success(res) {
                if (res.confirm) {
                    if (user.money >= price) {

                        item.get++;
                        if (item.get >= item.allGet && item.allGet != -1) {
                            if (index > -1)
                                desireArray.splice(index, 1);
                        }

                        user.money -= price

                        self.setData({
                            desireData: desireArray,
                            userData: user
                        })
                        // 修改对应的storage
                        wx.setStorageSync('desireData', self.data.desireData)
                        wx.setStorageSync('userData', self.data.userData)

                        // 添加支出记录
                        var option = {
                            optid: 0,
                            type: 1,
                            key: item._id,
                            title: item.title,
                            time: new Date().Format('yyyy-MM-dd hh:mm:ss'),
                            money: self.data.price[item.grade]
                        }
                        var recordData = wx.getStorageSync('recordData')
                        if (recordData) {
                            option.optid = recordData.length
                            recordData.push(option)
                        }
                        else {
                            recordData = []
                            recordData.push(option)
                        }
                        wx.setStorageSync('recordData', recordData)
                    } else {
                        wx.showToast({
                            title: '￥余额不足，要继续努力才可以哦！',
                            icon: 'none',
                            duration: 1500,
                            mask: true
                        })
                    }
                }
            }
        })
    },

    clickButton() {
        var self = this
        var user = this.data.userData
        var desireArray = this.data.desireData

        wx.showActionSheet({
            itemList: ['添加', '排序'],
            success(res) {
                /* 初始化要添加的商品信息 */
                if (res.tapIndex == 0) {
                    self.setData({
                        showModal: true,
                        index: 0,
                        taskname: '',
                        taskcount: '',
                    })
                }

                if (res.tapIndex == 1) {
                    desireArray.sort(function(a, b) {
                        if (a.grade < b.grade) {
                            return -1;
                        } else {
                            return 1;
                        }
                    })

                    self.setData({
                        desireData: desireArray,
                    })
                }
            }
        })
    },

    close_mask: function() {
        this.setData({
            showModal: false
        })
    },

    bindPickerChange: function(e) {
        this.setData({
            index: e.detail.value
        })
    },

    addDesire() {
        var self = this
        let taskname = self.data.taskname;
        let taskcount = self.data.taskcount;
        let grade = self.data.index - 1;

        if (taskname.length == 0) {
            wx.showToast({
                title: '请输入商品名',
                duration: 2000,
                mask: true,
                icon: 'none'
            })
            return
        } else if (grade === -1) {
            wx.showToast({
                title: '请选择难度',
                duration: 2000,
                mask: true,
                icon: 'none'
            })
            return
        }

        if (taskcount.length == 0) {
            taskcount = -1;
        } else {
            taskcount = Number(taskcount);
            let re = /^[1-9]+[0-9]*]*$/
            if (!re.test(String(taskcount))) {
                wx.showToast({
                    title: '次数必须为正整数！',
                    duration: 2000,
                    mask: true,
                    icon: 'none'
                })
                return
            }
        }

        var newdata = {
            //desireid: id + 1,
            title: taskname,
            grade: grade,
            get: 0,
            allGet: taskcount
        }

        // 添加到数据库
        const db = wx.cloud.database()
        db.collection('desireData').add({
            data: newdata,
            success: res => {
                console.log('[数据库] [插入记录] 添加欲望 _id: ' + res._id)

                // 添加_id字段
                newdata._id = res._id

                var desireData = self.data.desireData
                desireData.push(newdata)

                self.setData({
                    desireData: desireData,
                    showModal: false
                })
                wx.setStorageSync('desireData', self.data.desireData)

                wx.showToast({
                    title: '添加成功',
                    duration: 2000,
                    mask: true,
                    icon: 'success'
                })

                wx.createSelectorQuery().select('.wrap').boundingClientRect(rect => {
                    if (rect) {
                        this.setData({
                            delBtnHeight: rect.height
                        })
                    }
                }).exec()
            },
            fail: err => {
                console.err('[数据库] [插入记录] 添加欲望失败', err)
            }
        })
    },

    getTaskName(e) {
        var val = e.detail.value
        this.setData({
            taskname: val
        })
    },

    getTaskCount(e) {
        var val = e.detail.value
        this.setData({
            taskcount: val
        })
    },

    findItem(array, id) {
        for (let i = 0; i < array.length; i++) {
            if (array[i]._id === id)
                return i;
        }
        return -1;
    },

    deleteDesire(e) {
        var id = e.currentTarget.dataset.id
        var self = this
        var desireArray = this.data.desireData

        let index = self.findItem(desireArray, id)
        let item = self.data.desireData[index]

        const db = wx.cloud.database()

        wx.showModal({
            title: '提示',
            content: '确定要删除欲望吗？',
            success: function(res) {
                if (res.confirm) {
                    desireArray.splice(index, 1);
                    // 删除数据库对应的任务
                    db.collection('desireData').doc(item._id).remove({
                    success: res => {
                        console.log('[数据库] [删除记录] 删除欲望 _id: ' + item._id)
                    },
                    fail: err => {
                        console.error('[数据库] [删除记录] 删除欲望失败', err)
                    }
                  })
                } else if (res.cancel) {
                    return false;
                }
                self.setData({
                    desireData: self.data.desireData
                })
                wx.setStorageSync('desireData', self.data.desireData)
            }
        })
    }, 
    getExp() {
        var level = this.data.userData.level
        var myexp = this.data.userData.exp
        var exp = app.globalData.levelExp[level + 1]
        this.setData({
            percent: ((myexp / exp) * 100)
        })
    },
    touchS: function (e) {
        if (e.touches.length === 1) {
            this.setData({
                // 设置触摸起始点水平方向位置
                startX: e.touches[0].clientX
            })
        }
    },
    touchM: function (e) {
        if (e.touches.length === 1) {
            // 手指移动时水平方向位置
            var moveX = e.touches[0].clientX
            // 手指起始点位置与移动期间的差值
            var disX = this.data.startX - moveX
            var delBtnWidth = this.data.delBtnWidth
            var desireStyle = ""
            // 如果移动距离小于等于0，文本层位置不变
            if (disX <= 0) {
                desireStyle = "left: 0rpx"
            } 
            // 移动距离大于0，文本层left值等于手指移动距离
            else if (disX > 0) {
                desireStyle = "left: -" + disX + "rpx"

                if (disX >= delBtnWidth) {
                    // 控制手指移动距离最大值为删除按钮的宽度
                    desireStyle = "left: -" + delBtnWidth + "rpx"
                }
            }
            // 获取手指触摸的是哪一项
            var id = e.currentTarget.dataset.id
            var desireData = this.data.desireData
            desireData.forEach(item => {
                if (item._id === id) {
                    item.desireStyle = desireStyle
                }
                else {
                    item.desireStyle = ''
                }
            })
            //更新列表的状态
            this.setData({
                desireData: desireData
            })
        }
    },

    touchE: function (e) {
        if (e.changedTouches.length === 1) {
            //手指移动结束后水平位置
            var endX = e.changedTouches[0].clientX
            //触摸开始与结束，手指移动的距离
            var disX = this.data.startX - endX
            var delBtnWidth = this.data.delBtnWidth
            //如果距离小于删除按钮的1/2，不显示删除按钮
            var desireStyle = disX > delBtnWidth / 2 ? "left: -" + delBtnWidth + "rpx" : "left: 0rpx"
            //获取手指触摸的是哪一项
            var id = e.currentTarget.dataset.id
            var desireData = this.data.desireData
            desireData.forEach(item => {
                if (item._id === id) {
                    item.desireStyle = desireStyle
                }
                else {
                    item.desireStyle = ''
                }
            })
            //更新列表的状态
            this.setData({
                desireData: desireData
            })
        }
    },
})