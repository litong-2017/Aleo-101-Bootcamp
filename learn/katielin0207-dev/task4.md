# Task 4 - 部署到测试网

## 项目：ZK Treasure Hunt 🪄

基于 Task 3 的 ZK Treasure Hunt 项目，已成功部署到 **Aleo Testnet**。

**GitHub 仓库：** https://github.com/katielin0207-dev/zk-treasure-hunt

---

## 测试网部署信息

| 项目 | 内容 |
|------|------|
| **合约地址（Program ID）** | `treasure_hunt.aleo` |
| **部署网络** | Aleo Testnet |
| **部署者地址** | `aleo192xccjkqdp5c8lwjdp9ldky5egun3jrg4m2fh05r0tldq8cu9qqqv847yj` |
| **部署交易 TX** | `at1pedzdd4wcu26grecrujx888qktyvd0450fld0mv9lefwejej2cgqvhm70t` |
| **链上交互 TX** | `at12nhjcehhu9622r28new94e9wdzh3w35yn9agcx870f8gf5s9mc8qjjj4yr` |
| **Explorer（合约）** | https://testnet.explorer.provable.com/program/treasure_hunt.aleo |
| **Explorer（交互）** | https://testnet.explorer.provable.com/transaction/at12nhjcehhu9622r28new94e9wdzh3w35yn9agcx870f8gf5s9mc8qjjj4yr |

---

## 链上交互截图

### 链上交互 - hide_treasure 函数调用

- **Transaction ID:** `at12nhjcehhu9622r28new94e9wdzh3w35yn9agcx870f8gf5s9mc8qjjj4yr`
- **Status:** ACCEPTED ✅
- **Block:** 17,044,237
- **Type:** EXECUTE
- **Function:** `TREASURE_HUNT.ALEO :: HIDE_TREASURE`
- **Timestamp:** JUN 7 2026 11:09:35 PM

---

## 链上交互说明

调用了 `hide_treasure` 函数，游戏主在坐标 `(2, 3)` 处秘密藏好宝藏：

```bash
leo execute hide_treasure 2u8 3u8 987654321u64 \
  --network testnet \
  --broadcast
```

输出（ZK 证明保护私密坐标）：
- `HiddenTreasure` record — 私密，坐标永不上链
- `commitment` field — 公开，用于验证游戏主未作弊

---

## 文件结构

```
task4/
├── index.html          ← 前端（Harry Potter 主题）
├── leo/
│   ├── program.json
│   └── src/
│       └── main.leo    ← Leo ZK 合约（Leo 4.x）
└── task4.md
```
