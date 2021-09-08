import { md5 } from './md5.js';

const TYPE_TENCENT_VIDEO = 'tencentvideo';
const TYPE_UNDEFINED = undefined;
//加载script标签
function loadScript(src) {
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    newScript.src = src;
    document.getElementsByTagName('head')[0].appendChild(newScript);
    // 脚本加载完毕
    newScript.onload = function () {
        window.bridgeHelper = new BridgeHelper({
            // 底层页的origin，其中协议跟你当前页面的origin保持一致，
            // 例如：当前url为：https://abc.com/path/to/page.html，则origin为；https://m.v.qq.com
            // 例如：当前url为：http://abc.com/path/to/page.html，则origin为；http://m.v.qq.com
            origin: location.protocol + '//m.v.qq.com',
            // 应用的appid，用于统计日志流水区分不同的应用
            appid: 'tiv64yv4308upa0urv',
        });
        console.log('loaded', newScript.src);
    };
}

class mnSdk {
    constructor() {
        this.domain = 'https://zeus.aidalan.com';
        this.game_key = 'd992f6ba1e4861278628b50ae8ae0b67';
        // this.domain = "http://zeustest.aidalan.com";
        this.order_api = '/v1/payment/order';
        this.channel_order_api = '/v1/payment/channelOrder';
        this.isQQ = typeof qq !== 'undefined' && typeof qq.showToast === 'function';
        this.type;
    }

    // 初始化
    miniInit(game_config) {
        let init_config = {
            game_name: game_config.game_name,
            game_ver: game_config.game_ver,
            game_id: game_config.game_id,
            channel_id: game_config.channel_id,
            game_channel_id: game_config.game_channel_id,
            platform_type:
                typeof game_config.platform_type === 'string'
                    ? game_config.platform_type.toLowerCase()
                    : undefined,
        };
        this.setStorage('game_config', init_config);

        const handleTencentVideoPlatformInit = () => {
            loadScript('//vm.gtimg.cn/tencentvideo/script/video-interact/bridge-helper.min.js');
        };
        const handleUndefinedPlatformInit = () => {
            if (!this.isQQ) {
                let h5 = document.createElement('script');
                h5.src = 'https://cdn.11h5.com/static/js/sdk.min.js';
                let s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(h5, s);
            }
        };

        const platformInitMap = {
            [TYPE_TENCENT_VIDEO]: handleTencentVideoPlatformInit,
            [TYPE_UNDEFINED]: handleUndefinedPlatformInit,
        };
        platformInitMap[init_config.platform_type]();
    }

