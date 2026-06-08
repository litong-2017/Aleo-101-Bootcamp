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

测试网浏览器：

```text
https://testnet.explorer.provable.com/program/private_score_gate_liyincode.aleo
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

部署交易：

```text
at1f90ap37gkjfup673wcpu77hsupa6dkd79redytj998k2dk57ucgs50um5x
```

## 测试网合约地址

```text
private_score_gate_liyincode.aleo
```

## 链上交互

本次执行 `mint_score_card 88u64 60u64`，生成一张私密分数凭证。链上只能看到私密输入的 ciphertext 和公开门槛 `60u64`，不会直接暴露 `score=88`。

交易 ID：

```text
at1smcun4d5m2nx845wemfmrgrvtrvskc4ppx825f3jwxhtp7m6mqqs3fmnkq
```

交易浏览器：

```text
https://testnet.explorer.provable.com/transaction/at1smcun4d5m2nx845wemfmrgrvtrvskc4ppx825f3jwxhtp7m6mqqs3fmnkq
```

## 截图

```text
screenshots/program.png
screenshots/deploy.png
screenshots/mint_score_card.png
```
