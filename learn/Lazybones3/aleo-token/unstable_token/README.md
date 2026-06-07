常用命令

```
# 创建项目
leo new simple_token
# 进入项目目录
cd simple_token
# 测试
leo test
# 部署，不带参数--broadcast只会部署到本地
leo deploy --broadcast --consensus-version 14
# 执行mint函数
leo execute mint address 100u64 --broadcast
```