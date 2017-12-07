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

const phantom = require('phantom');

/**
 * 构建 WeChat 对象 即 js中 函数就是对象
 * @param {JSON} config 微信配置文件 
 */
var ScreenShots = function(config){
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
 * 自动回复 配置
 */
ScreenShots.prototype.xxxx = function(req,res){
    var that = this;
    var body = req.body;
    console.log(body);
    return new Promise(function(resolve,reject){
     
         
    (async function() {
        const instance = await phantom.create();
        const page = await instance.createPage();

        const status = await page.open(body.url);

        var imageName = new Date().getTime()+'.png';

        await page.render(imageName);
        if (status == 'success'){
            console.log(status);
            await instance.exit();
        }
        fs.readFile('./'+imageName, function (err, data) {
            if (err)    return console.log(err);
                // console.log('异步读取：' + data.toString());
                resolve(data);

            fs.unlink('./'+imageName, function (err) {
                     if (err) return console.log(err);
                      console.log('文件删除成功');
            })
        })
      //   const content = await page.property('content');
      //   console.log(content);
        
      
      })();
    });
}

//暴露可供外部访问的接口
module.exports = ScreenShots;