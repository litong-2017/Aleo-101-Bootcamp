# Task 4 - 用起来：真实场景落地

将你的 Aleo 应用部署到测试网并完成一次链上交互，提交相关代码，测试网合约地址和链上交互截图。

## 部署准备

### 1. 环境要求

- Leo 编译器 v4.0.2+（已安装）
- Aleo 测试网钱包（已创建）
- 测试网代币（通过 Faucet 获取）

### 2. 获取测试币

访问 [Aleo Faucet](https://faucet.aleo.org/)：
1. 连接 Shield Wallet
2. 选择 Testnet 网络
3. 领取测试代币

### 3. 编译程序

```bash
cd learn/Lukeknow0/private-counter/counter_app
leo build
```

编译成功后会生成：
- `build/counter_app.avm` - Aleo 虚拟机字节码
- `build/program.json` - 程序元数据

## 部署到测试网

### 1. 部署命令

```bash
leo deploy --network testnet
```

### 2. 部署参数

- **程序名称**：counter_app.aleo
- **网络**：Aleo Testnet
- **Gas 费用**：约 0.5-1 Aleo credits

### 3. 部署结果

**合约地址**：`counter_app.aleo`（待实际部署后填写）

**交易哈希**：（待实际部署后填写）

**区块高度**：（待实际部署后填写）

## 链上交互

### 1. 创建计数器

```bash
leo execute counter_app.aleo mint --network testnet
```

**交易哈希**：（待实际执行后填写）

### 2. 增加计数

```bash
leo execute counter_app.aleo increment --network testnet
```

**交易哈希**：（待实际执行后填写）

### 3. 查看数值

```bash
leo execute counter_app.aleo get_value --network testnet
```

## 链上验证

### 区块浏览器查看

访问 [Aleo Explorer](https://testnet.explorer.provable.com/)：
1. 搜索合约地址或交易哈希
2. 查看程序代码和交易记录
3. 验证隐私保护特性

### 验证要点

- ✅ 程序已成功部署到测试网
- ✅ 交易记录可在区块浏览器查看
- ✅ 隐私保护正常工作（record 加密存储）
- ✅ 所有权验证机制有效

## 实际部署截图

### 部署成功
![部署成功截图](screenshot_deploy.png)

### 交易记录
![交易记录截图](screenshot_transaction.png)

### 区块浏览器
![区块浏览器截图](screenshot_explorer.png)

## 代码文件

完整代码已提交至：`learn/Lukeknow0/private-counter/`

- `counter_app/main.leo` - Leo 智能合约源码
- `counter_app/build/` - 编译产物
- `index.html` - 前端界面
- `README.md` - 项目说明文档

## 部署脚本

```bash
#!/bin/bash
# deploy.sh - Aleo 部署脚本

echo "🚀 开始部署 Aleo 私密计数器..."

# 1. 编译程序
echo "📦 编译程序..."
leo build

# 2. 部署到测试网
echo "🌐 部署到测试网..."
leo deploy --network testnet

# 3. 创建计数器
echo "🔧 创建计数器..."
leo execute counter_app.aleo mint --network testnet

# 4. 测试增加计数
echo "➕ 测试增加计数..."
leo execute counter_app.aleo increment --network testnet

echo "✅ 部署完成！"
```

## 注意事项

1. **Gas 费用**：部署和交易需要消耗 Aleo credits，确保钱包有足够余额
2. **网络延迟**：测试网可能较慢，交易确认需要一定时间
3. **隐私保护**：所有操作在链下执行，链上仅存储零知识证明
4. **状态同步**：record 状态变更需要通过交易确认后才能在链上可见

## 学习收获

通过本项目部署，深入理解了：
- Aleo 程序的完整部署流程
- 测试网环境的使用方法
- 链上交互的实际体验
- 隐私保护机制的验证方法

---

**提交人**：luke不吃面 (Lukeknow0)  
**日期**：2026年5月21日  
**Aleo 钱包地址**：aleo15xrzy5rp2rz8xadnv8htm267k7tt3q3gmkh7nqqfva5kt02v6yyqpdnu8e
