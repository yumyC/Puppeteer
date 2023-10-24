## puppeteer pagediff
一款用于比较不同页面之间的差异的工具

### 1. 安装
> npm install puppeteer_pagediff
### 2. 使用
默认viewport width: 1980, height: 1980

####
```
cd node_modules/puppeteer_pagediff
npm i
```

#### 单个页面pagediff
> npm run diff -- single http://www.example1.com http://www.example2.com
#### 多个页面批量pagediff
> npm run diff -- batch 配置文件路径（绝对路径）
```
[
  {
    "beforeUrl": "https://www.example1.com/en",
    "afterUrl": "https://www.example2.com/en"
  },
  {
    "beforeUrl": "https://www.example1.com/en",
    "afterUrl": "https://www.example2.com/en"
  }
]
```

#### QA
有问题联系[我的博客](https://www.jianshu.com/p/bbfcc3b0c1b5)
