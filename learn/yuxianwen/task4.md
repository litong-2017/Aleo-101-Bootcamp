# Task 4 - 用起来：真实场景落地

将你的 Aleo 应用部署到测试网并完成一次链上交互，提交相关代码，测试网合约地址和链上交互截图。

---

## 部署的程序：`private_token.aleo`

### 合约代码

```leo
program private_token.aleo {

    record Token {
        owner: address,
        amount: u64,
    }

    transition mint(public amount: u64) -> Token {
        return Token {
            owner: self.caller,
            amount: amount,
        };
    }

    transition transfer(
        token: Token,
        public recipient: address,
        public amount: u64
    ) -> (Token, Token) {
        assert(token.amount >= amount);
        let change: Token = Token {
            owner: token.owner,
            amount: token.amount - amount,
        };
        let sent: Token = Token {
            owner: recipient,
            amount: amount,
        };
        return (change, sent);
    }
}
```

### 测试网部署信息

- **测试网合约地址**：（部署后填写）
- **部署交易 Hash**：（部署后填写）
- **Aleo Explorer 链接**：（部署后填写）

### 链上交互记录

部署后执行 `mint` 交易，截图如下：

![部署截图](./task4_deploy_screenshot.png)
![链上交互截图](./task4_interaction_screenshot.png)

### 部署步骤记录

```bash
# 1. 创建 Aleo 账户
leo account new

# 2. 获取测试网 tokens（水龙头）
# https://faucet.aleo.org/

# 3. 部署程序
leo deploy --network testnet

# 4. 执行链上 mint 交易
leo execute --network testnet mint 1000u64
```
