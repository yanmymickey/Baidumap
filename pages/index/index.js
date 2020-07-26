import bmap from '../../utils/bmap-wx';
import '../../utils/util'
let app = getApp();
let BMap = new bmap.BMapWX({
  ak: app.globalData.ak,
});
Page({
  data: {
    addListShow: false,
    addressName: '',
    currentRegion: {
      province: '选择城市',
      city: '选择城市',
      district: '选择城市',
    },
    isGet: false,
    latitude: '',
    longitude: '',
    centerData: {},
    nearList: [],
    selectedId: 0,
  },
  onLoad: function () {
    let that = this;
    let fail = function (data) {
      console.log(data)
    };
    let success = function (data) {
      // console.log(data);
      let wxMarkerData = data.wxMarkerData;
      that.setData({
        isGet: true,
        addressName: wxMarkerData[0].address,
        currentRegion: data.originalData.result.addressComponent,
        centerData: wxMarkerData,
        latitude: wxMarkerData[0].latitude,
        longitude: wxMarkerData[0].longitude
      });
    }
    that.mapCtx = wx.createMapContext('myMap')
    //微信API定位,获取当前位置经纬度
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        //console.log(res)
        BMap.regeocoding({
          location: res.latitude + ',' + res.longitude,
          fail: fail,
          success: success,
        });
      },
      fail(err) {
        //console.log(err)
        wx.hideLoading({});
        wx.showToast({
          title: '定位失败',
          icon: 'none',
          duration: 1500
        })
        setTimeout(function () {
          wx.navigateBack({
            delta: 1
          })
        }, 1500)
      }
    })
  },
  onReady: function () {

  },
  //监听拖动地图，拖动结束根据中心点更新页面
  mapChange: function (e) {
    let that = this;
    let fail = function (data) {
      console.log(data)
    };
    let success = function (data) {
      let wxMarkerData = data.wxMarkerData[0];
      // console.log(wxMarkerData);
      that.setData({
        addressName: wxMarkerData.address,
        currentRegion: data.originalData.result.addressComponent,
      });
      let location = wxMarkerData.latitude + ',' + wxMarkerData.longitude;
      that.nearby_search(wxMarkerData.address, location);
    };
    //&& (e.causedBy == 'scale' || e.causedBy == 'drag')
    if (e.type == 'end' && (e.causedBy == 'scale' || e.causedBy == 'drag')) {
      /*用一个轮询判断getlocation是否执行完,
        保证定位完再执行mapchange,
        主要是解决map组件初始化时会因为scale改变触发一次当前函数 
      */
      let i = setInterval(function () {
        let {
          isGet
        } = that.data;
        if (isGet) {
          clearInterval(i);
          //先调用微信组件获取地图中心点位置经纬度
          that.mapCtx.getCenterLocation({
            success: function (res) {
              // console.log(res)
              that.setData({
                nearList: [],
                latitude: res.latitude,
                longitude: res.longitude,
              });
              //百度逆地址解析,将经纬度转换为地址信息
              BMap.regeocoding({
                location: res.latitude + ',' + res.longitude,
                fail: fail,
                success: success,
              });
            }
          });
        }
      }, 500)
    }
  },
  //重新定位
  reload: function () {
    this.onLoad();
  },

  onShow: function () {

  },
  // 根据关键词搜索附近位置
  nearby_search: function (addressName, location) {
    let that = this;
    /*发起POI检索请求,搜索当前位置附近地址信息
      如果不知道参数可以通过ctrl+鼠标左键进入类内部查看方法 
    */
    BMap.search({
      "query": addressName || '房地产',
      location: location,
      page_size: 20,
      page_index: 1,
      success: function (res) {
        // console.log(res);
        let sug = [];
        let wxMarkerData = res.wxMarkerData;
        // console.log(wxMarkerData)
        for (let i of wxMarkerData) {
          // console.log(i)
          sug.push({ // 获取返回结果，放到sug数组中
            title: i.title,
            id: i.id,
            addr: i.address,
            latitude: i.latitude,
            longitude: i.longitude
          });
        }
        if (sug.length > 0) {
          that.setData({
            selectedId: 0,
            centerData: sug[0],
            nearList: sug,
          });
        }
      },
      fail(err) {
        console.log(err)
        wx.hideLoading({});
        wx.showToast({
          title: '获取附近地址信息失败',
          icon: 'none',
          duration: 1500
        })
        setTimeout(function () {
          wx.navigateBack({
            delta: 1
          })
        }, 1500)
      },
    });
  },



  //显示搜索列表
  showAddList: function () {
    this.setData({
      addListShow: true
    })
  },
  //根据关键词搜索匹配位置
  getsuggest: function (ev) {
    let that = this;
    that.setData({
      addListShow: true
    })
    let keyWold = ev.detail.value.trim(),
      {
        currentRegion
      } = that.data,
      searchCity = currentRegion.city;

    if (keyWold != "") {
      /* 根据输入的关键字,在当前城市搜索关键字地址信息 */
      BMap.suggestion({
        query: keyWold,
        region: searchCity, //市
        city_limit: true,
        // 搜索结果处理
        success: res => {
          let newList = res.result.filter(item => {
            return item.location;
          });
          // console.log(newList)
          that.setData({
            nearList: newList,
          });
        },
        fail(err) {
          console.log(err)
        }
      });
    } else {
      if (!that.data.addListShow) {
        that.setData({
          addListShow: true
        })
      }
    }
  },

  //点击选择地图下方列表某项
  chooseCenter: function (e) {
    let that = this;
    let id = e.currentTarget.id;
    let nearList = that.data.nearList;
    that.setData({
      selectedId: id,
      centerData: nearList[id],
      latitude: nearList[id].latitude,
      longitude: nearList[id].longitude,
    });
  },

  //点击选择搜索结果
  backfill: function (e) {
    let that = this;
    let id = e.currentTarget.id;
    let nearList = that.data.nearList;
    that.setData({
      selectedId: id,
      centerData: nearList[id],
      addListShow: false,
      latitude: nearList[id].latitude,
      longitude: nearList[id].longitude
    });
    // 选择完返回地图页面
    // let location = nearList[id].latitude + ',' + nearList[id].longitude;
    // that.nearby_search(nearList[id].title, location);
    // console.log(that.data.centerData)
    //选择完返回上一页
    wx.navigateBack({
      delta: 1
    })
  },

  //返回上一页或关闭搜索页面
  back1: function () {
    wx.navigateBack({
      delta: 1
    })
    // if (this.data.addListShow) {
    //   this.setData({
    //     addListShow: false
    //   })
    // }
    //返回上一页
    // else {
    //   wx.navigateBack({
    //     delta: 1
    //   })
    // }
  },
  //确认选择地址
  selectedOk: function () {
    console.log(this.data.centerData)
  }
})