'use strict' //设置为严格模式

const crypto = require('crypto'), //引入加密模块
       https = require('https'), //引入 htts 模块
       http = require('http'), //引入 http 模块
        util = require('util'), //引入 util 工具包
          fs = require('fs'), //引入 fs 模块
      urltil = require('url'),//引入 url 模块
accessTokenJson = require('./access_token'), //引入本地存储的 access_token
jsapitickt = require('./jsapi_tickt'), //引入本地存储的 access_token
      menus  = require('./menus'), //引入微信菜单配置
 parseString = require('xml2js').parseString,//引入xml2js包
         msg = require('./msg'),//引入消息处理模块
         sign  = require('./sign'),
        
CryptoGraphy = require('./cryptoGraphy'); //微信消息加解密模块

var autoMsg  = require('./autoMsg');
/**
 * 构建 WeChat 对象 即 js中 函数就是对象
 * @param {JSON} config 微信配置文件 
 */
var WeChat = function(config){
    //设置 WeChat 对象属性 config
    this.config = config;
    //设置 WeChat 对象属性 token
    this.token = config.token;
    //设置 WeChat 对象属性 appID
    this.appID = config.appID;
    //设置 WeChat 对象属性 appScrect
    this.appScrect = config.appScrect;
    //设置 WeChat 对象属性 apiDomain
    this.apiDomain = config.apiDomain;
    //设置 WeChat 对象属性 apiURL
    this.apiURL = config.apiURL;

        /**
     * 用于处理 http Get请求方法
     * @param {String} url 请求地址 
     */
    this.requesthttpGet = function(url){
        return new Promise(function(resolve,reject){
            http.get(url,function(res){
                var buffer = [],result = "";
                //监听 data 事件
                res.on('data',function(data){
                    buffer.push(data);
                });
                //监听 数据传输完成事件
                res.on('end',function(){
                    result = Buffer.concat(buffer).toString('utf-8');
                    //将最后结果返回
                    resolve(result);
                });
            }).on('error',function(err){
                reject(err);
            });
        });
    }
    /**
     * 用于处理 https Get请求方法
     * @param {String} url 请求地址 
     */
    this.requestGet = function(url){
        return new Promise(function(resolve,reject){
            https.get(url,function(res){
                var buffer = [],result = "";
                //监听 data 事件
                res.on('data',function(data){
                    buffer.push(data);
                });
                //监听 数据传输完成事件
                res.on('end',function(){
                    result = Buffer.concat(buffer).toString('utf-8');
                    //将最后结果返回
                    resolve(result);
                });
            }).on('error',function(err){
                reject(err);
            });
        });
    }
 /**
     * 用于处理 http Post请求方法
     * @param {String} url  请求地址
     * @param {JSON} data 提交的数据
     */
    this.requestHttpPost = function(url,data){
        return new Promise(function(resolve,reject){
            //解析 url 地址
            var urlData = urltil.parse(url);
            //设置 http.request  options 传入的参数对象
            var options={
                //目标主机地址
                hostname: urlData.hostname, 
                //目标地址 
                path: urlData.path,
                //请求方法
                method: 'POST',
                //头部协议
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data,'utf-8')
                }
            };
            var req = http.request(options,function(res){
                var buffer = [],result = '';
                //用于监听 data 事件 接收数据
                res.on('data',function(data){
                    buffer.push(data);
                });
                 //用于监听 end 事件 完成数据的接收
                res.on('end',function(){
                    result = Buffer.concat(buffer).toString('utf-8');
                    resolve(result);
                })
            })
            //监听错误事件
            .on('error',function(err){
                console.log(err);
                reject(err);
            });
            //传入数据
            req.write(data);
            req.end();
        });
    }

    /**
     * 用于处理 https Post请求方法
     * @param {String} url  请求地址
     * @param {JSON} data 提交的数据
     */
    this.requestPost = function(url,data){
        return new Promise(function(resolve,reject){
            //解析 url 地址
            var urlData = urltil.parse(url);
            //设置 https.request  options 传入的参数对象
            var options={
                //目标主机地址
                hostname: urlData.hostname, 
                //目标地址 
                path: urlData.path,
                //请求方法
                method: 'POST',
                //头部协议
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data,'utf-8')
                }
            };
            var req = https.request(options,function(res){
                var buffer = [],result = '';
                //用于监听 data 事件 接收数据
                res.on('data',function(data){
                    buffer.push(data);
                });
                 //用于监听 end 事件 完成数据的接收
                res.on('end',function(){
                    result = Buffer.concat(buffer).toString('utf-8');
                    resolve(result);
                })
            })
            //监听错误事件
            .on('error',function(err){
                console.log(err);
                reject(err);
            });
            //传入数据
            req.write(data);
            req.end();
        });
    }
}

