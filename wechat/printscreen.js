'use strict' //设置为严格模式

const fs = require('fs'), //引入 fs 模块

    phantom = require('phantom')

var ScreenShots = function(){
}

/**
 * 自动回复 配置
 */
ScreenShots.prototype.xxxx = function(req,res){
    // var that = this;
    // var body = req.body;
    // console.log(body);
    return new Promise(function(resolve,reject){
     
        resolve('123');
    // (async function() {
    //     const instance = await phantom.create();
    //     const page = await instance.createPage();

    //     const status = await page.open(body.url);

    //     var imageName = new Date().getTime()+'.png';

    //     await page.render(imageName);
    //     if (status == 'success'){
    //         console.log(status);
    //         await instance.exit();
    //     }
    //     fs.readFile('./'+imageName, function (err, data) {
    //         if (err)    return console.log(err);
    //             // console.log('异步读取：' + data.toString());
    //             resolve(data);

    //         fs.unlink('./'+imageName, function (err) {
    //                  if (err) return console.log(err);
    //                   console.log('文件删除成功');
    //         })
    //     })
    //   //   const content = await page.property('content');
    //   //   console.log(content);
        
      
    //   })();
    });
}

//暴露可供外部访问的接口
module.exports = ScreenShots;