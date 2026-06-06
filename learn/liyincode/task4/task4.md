# Task 4 - 用起来：真实场景落地

## 应用简介

本次提交把 Task 3 的 Private Score Gate 部署到 Aleo 测试网。应用用私密 `ScoreCard` record 保存用户分数，只公开门槛和校验结果，适合模拟会员门禁、白名单资格或课程资格校验。

## 项目结构

```text
learn/liyincode/task4/
├── private_score_gate_liyincode/
│   ├── program.json
│   └── src/main.leo
├── screenshots/
└── task4.md
```

## 本地验证

```bash
leo build --path learn/liyincode/task4/private_score_gate_liyincode
```

验证结果：

```text
leo 4.2.0 (ff8a86e HEAD) features=[noconfig]
Compiled 'private_score_gate_liyincode.aleo' into Aleo instructions.
```

## 测试网部署

Program ID:

```text
private_score_gate_liyincode.aleo
```

部署命令：

```bash
PRIVATE_KEY="$PRIVATE_KEY" leo deploy \
  --path learn/liyincode/task4/private_score_gate_liyincode \
  --network testnet \
  --endpoint https://api.explorer.provable.com/v1 \
  --broadcast \
  --yes
```

链上交互命令：

```bash
PRIVATE_KEY="$PRIVATE_KEY" leo execute \
  --path learn/liyincode/task4/private_score_gate_liyincode \
  mint_score_card 88u64 60u64 \
  --network testnet \
  --endpoint https://api.explorer.provable.com/v1 \
  --broadcast \
  --yes
```

`leo deploy` 费用估算：

```text
Total Fee: 4.669221 credits
```

## 测试网合约地址

```text
Pending: deployment requires a funded Aleo testnet account.
```

## 链上交互截图

```text
Pending: add deployment and interaction screenshots after successful broadcast.
```

## 当前状态

本地已完成 Leo 4.2.0 编译验证，并已执行一次测试网部署流程直到广播前余额检查。临时测试账户没有 public balance，官方 faucet 在当前环境返回 Cloudflare block，因此无法非交互领取测试币。

```text
Error [ECLI0377041]: invalid public balance for account `aleo1sqdgvwa65nkykpdt3saczsdhwg7cw524q2fus39lxmmk7ll9sgpq6qyft4`
     |
     = Make sure the account has enough public balance to cover the deployment fee.
```

私钥和助记信息不会提交到仓库。拿到测试币后，重新运行上面的部署和链上交互命令，再补充合约地址、交易 ID 和截图。
