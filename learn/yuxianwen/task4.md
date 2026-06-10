# Task 4 - 用起来：真实场景落地

将你的 Aleo 应用部署到测试网并完成一次链上交互，提交相关代码，测试网合约地址和链上交互截图。

---

## 部署的程序：`yuxianwen_token.aleo`

### 合约代码

```leo
program yuxianwen_token.aleo {

    @noupgrade
    constructor() {}

    record Token {
        owner: address,
        amount: u64,
    }

    fn mint(public amount: u64) -> Token {
        return Token {
            owner: self.signer,
            amount: amount,
        };
    }

    fn transfer(
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

    fn combine(first: Token, second: Token) -> Token {
        assert_eq(first.owner, second.owner);
        return Token {
            owner: first.owner,
            amount: first.amount + second.amount,
        };
    }
}
```

### Leo 编译成功输出

```
Leo 🔨 Compiling 'yuxianwen_token.aleo'
Leo     21 statements before dead code elimination.
Leo     21 statements after dead code elimination.
Leo     The program checksum is: '[49u8, 29u8, 199u8, 233u8, 190u8, ...]'
Leo     Program size: 0.82 KB / 500.00 KB
Leo ✅ Compiled 'yuxianwen_token.aleo' into Aleo instructions.
Leo ✅ Generated ABI for program 'yuxianwen_token.aleo'.
```

### 测试网部署计划（真实测试网数据）

部署命令：
```bash
leo deploy \
  --network testnet \
  --endpoint https://api.explorer.provable.com/v1 \
  --broadcast \
  --yes
```

Leo CLI 连接测试网后返回的真实部署计划：

```
🛠️  Deployment Plan Summary
────────────────────────────────────────────
🔧 Configuration:
  Address:            aleo16vfu6rh4kh9dgng0jxgch420zrdahqqx8nlshp4ujxdtxz69nuyqkqzl5c
  Endpoint:           https://api.explorer.provable.com/v1
  Network:            testnet
  Consensus Version:  15

📦 Deployment Tasks:
  • yuxianwen_token.aleo  │ priority fee: 0  │ fee record: no (public fee)

📊 Deployment Summary for yuxianwen_token.aleo
────────────────────────────────────────────
  Program Size:         0.82 KB / 500.00 KB
  Total Variables:      212,970
  Total Constraints:    162,986

💰 Cost Breakdown (credits)
  Transaction Storage:  3.406000
  Program Synthesis:    0.375956
  Namespace:            1.000000
  Constructor:          0.002000
  Total Fee:            4.783956
  
  Function 'mint'    Total Execution Cost: 0.001405
  Function 'transfer' Total Execution Cost: 0.002242
  Function 'combine' Total Execution Cost: 0.002125
```

### 部署地址 & 链上交互

- **部署账户**：`aleo16vfu6rh4kh9dgng0jxgch420zrdahqqx8nlshp4ujxdtxz69nuyqkqzl5c`
- **测试网合约地址**：待获取测试网 credits 后部署（faucet.aleo.org 当前服务异常）
- **链上交互截图**：部署成功后补充

### 部署步骤

```bash
# 1. 编译验证
leo build

# 2. 从水龙头获取测试网 credits
# https://faucet.aleo.org/

# 3. 部署到测试网（已验证命令，待 credits 到账后执行）
leo deploy --private-key <PRIVATE_KEY> \
  --network testnet \
  --endpoint https://api.explorer.provable.com/v1 \
  --broadcast --yes

# 4. 执行 mint 链上交互
leo execute mint 1000u64 \
  --network testnet \
  --broadcast --yes
```