/**
 * 微信接入验证
 * @param {Request} req Request 对象
 * @param {Response} res Response 对象
 */
WeChat.prototype.auth = function(req,res){

        //1.获取微信服务器Get请求的参数 signature、timestamp、nonce、echostr
        var signature = req.query.signature,//微信加密签名
            timestamp = req.query.timestamp,//时间戳
                nonce = req.query.nonce,//随机数
            echostr = req.query.echostr;//随机字符串

        //2.将token、timestamp、nonce三个参数进行字典序排序
        var array = [this.token,timestamp,nonce];
        array.sort();

        //3.将三个参数字符串拼接成一个字符串进行sha1加密
        var tempStr = array.join('');
        const hashCode = crypto.createHash('sha1'); //创建加密类型 
        var resultCode = hashCode.update(tempStr,'utf8').digest('hex'); //对传入的字符串进行加密

        //4.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
        if(resultCode === signature){
            // console.log("signature"+signature);
            res.send(echostr);
        }else{
            res.send('mismatch');
        }
}

/**
 * 自动回复 配置
 */
WeChat.prototype.automsgconfig = function(req,res){
    var that = this;
    var body = req.body;
    autoMsg = body;

    return new Promise(function(resolve,reject){
     
        fs.writeFile('./wechat/autoMsg.json',JSON.stringify(body));

        resolve(body);
    });
}
/**
 * 获取微信 access_token
 */
WeChat.prototype.getAccessToken = function(){
    var that = this;
    return new Promise(function(resolve,reject){
        //获取当前时间 
        var currentTime = new Date().getTime();
        //格式化请求地址
        var url = util.format(that.apiURL.accessTokenApi,that.apiDomain,that.appID,that.appScrect);
        //判断 本地存储的 access_token 是否有效
        if(accessTokenJson.access_token === "" || accessTokenJson.expires_time < currentTime){
            that.requestGet(url).then(function(data){
                var result = JSON.parse(data); 
                if(data.indexOf("errcode") < 0){
                    accessTokenJson.access_token = result.access_token;
                    accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
                    //更新本地存储的
                    fs.writeFile('./wechat/access_token.json',JSON.stringify(accessTokenJson));
                    //将获取后的 access_token 返回
                    resolve(accessTokenJson.access_token);
                }else{
                    //将错误返回
                    resolve(result);
                } 
            });
        }else{
            //将本地存储的 access_token 返回
            resolve(accessTokenJson.access_token);  
        }
    });
}

/**
 * 获取微信 getticket
 */
