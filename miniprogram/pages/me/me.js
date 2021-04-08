// pages/me/me.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        featureItemData: ["流水账", "使用方法", "关于我们"]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.setData({
            userData: wx.getStorageSync('userData')
        })
    },

    changePage: function(e) {
        var pagename = e.currentTarget.dataset.pagename
        if (pagename === '流水账') {
            wx.navigateTo({
                url: './record/record'
            })
        } else if (pagename === '关于我们') {
            wx.navigateTo({
                url: './aboutus/aboutus'
            })
        } else if (pagename === '使用方法') {
            wx.navigateTo({
                url: './instruction/instruction',
            })
        }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        this.setData({
            userData: wx.getStorageSync('userData')
        })
    },
    
    getExp() {
        var needExp = getApp().globalData.levelExp;
        needExp = needExp[this.data.userData.level + 1]
        this.setData({
            showModal: true,
            needExp: needExp
        })
    },
    close_mask: function () {
        this.setData({
            showModal: false
        })
    },

})