    getPubData() {
        let game_config = this.getStorage('game_config');
        let device_id = '';
        if (!this.getStorage('device_id')) {
            device_id = md5(new Date().getTime() + Math.random().toString().substr(3, 6));
            this.setStorage('device_id', device_id);
        } else {
            device_id = this.getStorage('device_id');
        }
        let screen_height,
            screen_width,
            device_name,
            os_ver = '',
            sdk_ver = '1.1.0',
            os_type = 'h5',
            networkType = '',
            batteryLevel = '',
            screenBrightness = '',
            model = '';
        let time = new Date();
        // 获取时区
        let timeZone = function (v) {
            let newV = Math.abs(v) < 10 ? `0${Math.abs(v)}:00` : `${Math.abs(v)}:00`;
            return v < 0 ? `+ ${newV}` : `- ${newV}`;
        };
        if (this.isQQ) {
            let deviceInfo = qq.getSystemInfoSync();
            screen_width = deviceInfo.screenWidth;
            screen_height = deviceInfo.screenHeight;
            device_name = deviceInfo.brand + ' ' + deviceInfo.model;
            // 系统型号
            let osInfo = deviceInfo.system.split(' ');
            os_ver = osInfo[1];
            sdk_ver = deviceInfo.version;
            os_type = osInfo[0];
            model = deviceInfo.model;

            // 网络信息
            qq.getNetworkType({
                success: function (res) {
                    networkType = res.networkType;
                },
            });
            // 电量
            qq.getBatteryInfo({
                success: function (res) {
                    batteryLevel = parseInt(res.level);
                },
            });
            // 电量
            qq.getScreenBrightness({
                success: function (res) {
                    screenBrightness = parseInt(res.value);
                },
            });
        } else {
            screen_width = document.body.clientWidth || document.documentElement.clientWidth;
            screen_height = document.body.clientHeight || document.documentElement.clientHeight;

            let user_agent = navigator.userAgent;
            device_name = navigator.platform;
            os_ver = navigator.platform;
            const contains = arr => {
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].indexOf('Build/') !== -1) {
                        return i;
                    }
                }
                return -1;
            };
            if (user_agent.indexOf('Android') > -1 || user_agent.indexOf('Linux') > -1) {
                const aUA = user_agent.split(';');
                const i = contains(aUA);
                if (i !== -1) {
                    device_name = aUA[i].substring(0, aUA[i].indexOf('Build/'));
                }
                const reg = /android [\d._]+/gi;
                const v_info = user_agent.match(reg);
                os_ver = (v_info + '').replace(/[^0-9|_.]/gi, '').replace(/_/gi, '.');
            } else if (!!user_agent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
                const reg = /os [\d._]+/gi;
                const v_info = user_agent.match(reg);
                os_ver = (v_info + '').replace(/[^0-9|_.]/gi, '').replace(/_/gi, '.');
            }

            const net_type = () => {
                try {
                    if (navigator.connection.type) {
                        return navigator.connection.type;
                    } else {
                        return 'unknow';
                    }
                } catch (error) {
                    return 'unknow';
                }
            };
            networkType = net_type();
        }

        let public_data = {
            game: {
                game_name: game_config.game_name,
                game_ver: game_config.game_ver,
                game_id: game_config.game_id,
            },
            device: {
                screen_height: parseInt(screen_width),
                screen_width: parseInt(screen_height),
                device_id: device_id,
                ios_idfa: '',
                android_imei: '',
                android_adv_id: '',
                android_id: '',
                device_name: device_name,
                os_ver: os_ver,
                sdk_ver: sdk_ver,
                package_name: 'com',
                os_type: os_type,
                net_type: networkType,
                user_agent: '',
                imsi: '',
                wifi_name: '',
                bluetooth: '',
                model: model,
                battery_level: batteryLevel,
                screen_brightness: screenBrightness,
                cpu_type: '',
                inner_ip: '',
                is_root: '',
                orientation_sensor: '',
                oaid: '',
                gps: '',
                fingerprint: '',
            },
            channel_platform: {
                ad_id: '',
            },
            other: {
                client_time_zone: 'GMT' + timeZone(time.getTimezoneOffset() / 60),
                client_ts: '' + Math.round(time.getTime() / 1000),
            },
            agent: {
                channel_id: game_config.channel_id,
                game_channel_id: game_config.game_channel_id,
            },
            verify: {},
        };
        return public_data;
    }

    miniLogin(callback) {
        let game_config = this.getStorage('game_config');
        const handleTencentVideoPlatformLogin = () => {
            window.bridgeHelper
                .login('qq', {
                    timeout: 10000, // 10s超时
                })
                .then(res => {
                    window.bridgeHelper.getAuthCode({ appid: 'tiv64yv4308upa0urv' }).then(res => {
                        // console.log(res);

                        let resInfo = {
                            ret: 1,
                            data: {
                                code: res.result.code,
                            },
                        };
                        callback && callback(resInfo);
                    });
                    // console.log(res);
                })
                .catch(err => {
                    console.error(err);
                }); // 登录qq
        };
        const handleUndefinedPlatformLogin = () => {
            if (this.isQQ) {
                qq.login({
                    success(res) {
                        //{errMsg: "login:ok", code: "5505ac82719655fed4d848721b872457"}
                        if (res.code) {
                            let resInfo = {
                                ret: 1,
                                data: {
                                    code: res.code,
                                },
                            };
                            callback && callback(resInfo);
                        } else {
                            let errInfo = {
                                ret: 0,
                                data: res,
                            };
                            callback && callback(errInfo);
                            console.log('微信登录失败：', res);
                        }
                    },
                    fail(err) {
                        let errInfo = {
                            ret: 0,
                            data: err,
                        };
                        callback && callback(errInfo);
                        console.log('微信登录失败：', err);
                    },
                });
            } else {
                let urlJson = this.getUrlJson();
                let resInfo = {
                    ret: 1,
                    data: {
                        code: urlJson.token || '',
                        fuid: urlJson.fuid || '',
                        focus: urlJson.focus || '',
                        chid: urlJson.chid || '',
                    },
                };
                callback && callback(resInfo);
            }
        };

        const platFormLoginMap = {
            [TYPE_TENCENT_VIDEO]: handleTencentVideoPlatformLogin,
            [TYPE_UNDEFINED]: handleUndefinedPlatformLogin,
        };
        console.log(game_config);
        platFormLoginMap[game_config.platform_type]();
    }

    miniLoginRsp(obj) {
        let login_rsp = {};
        login_rsp.access_token = obj.access_token;
        login_rsp.user_id = obj.user_id;
        this.setStorage('login_rsp', login_rsp);
    }

    miniBuy(obj, callback, logoutCallback) {
        let game_config = this.getStorage('game_config');
        let _this = this;
        const handleTencentVideoPlatFormMiniBuy = () => {
            window.bridgeHelper
                .isLogin()
                .then(res => {
                    console.log(res);
                    if (res.result.isLogin) {
                        _this.sendOrder(obj, callback);
                    } else {
                        logoutCallback();
                    }
                })

                .catch(err => {
                    let errInfo = {
                        ret: 0,
                        data: err,
                    };
                    callback && callback(errInfo);
                    logoutCallback();
                });
        };
        const handleUndefinedPlatFormMiniBuy = () => {
            if (_this.isQQ) {
                qq.checkSession({
                    success() {
                        _this.sendOrder(obj, callback);
                    },
                    fail(err) {
                        let errInfo = {
                            ret: 0,
                            data: err,
                        };
                        callback && callback(errInfo);
                        logoutCallback();
                    },
                });
            } else {
                _this.sendOrder(obj, callback);
            }
        };
        const platFormMiniBuyMap = {
            [TYPE_TENCENT_VIDEO]: handleTencentVideoPlatFormMiniBuy,
            [TYPE_UNDEFINED]: handleUndefinedPlatFormMiniBuy,
        };
        platFormMiniBuyMap[game_config.platform_type]();
    }

    sendOrder(obj, callback) {
        console.log(1);
        let _this = this;
        let public_data = _this.getPubData();
        console.log(2);
        let login_rsp = _this.getStorage('login_rsp');
        let game_config = _this.getStorage('game_config');
        console.log(3);
        console.log('------');
        console.log(login_rsp);
        console.log(game_config);
        console.log(public_data);
        console.log('------');
        try {
            let order_data = {
                user_id: login_rsp.user_id || '',
                game_role_id: obj.game_role_id,
                game_role_name: obj.game_role_name,
                game_role_level: obj.game_role_level,
                server_id: obj.server_id,
                server_name: obj.server_name,
                zone_id: obj.zone_id,
                zone_name: obj.zone_name,
                goods_id: obj.goods_id,
                goods_name: obj.goods_name,
                trade_sn: obj.trade_sn,
                amount: obj.amount,
                extra_data: obj.extra_data,
                callback_url: obj.callback_url,
            };  
        } catch (error) {
            console.log(error);
            
        }
 
        console.log('order_data');
        console.log(order_data);
        console.log(4);
        public_data.verify = order_data;

        let signStr = _this.createSign(public_data) + _this.game_key;
        public_data['sign'] = md5(signStr);
        let send_order_api = _this.domain + _this.order_api;

        _this.request({
            method: 'POST',
            url: send_order_api,
            data: public_data,
            success(res) {
                console.log(5);

                let { ret, content } = res;
                if (ret === 1) {
                    const handleTencentVideoPlatFormSendOrderCallback = () => {
                        _this.sendChannelOrder(content, obj, callback);
                    };
                    const handleUndefinedPlatFormSendOrderCallback = () => {
                        if (_this.isQQ) {
                            _this.sendChannelOrder(content, obj, callback);
                        } else {
                            _this.miniPay(content, obj, callback);
                        }
                    };
                    const platFormSendOrderMap = {
                        [TYPE_TENCENT_VIDEO]: handleTencentVideoPlatFormSendOrderCallback,
                        [TYPE_UNDEFINED]: handleUndefinedPlatFormSendOrderCallback,
                    };
                    platFormSendOrderMap[game_config.platform_type]();
                } else {
                    let errInfo = {
                        ret: 0,
                        data: res,
                        post_url: send_order_api,
                    };
                    callback && callback(errInfo);
                }
            },
            fail(err) {
                let errInfo = {
                    ret: 0,
                    data: err,
                    post_url: send_order_api,
                };
                callback && callback(errInfo);
            },
        });
    }

    sendChannelOrder(content, obj, callback) {
        let _this = this;
        let public_data = _this.getPubData();
        let login_rsp = _this.getStorage('login_rsp');
        let game_config = _this.getStorage('game_config');
        let channel_order_data = {
            user_id: login_rsp.user_id || '',
            game_role_id: obj.game_role_id,
            game_role_name: obj.game_role_name,
            game_role_level: obj.game_role_level,
            server_id: obj.server_id,
            server_name: obj.server_name,
            goods_id: obj.goods_id,
            goods_name: obj.goods_name,
            amount: obj.amount,
            order_sn: content.order_sn,
            access_token: login_rsp.access_token || '',
        };
        public_data.verify = channel_order_data;

        let signStr = _this.createSign(public_data) + _this.game_key;
        public_data['sign'] = md5(signStr);
        let send_channel_order_api = _this.domain + _this.channel_order_api;

        _this.request({
            method: 'POST',
            url: send_channel_order_api,
            data: public_data,
            success(res) {
                let { ret, content } = res;
                if (ret === 1) {
                    _this.miniPay(content, obj, callback);
                } else {
                    let errInfo = {
                        ret: 0,
                        data: res,
                        post_url: send_channel_order_api,
                    };
                    callback && callback(errInfo);
                }
            },
            fail(err) {
                let errInfo = {
                    ret: 0,
                    data: err,
                    post_url: send_channel_order_api,
                };
                callback && callback(errInfo);
            },
        });
    }

    miniPay(content, obj, callback) {
        const handleTencentVideoPlatFormMiniPay = () => {
            bridgeHelper
                .SingleCashier({
                    items: `${obj.goods_id}:${obj.amount}`,
                    remark: '', // 透传后端返回的 pay_remark 字段即可
                    title: '6元限时礼包',
                    desc: '6元限时礼包',
                    itemName: '6元限时礼包',
                })
                .then(res => {
                    console.log(res);
                    let resInfo = {
                        ret: 1,
                        data: {
                            code: res,
                        },
                    };
                    callback && callback(resInfo);
                })
                .catch(err => {
                    let errInfo = {
                        ret: 0,
                        data: err,
                    };
                    callback && callback(errInfo);
                });
        };
        const handleUndefinedPlatFormMiniPay = () => {
            if (this.isQQ) {
                //setEnv ---- 0:米大师正式环境 ,1:米大师沙箱环境
                //回调错误码 ---- 0：消耗成功，-1：系统错误，-2：用户取消支付，-3：米大师充值失败，-4：米大师消耗失败，-1000：参数错误
                let midas_config = {
                    prepayId: content.channel_trade_sn,
                    starCurrency: obj.amount / 10,
                    setEnv: 0,
                    success: function (res) {
                        let resInfo = {
                            ret: 1,
                            data: {
                                code: res,
                            },
                        };
                        callback && callback(resInfo);
                    },
                    fail: function (err) {
                        let errInfo = {
                            ret: 0,
                            data: err,
                        };
                        callback && callback(errInfo);
                    },
                };
                console.log(midas_config);
                qq.requestMidasPayment(midas_config);
            } else {
                sdk.pay({
                    pid: obj.goods_id,
                    txid: content.order_sn,
                    product_count: obj.product_count || '',
                });
            }
        };
        const platFormMiniPayMap = {
            [TYPE_TENCENT_VIDEO]: handleTencentVideoPlatFormMiniPay,
            [TYPE_UNDEFINED]: handleUndefinedPlatFormMiniPay,
        };
    }

    miniShare(items, callback) {
        if (this.isQQ) {
            let share_config = {
                showShareItems: items || ['qq', 'qzone', 'wechatFriends', 'wechatMoment'],
                success: function (res) {
                    let resInfo = {
                        ret: 1,
                        data: res,
                    };
                    callback && callback(resInfo);
                },
                fail: function (err) {
                    let errInfo = {
                        ret: 0,
                        data: err,
                    };
                    callback && callback(errInfo);
                },
            };
            qq.showShareMenu(share_config);
        } else {
            // 只在微信环境有效
            sdk.showShare();
            items.desc && sdk.shareDesc(items.desc);
            items.title && sdk.shareTitle(items.title);
            items.icon && sdk.shareIcon(items.icon);
        }
    }

    miniFoucus() {
        if (!this.isQQ) {
            sdk.showFocus();
        }
    }

    createSign(data) {
        let signStr = '',
            v = '';
        Object.keys(data)
            .sort()
            .forEach(k => {
                v = typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k];
                signStr += k + '=' + v + '&';
            });
        signStr = signStr.substring(0, signStr.length - 1);
        return signStr;
    }

    setStorage(key, value) {
        if (this.isQQ) {
            qq.setStorageSync(key, value);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }

    getStorage(key) {
        if (this.isQQ) {
            return qq.getStorageSync(key);
        } else {
            if (localStorage.getItem(key)) {
                return JSON.parse(localStorage.getItem(key));
            }
        }
    }

    getUrlJson() {
        //获取url后面的参数
        const search = window.location.search.substring(1);
        const aSearch = search.split('&');
        const urlJson = {};
        aSearch.forEach(item => {
            const aItem = item.split('=');
            urlJson[aItem[0]] = aItem[1];
        });
        return urlJson;
    }

    request(params) {
        const newParams = {
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
            },
            ...params,
        };
        const { url, method, data, header, success, fail, async } = newParams;
        if (this.isQQ) {
            qq.request({
                method: 'POST',
                url,
                data,
                success(res) {
                    success && success(res.data);
                },
                fail(err) {
                    fail && fail(err);
                },
            });
        } else {
            const httpRequest = new XMLHttpRequest();
            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState === 4) {
                    if (httpRequest.status === 200) {
                        if (httpRequest.responseText) {
                            success && success(JSON.parse(httpRequest.responseText));
                        }
                    } else {
                        fail && fail(httpRequest.status);
                    }
                }
            };
            httpRequest.open(method, url, async);
            for (const key in header) {
                httpRequest.setRequestHeader(key, header[key]);
            }
            if (data) {
                httpRequest.send(JSON.stringify(data));
            } else {
                httpRequest.send(null);
            }
        }
    }
}

const _mnSdk = new mnSdk();
window._mnSdk = _mnSdk;
export default _mnSdk;

// export default _mnSdk;