WeChat.prototype.getticket = function(){

    var that = this;
    return new Promise(function(resolve,reject){
        that.getAccessToken().then(function(data){

            //获取当前时间 
            var currentTime = new Date().getTime();
            //格式化请求地址
            var url = util.format(that.apiURL.getticketApi,that.apiDomain,data);

            //判断 本地存储的 ticket 是否有效
            if(jsapitickt.ticket === "" || jsapitickt.expires_in < currentTime){
                that.requestGet(url).then(function(data){
                    var result = JSON.parse(data); 

                    if(data.indexOf("errcode") < 0){
                         jsapitickt.ticket = result.ticket;
                         jsapitickt.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200) * 1000;
                         //更新本地存储的
                          fs.writeFile('./wechat/jsapi_tickt.json',JSON.stringify(jsapitickt));
                            //将获取后的 ticket 返回
                         resolve(jsapitickt.ticket);
                     }else{
                        //将错误返回
                         resolve(result);
                        } 
                      });
            }else{
                    //将本地存储的 access_token 返回
                    resolve(jsapitickt.ticket);  
            }
        });
    });
    
}

/**
 * 获取淘宝 主播id
 */
WeChat.prototype.gettaobaoid = function(url){

    var that = this;
    return new Promise(function(resolve,reject){
    
        that.requesthttpGet(url).then(function(data){
            var re="broadcasterId=(.*?)&"; 
            var arr=data.match(re); 
            console.log("re:"+arr);  
            if (arr != null){
                resolve(arr[1]);
            }     
        });
   
        
    });
}
/**
 * 发消息
 */
// WeChat.prototype.postSendMsg = function(){
//     var that = this;
//     return new Promise(function(resolve,reject){
//         //获取当前时间 
//         var currentTime = new Date().getTime();
//         //格式化请求地址
//         var url = util.format(that.apiURL.sendMsgApi,that.apiDomain,accessTokenJson.access_token);
//         var now = new Date();

//         var json = {"touser":"okwml0jhL-nYlWvj2R8Ni7SGgBMY",
//                "template_id":"Fa1_J9nK-bnI4g2-D5Ds5vYJvd2Jak7bMMvGJt10cYQ",
//                "topcolor":"#FF0000",
//                "url":"http://www.baidu.com",  
//                "data":{
//                    "first":{"value":"你好，你关注的主播更新状态了！",
//                    "color":"#173177"},

//                    "name":{"value":"刘洋",
//                    "color":"#173177"},

//                    "state":{"value":"直播中",
//                    "color":"#173177"},

//                    "date":{"value":now.toLocaleString(),
//                    "color":"#173177"},
                   
//                    "remark":{"value":"关注更多主播，了解更多信息\n---YYBT",
//                    "color":"#173177"}
//                 }};
//             that.requestPost(url,JSON.stringify(json)).then(function(data){
//                 resolve(data);
//             });
  
//     });
// }



/**
 * wechatconfig
 */
WeChat.prototype.wechatconfig = function(req,res){

    var that = this;
    var body = req.body;
    return new Promise(function(resolve,reject){
        that.getticket().then(function(data){
            
            var signvalue = sign(data.ticket, body.url);
            resolve(signvalue);
 
        });
    });

}
/**
 * 获取用户信息
 */
WeChat.prototype.test = function(){
    var that = this;
    return new Promise(function(resolve,reject){
        var url = "http://121.41.18.217:9191/api/user/bindOfficialAccount?openId=o-7bewsin43JysZLaJ8RIq0IRfNU&unionId=ohjTjw5NBaW-OcSF-eJNSWrm6yCw";
        
                            that.requesthttpGet(url).then(function(data){
                                resolve(data);
                            });
    });

}
/**
 * 获取用户信息
 */
WeChat.prototype.getUserInfo = function(openId){
    var that = this;
    return new Promise(function(resolve,reject){
        that.getAccessToken().then(function(data){
            
            //格式化请求地址
            var url = util.format(that.apiURL.getUserApi,that.apiDomain,data,openId);
  
            that.requestGet(url).then(function(data){
                resolve(data);
            });
            // resolve(data);
        });
    });

}
/**
 * 发消息
 */
