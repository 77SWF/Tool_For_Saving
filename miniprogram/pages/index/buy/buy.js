const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        navigation: [
            {typeid: 0, title: '日用品'},
            {typeid: 1, title: '衣物饰品'},
            {typeid: 2, title: '学习用品'}
        ],
        currentbar: 0,
        reward: [2, 4, 6, 8],
        taskData: [],
        checkedShow: true,
        animationData: {},
        today: '',
        taskcountDis: false,     // 次数input禁用控制变量
        datepickerDis: false,    // 日期选择器禁用控制器
        delBtnWidth: 140,
        delBtnHeight: 20,

        //userData: {
        //    level: 0,
        //    exp: 0
        //},

        //添加任务时显示内容
        addTaskData: {
            taskname: '',
            taskcount: '',
            indexType: 0,
            type: ['请选择物品类型', '日用品', '衣物饰品', '学习用品'],
            indexDiff: '',//添加任务时输入的花费金额
            difficulty: ['请选择任务难度', '简单', '普通', '中等', '困难'],//选择条，删了
            due: '',
            checkcount: 0,
            lastwork: null,

            status: {
                finished: false,
                expired: false,
                today: false,
            }
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.setData({
            today: (new Date()).Format('yyyy-MM-dd'),
            userData: wx.getStorageSync('userData'),
            taskData: wx.getStorageSync('taskData')
        })
        //console.log(typeof this.data.userData.level)
        this.getExp()
        wx.createSelectorQuery().select('.wrap').boundingClientRect(rect => {
            if (rect) {
                this.setData({
                    delBtnHeight: rect.height
                })
            }
        }).exec()
    },
    onShow: function() {
        const animation = wx.createAnimation({
            duration: 1000,
            timingFunction: 'ease',
        })

        this.animation = animation
    },
    // 数据监听器
    watch: {
        currentbar: function(newVal) {
            switch (newVal) {
                case 0:
                    this.setData({
                        reward: [2, 4, 6, 8]
                    })
                    break // 日用品
                case 1:
                    this.setData({
                        reward: [2, 4, 6, 8]
                    })
                    break // 衣物饰品
                case 2:
                    this.setData({
                        reward: [1, 3, 5, 7]
                    })
                    break // 其他
            }
        }
    },
    // 计算属性
    computed: {
        expiredNum: {
            require: ['taskData', 'currentbar'],
            fn({taskData, currentbar}) {
                var result = 0
                if (!taskData) {
                    return 0
                }
                taskData.forEach(item => {
                    if (item.typeid === currentbar && item.status.expired) {
                        result++
                    }
                })
                return result
            }
        },
        checkedNum: {
            require: ['taskData', 'currentbar'],
            fn({taskData, currentbar}) {
                var result = 0
                if (!taskData) {
                    return 0
                }
                taskData.forEach(item => {
                    if (item.typeid === currentbar && item.status.finished) {
                        result++
                    }
                })
                return result
            }
        }
    },
    checkedShowChange: function() {
        this.setData({
            checkedShow: !this.data.checkedShow
        })
    },
    // 切换tab事件
    changeTab: function(e) {
        var typeid = e.currentTarget.dataset.typeid
        this.setData({
            currentbar: typeid
        })
        wx.createSelectorQuery().select('.wrap').boundingClientRect(rect => {
            if (rect) {
                this.setData({
                    delBtnHeight: rect.height
                })
            }
        }).exec()
    },
    // 复选框选中事件
    checkboxChange: function(e) {
        var taskindex = e.currentTarget.dataset.taskindex
        var user = this.data.userData
        var task = this.data.taskData
        var item = task[taskindex]
    
        // 处理任务次数逻辑
        item.checkcount++
        item.status.today = true
        item.status.checked = true
        if (item.checkcount === item.count && item.count !== 0) {
            item.status.finished = true
        }
        task[taskindex] = item
    
        // 处理任务奖励逻辑
        var money = 0
        money = item.score
        //console.log(money)
        user.money += money

        // 增加经验
        user.exp += money;
        this.getExp()
        
        // 处理'已完成'列表数量
        var checkedNum = this.data.checkedNum
        if (item.status.finished) {
            checkedNum++
        }

        // 如果已过期的任务完成后，'已过期'的数量需要修改
        var expiredNum = this.data.expiredNum
        if (item.status.expired && item.status.finished) {
            item.status.expired = false
            expiredNum--
        }
    
        // 修改数据，渲染列表
        this.setData({
            userData: user, 
            taskData: task,
            checkedNum: checkedNum,
            expiredNum: expiredNum
        })
    
        // 如果日常未完成则取消复选框勾选
        if (item.checkcount <= item.count || item.count === 0) {
            setTimeout(() => {
                item.status.checked = false
                task[taskindex] = item
                this.setData({
                taskData: task
                })
                // 修改对应Storage
                wx.setStorageSync('taskData', this.data.taskData)
                wx.setStorageSync('userData', this.data.userData)
            }, 700);
        }

        // 添加收入记录
        var option = {
            optid: 0,
            type: 0,
            key: item._id,
            title: item.title,
            time: new Date().Format('yyyy-MM-dd hh:mm:ss'),
            money: item.score
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
    },

    //点击+添加任务
    clickButton() {
        var data = {
            taskname: '',
            taskcount: '',
            indexType: 0,
            type: ['请选择物品类型', '日用品', '衣物饰品', '学习用品'],
            indexDiff: '',
            difficulty: ['请选择任务难度', '简单', '普通', '中等', '困难'],
            due: new Date().Format('yyyy-MM-dd'),
            checkcount: 0,
            lastwork: null,

            status: {
                finished: false,
                expired: false,
                today: false,
            }
        }

        this.setData({
            addTaskData: data,
            showModal: true,//显示弹框
        })
    },

    close_mask: function() {
        this.setData({
            showModal: false
        })
    },

    getTaskName(e) {
        var val = e.detail.value
        this.setData({
            'addTaskData.taskname': val
        })

    },

    getTaskCount(e) {
        var val = e.detail.value
        //console.log(typeof val)
        this.setData({
            'addTaskData.taskcount': val
        })
    },

    bindPickerChangeType(e) {
        var str = 'addTaskData.indexType'
        // 如果是日常任务，开启taskcount输入框，禁用时间选择器
        if (Number(e.detail.value) === 1) {
            this.setData({
                "addTaskData.taskcount": '',
                "addTaskData.due": '无',
                taskcountDis: false,
                datepickerDis: true,
            })
        }
        // 不是日常任务，禁用taskcount输入框，开启时间选择器，默认设count为1
        else if (Number(e.detail.value) === 2 || Number(e.detail.value) === 3) {
            this.setData({
                "addTaskData.taskcount": '',
                "addTaskData.due": new Date().Format('yyyy-MM-dd'),
                taskcountDis: true,
                datepickerDis: false
            })
        }
        this.setData({
            [str]: e.detail.value
        })

    },

    bindPickerChangeDiff(e) {
        var val = e.detail.value
        this.setData({
          'addTaskData.indexDiff': val
        })
    },

    bindDateChange(e) {
        var str = 'addTaskData.due'
        this.setData({
            [str]: e.detail.value
        })
    },

    addTask() {
        var data = this.data.addTaskData//前面在选每一项时，通过如bindDateChange的函数把选定值绑定给了this.data.addTaskData的对应key
        // console.log(data)

        // 错误检测
        if (data.taskname.length == 0) {
            wx.showToast({
                title: '物品名',
                duration: 2000,
                mask: true,
                icon: 'none'
            })
            return
        } else if (data.indexType === 0) {
            wx.showToast({
                title: '请选择物品类型',
                duration: 2000,
                mask: true,
                icon: 'none'
            })
            return
        } else if (data.indexDiff === 0) {
            wx.showToast({
                title: '请选择任务难度',
                duration: 2000,
                mask: true,
                icon: 'none'
            })
            return
        }

        if (data.taskcount.length === 0) {
            // indexType为1才是‘日常任务’，并且data.indexType的类型是string
            if (Number(data.indexType) === 1) {
                data.taskcount = 0;
            } else if (Number(data.indexType) === 2 || Number(data.indexType) === 3) {
                data.taskcount = 0;
            }
        } else {
            data.taskcount = Number(data.taskcount);
            let re = /^[1-9]+[0-9]*]*$/
            if (!re.test(String(data.taskcount))) {
                wx.showToast({
                    title: '次数必须为正整数！',
                    duration: 2000,
                    mask: true,
                    icon: 'none'
                })
                return
            }
        }

        // 把日常任务的due字段置为null
        if (data.indexType == 1) {
            data.due = null
        }

        data.indexDiff =Number(data.indexDiff)
        var score = (data.indexDiff <= 10) ? 1 :
        (100 >= data.indexDiff && data.indexDiff > 10) ? 2 :
        (500 >= data.indexDiff && data.indexDiff > 100)? 4 :
        (1000 >= data.indexDiff && data.indexDiff > 500)? 6 : 8;

        //console.log(typeof data.indexDiff)

        // 构造新任务对象，内容为选定的每项的值(有的会变，比如typeid)
        var newtask = {
          title: data.taskname,
          typeid: data.indexType - 1,
          difficulty: data.indexDiff,//花费金额
          score: score,
          due: data.due,
          count: data.taskcount,
          checkcount: 0,

          lastwork: null,
          status: {
              finished: false,
              expired: false,
              today: false,
          }
        }

        const db = wx.cloud.database()
        db.collection('taskData').add({//任务加入数据库
            data: newtask,
            success: res => {
                this.setData({
                    taskData: this.data.taskData,
                    showModal: false
                })

                // 在返回结果中会包含新创建的记录的 _id
                console.log('[数据库] [新增记录] 添加任务 _id: ', res._id)
                wx.showToast({
                    title: '新增任务成功',
                })

                // 新任务对象添加time字段
                if (newtask.due) {
                    var ddl = new Date(newtask.due)
                    newtask.timestr = `${ddl.getMonth() + 1}月${ddl.getDate()}日`
                }
                
                // 新任务对象加上_id字段
                newtask._id = res._id
                var taskData = this.data.taskData//获取data里的taskData
                taskData.push(newtask)//对他增加值，后面还要setData才可更新成功

                // 渲染视图层
                this.setData({
                  taskData: taskData,
                  showModal: false
                })
                wx.setStorageSync('taskData', this.data.taskData)

                // 添加完任务后重新获取一次del按钮高度
                wx.createSelectorQuery().select('.wrap').boundingClientRect(rect => {
                    if (rect) {
                        this.setData({
                            delBtnHeight: rect.height
                        })
                    }
                }).exec()
            },
            fail: err => {
                wx.showToast({
                    icon: 'none',
                    title: '新增任务失败'
                })
                console.error('[数据库] [新增记录] 添加任务失败：', err)
                return
            }
        })
    }, 
    getExp() {//获取分数/级数
        var level = this.data.userData.level
        //console.log(typeof this.data.userData.level) //提示undefined 
        //所以会报错TypeError: Cannot create property 'level' on string ''
        var myexp = this.data.userData.exp //现在的分数
        var exp = app.globalData.levelExp[level + 1]//升1级后的分数

        if (myexp > exp) {//现在的分数>升1级后的分数
            myexp -= exp;//分数扣掉
            level++;//下标后移1位
        }

        //更新级数
        this.data.userData.level = level //当前级数下标更新
        this.data.userData.exp = myexp //当前分数更新(扣掉用来升级的分数后，剩下的分数)

        this.setData({
            percent: ((myexp / exp) * 100),
            'userData.level': level,
            'userData.exp': myexp,
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
            var taskStyle = ""
            // 如果移动距离小于等于0，文本层位置不变
            if (disX <= 0) {
                taskStyle = "left: 0rpx"
            } 
            // 移动距离大于0，文本层left值等于手指移动距离
            else if (disX > 0) {
                taskStyle = "left: -" + disX + "rpx"

                if (disX >= delBtnWidth) {
                    // 控制手指移动距离最大值为删除按钮的宽度
                    taskStyle = "left: -" + delBtnWidth + "rpx"
                }
            }
            // 获取手指触摸的是哪一项
            var id = e.currentTarget.dataset.id
            var taskData = this.data.taskData
            taskData.forEach(item => {
                if (item._id === id) {
                    item.taskStyle = taskStyle
                }
                else {
                    item.taskStyle = ''
                }
            })
            //更新列表的状态
            this.setData({
                taskData: taskData
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
            var taskStyle = disX > delBtnWidth / 2 ? "left: -" + delBtnWidth + "rpx" : "left: 0rpx"
            //获取手指触摸的是哪一项
            var id = e.currentTarget.dataset.id
            var taskData = this.data.taskData
            taskData.forEach(item => {
                if (item._id === id) {
                    item.taskStyle = taskStyle
                }
                else {
                    item.taskStyle = ''
                }
            })
            //更新列表的状态
            this.setData({
                taskData: taskData
            })
        }
    },
    deleteTask(e) {

        var id = e.currentTarget.dataset.id
        var self = this
        var taskArray = this.data.taskData

        let index
        for (let i = 0; i < taskArray.length; i++) {
            if (taskArray[i]._id === id) {
                index = i
                break
            }
        }
        let item = self.data.taskData[index]

        const db = wx.cloud.database()

        wx.showModal({
            title: '提示',
            content: '确定要删除该任务吗？',
            success: function(res) {
                if (res.confirm) {
                    taskArray.splice(index, 1);
                    // 删除数据库对应的任务
                    db.collection('taskData').doc(item._id).remove({
                    success: res => {
                        console.log('[数据库] [删除记录] 删除任务 _id: ' + item._id)
                    },
                    fail: err => {
                        console.error('[数据库] [删除记录] 删除任务失败', err)
                    }
                  })
                } else if (res.cancel) {
                    return false;
                }
                self.setData({
                    taskData: self.data.taskData
                })
                wx.setStorageSync('taskData', self.data.taskData)
            }
        })
    }, 
})