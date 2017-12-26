const express = require('express'), //express 框架 
      wechat  = require('./wechat/wechat'), 
      screenshots  = require('./wechat/printscreen'), 
      config = require('./config');//引入配置文件
      bodyParser = require('body-parser')

var app = express();//实例express框架


const path = require('path');
app.use(express.static(path.join(__dirname,'html/images')))

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// parse various different custom JSON types as JSON
app.use(bodyParser.json({ type: 'application/*+json' }));


var wechatApp = new wechat(config); //实例wechat 模块
var screenshotsApp = new screenshots(); //实例wechat 模块

//用于处理所有进入 3000 端口 get 的连接请求
app.get('/',function(req,res){
    wechatApp.auth(req,res);
});

//用于处理所有进入 3000 端口 post 的连接请求
app.post('/',function(req,res){
    wechatApp.handleMsg(req,res);
});

//用于请求获取 access_token
app.get('/getAccessToken',function(req,res){
    wechatApp.getAccessToken().then(function(data){
        res.send(data);
    });    
});

//用于发消息 POST
app.post('/sendMsg',function(req,res){

    if (!req.body) return res.sendStatus(400);

    wechatApp.postSendMsg(req,res).then(function(data){
        res.send(data);
    }); 

 });

//用于发消息 GET
app.get('/createMenus',function(req,res){
   
        wechatApp.createMenus().then(function(data){
            res.send(data);
        }); 
});

//用于H5分享 POST
app.post('/wechatconfig',function(req,res){

        if (!req.body) return res.sendStatus(400);
   
        wechatApp.wechatconfig(req,res).then(function(data){
            res.send(data);
        }); 
    
});

//用于自动回复 POST
app.post('/automsgconfig',function(req,res){
    
            if (!req.body) return res.sendStatus(400);
       
            wechatApp.automsgconfig(req,res).then(function(data){
                res.send(data);
            }); 
        
    });

//用于发消息 GET
app.post('/screenshots.png',function(req,res){
    
    screenshotsApp.xxxx(req,res).then(function(data){
        res.setHeader('Content-Type','image/png');
             res.send(data);
         }); 
 });
 app.get('/haha.html', function (req, res) {
    res.sendfile(__dirname + '/html/haha.html');
  });
  //用于发消息 GET
app.get('/testget',function(req,res){
   
    console.log('======'+new Date()+'=======');
    console.log(req.headers['user-agent']);
    console.log(req.query);
    res.send('ok');
   
});
//监听3000端口
app.listen(8222);