WeChat.prototype.postSendMsg = function(req,res){
    var that = this;
    var body = req.body;
    return new Promise(function(resolve,reject){
        that.getAccessToken().then(function(data){
            
            //格式化请求地址
            var url = util.format(that.apiURL.sendMsgApi,that.apiDomain,data);
  
            that.requestPost(url,JSON.stringify(body)).then(function(data){
                resolve(data);
            });
            // resolve(data);
        });
    });

}
/**
 * 创建菜单
 */
WeChat.prototype.createMenus = function(){
    var that = this;
    return new Promise(function(resolve,reject){
        that.getAccessToken().then(function(data){
            //格式化请求连接
            var url = util.format(that.apiURL.createMenu,that.apiDomain,data);
            //使用 Post 请求创建微信菜单
            that.requestPost(url,JSON.stringify(menus)).then(function(data){
                //讲结果打印
                resolve(data);
            });
        });
    });
    
}
/**
 * 微信消息处理
 * @param {Request} req Request 对象
 * @param {Response} res Response 对象
 */
WeChat.prototype.handleMsg = function(req,res){
    var buffer = [],that = this;

    //实例微信消息加解密
    var cryptoGraphy = new CryptoGraphy(that.config,req);

    //监听 data 事件 用于接收数据
    req.on('data',function(data){
        buffer.push(data);
    });
    //监听 end 事件 用于处理接收完成的数据
    req.on('end',function(){
        var msgXml = Buffer.concat(buffer).toString('utf-8');
        //解析xml
        parseString(msgXml,{explicitArray : false},function(err,result){
            if(!err){
                result = result.xml;
                //判断消息加解密方式
                if(req.query.encrypt_type == 'aes'){
                    //对加密数据解密
                    result = cryptoGraphy.decryptMsg(result.Encrypt);
                }
                var toUser = result.ToUserName; //接收方微信
                var fromUser = result.FromUserName;//发送仿微信
                var reportMsg = ""; //声明回复消息的变量   

                //判断消息类型
                if(result.MsgType.toLowerCase() === "event"){
                    //判断事件类型
                    switch(result.Event.toLowerCase()){
                        case 'subscribe':
                            //回复消息
                            // var content = "直播这么久，为何TA这么火，而我不温不火？头号TOP给你提供各大平台直播数据分析，开启你的直播数据化时代！\n<a href='http://www.baidu.com'>立即前往查看</a>";
                            reportMsg = msg.picMsg(fromUser,toUser,'http://mmbiz.qpic.cn/mmbiz_jpg/Ec02myQzVKjHZicn50tlICAQIyZZSsaMYiaWn4N69BrlZyvTV1WnhCyrBtLkQ0jmiadE02BAv2528UgWVh0Shhr4g/0?wx_fmt=jpeg',"mlOXct8z2SSgg5QDut9VFhukGLxFQNlMI1lVSwtkv_w");
                            // console.log(fromUser);
                            // console.log(toUser);
                            that.getUserInfo(fromUser).then(function(data){
                                // console.log(JSON.stringify(data));
                                var userdata = JSON.parse(data);
                                //格式化请求地址
                                var url = util.format(that.apiURL.bindOfficialAccount,'http://121.41.18.217:9191',userdata.openid,userdata.unionid);
            
                                that.requesthttpGet(url).then(function(data){
                                    // console.log(JSON.stringify(data),url);
                                });
                            });
                        break;
                        case 'click':

                            switch(result.EventKey.toLowerCase()){
                                case 'lianxi':
                                    //回复消息
                                    var content = "有任何意见反馈和合作意向的朋友，你可以通过以下邮箱尽情勾搭~\n";
                                    content += "xym@7islandsmedia.com\n";
                                    reportMsg = msg.txtMsg(fromUser,toUser,content);
                                break;
                            }
                            //  var contentArr = [
                            //     {Title:"Node.js 微信自定义菜单",Description:"使用Node.js实现自定义微信菜单",PicUrl:"http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",Url:"http://blog.csdn.net/hvkcoder/article/details/72868520"},
                            //     {Title:"Node.js access_token的获取、存储及更新",Description:"Node.js access_token的获取、存储及更新",PicUrl:"http://img.blog.csdn.net/20170528151333883?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",Url:"http://blog.csdn.net/hvkcoder/article/details/72783631"},
                            //     {Title:"Node.js 接入微信公众平台开发",Description:"Node.js 接入微信公众平台开发",PicUrl:"http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",Url:"http://blog.csdn.net/hvkcoder/article/details/72765279"}
                            // ];
                            // //回复图文消息
                            // reportMsg = msg.graphicMsg(fromUser,toUser,contentArr);
                        break;
                    }
                }else{

                     //判断消息类型为 文本消息
                    if(result.MsgType.toLowerCase() === "text"){
                        if(result.Content.indexOf("手淘") >= 0){
                            var re="((http|https)://)(([a-zA-Z0-9\._-]+\.[a-zA-Z]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,4})*(/[a-zA-Z0-9\&%_\./-~-]*)?"; 
                            var arr=result.Content.match(re);
                            if (arr != null){
                                that.gettaobaoid(arr[0]).then(function(data){
                                    reportMsg = msg.txtMsg(fromUser,toUser,'主播ID为:'+data);
                                        //判断消息加解密方式，如果未加密则使用明文，对明文消息进行加密
                                    reportMsg = req.query.encrypt_type == 'aes' ? cryptoGraphy.encryptMsg(reportMsg) : reportMsg ;
                                    //返回给微信服务器
                                    res.send(reportMsg);
                                });
                                return;
                            }else{
                                reportMsg = msg.txtMsg(fromUser,toUser,'没有这个选项哦');
                            }
                        }else{
                            //根据消息内容返回消息信息
                            // switch(result.Content){
                            //     case 'yybt':
                            //         reportMsg = msg.txtMsg(fromUser,toUser,'Hello ！我叫yybt');
                            //         break;
                            //     default:
                            //         reportMsg = msg.txtMsg(fromUser,toUser,'没有这个选项哦');
                            //         break;
                            // }
                            var flog = true;

                            for(var i=0;i<autoMsg.length;i++){
                                var msgobg = autoMsg[i];
                                var key = msgobg["key"];
                                var type = msgobg["type"];
                                var content =  msgobg["content"];
                                if(result.Content == key){
                                    flog = false;
                                    if(type == "msg"){
                                        // console.log('dd'+fromUser+'to:'+toUser);
                                        // reportMsg = msg.picMsg(fromUser,toUser,'http://mmbiz.qpic.cn/mmbiz_jpg/Ec02myQzVKjHZicn50tlICAQIyZZSsaMYiaWn4N69BrlZyvTV1WnhCyrBtLkQ0jmiadE02BAv2528UgWVh0Shhr4g/0?wx_fmt=jpeg',"mlOXct8z2SSgg5QDut9VFhukGLxFQNlMI1lVSwtkv_w");
                                        reportMsg = msg.txtMsg(fromUser,toUser,content);
                                    }else if(type == "msgpic"){
                                        reportMsg = msg.graphicMsg(fromUser,toUser,content);
                                    }
                                    continue;
                                }

                            }

                            if(flog == true){
                                // reportMsg = msg.txtMsg(fromUser,toUser,'回复达人直播平台和昵称可以直接查看TA的数据战报哦！\n1代表：淘宝平台\n回复示例：1冯提莫');
                            }

                        }

                        
                    }
                }
                //判断消息加解密方式，如果未加密则使用明文，对明文消息进行加密
                reportMsg = req.query.encrypt_type == 'aes' ? cryptoGraphy.encryptMsg(reportMsg) : reportMsg ;
                //返回给微信服务器
                res.send(reportMsg);

            }else{
                //打印错误
                console.log(err);
            }
        });
    });
}

//暴露可供外部访问的接口
module.exports = WeChat;