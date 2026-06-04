# Task 4 · 用起来：真实场景落地 —— 合规匿名门禁（非包含证明）

> 将你的 Aleo 应用部署到测试网并完成一次链上交互，提交相关代码、测试网合约地址和链上交互截图。

把 Task 3 的「匿名凭证 / 选择性披露门禁」升级成 Chapter 4 教的**真实合规场景**：在"证明你够格"之外，再加一层「**证明你没被吊销**」——用本课旗舰技术 **非包含证明（non-inclusion proof）**，对链上的吊销名单 Merkle root 做证明，全程不暴露你是谁。

合约 `compliant_gate_pass.aleo` 已**部署到 Aleo testnet 并完成多笔真实链上交互**。

---

## 一、为什么需要"非包含证明"

Chapter 4 的核心场景是合规隐私稳定币：转账时要证明"我的地址**不在** OFAC 冻结名单里"，但又不能暴露我是谁、名单里有谁。透明链直接查名单即可，隐私链做不到——于是用**非包含证明**：链上只存名单的一个 Merkle root，用户用零知识证明"我落在名单的某个空隙里"。

把它落到门禁场景：发证方会**吊销**作废的凭证（离职、违规…）。门禁要拒绝被吊销的凭证，但不能因此暴露访客身份。所以：
- 链上只存「被吊销 serial 列表」的一个 **Merkle root**；
- 访客证明「我的凭证 serial **不在**吊销名单里」——serial 值本身不上链（私密 witness），访客身份（owner）也不暴露；只公开它落入的空隙区间（精确的隐私边界见 §六）。

## 二、机制：排序 Merkle 链表 + 区间非包含

把被吊销的 `serial` 排序，前后加哨兵 `0` 和 `u128::MAX`，切成连续**区间** `(low, high)`：

```
被吊销 = {100, 500}
边界   = [0, 100, 500, MAX]
区间   = (0,100)  (100,500)  (500,MAX)
叶子   = hash(low,high)，建 Merkle 树，链上只存 root
```

证明「serial = 300 未被吊销」：出示它落入的区间 `(100,500)` + 该叶子到 root 的 Merkle 路径。链上 `prove_access` 验证：

1. `low < serial < high`（300 严格落在区间内）
2. `hash(low,high)` 沿路径算出的 root == 链上 `revocation_root`

**为什么安全**：若 serial 真被吊销，它会是某个区间的**端点**，找不到任何「已承诺区间」能把它**严格**夹在中间 → `low < serial < high` 必然失败（实测见下）。伪造区间 `(serial-1, serial+1)` 也没用——它不是已承诺的叶子，算出的 root 对不上链上 root。

> 比讲师演示的"左右两个相邻邻居 + rank 连续"更简洁：用排序链表把"相邻"编码进叶子本身，**一条** Merkle 路径即可，等价且更省。

## 三、合约要点（`leo/src/main.leo`，Leo 4.0.2）

在 Task 3 的 `Credential` 上加一个 `serial: u128`（`field` 在 Leo 里无法比较大小，故用 `u128`，仅在哈希时 `as field`）。新增：

- `mapping revocation_root: u8 => field` —— 链上只存吊销名单的 Merkle root（单槽）
- `fn set_revocation_root(new_root)` —— **仅部署者**（`assert_eq(self.signer, ...)`）可更新名单，对应"只有监管/授权方能改冻结列表"
- `fn prove_access(cred, issuer_req, min_tier, gate_id, epoch, low, high, path[3])` —— 选择性披露（`tier >= N`、未过期、issuer 匹配）**+ 非包含证明**，再派生 nullifier 防重复、记录公开计数
- `fn hash_pair(a, b)` —— 工具 transition，让离线脚本用 snarkVM 自身的 BHP256 重算出与链上一致的 Merkle 树（见 `leo/build_tree.mjs`），无需在 JS 里重写哈希

## 四、链上证据（Aleo testnet，可独立复核）

| 操作 | Transaction ID |
|---|---|
| **部署** `compliant_gate_pass.aleo` | `at1mz49fz8mkxn640kl2w62g5ftlrkc0p795t0zmh9pxpydzpvt2sps6hdxh0` |
| `issue`（签发 serial=300 的凭证） | `at17t8w00jm7slae0rtns5fksr3umgwwyudmf8auc264ntx77ed2g8qcxx44c` |
| `set_revocation_root`（吊销 {100,500} 的 root） | `at1trq5ecy89l27llal2lwvp2vdlve6usp9zfk77px7n8f9mznf0gqqe9qp5d` |
| `prove_access`（**非包含证明**：serial 300 未被吊销） | `at17cs4r3qeq8plus5w64xhcwjtk3wd70grqal6hf4x2h5wgrxdg59s8sreuf` |

- **测试网合约地址（program id）**：`compliant_gate_pass.aleo`
- **部署者 / 签名账户**：`aleo1ntxq2hsvnh4s5rmh23z2hvdlkd5j97mrxpjutk0ze6nys7ll25zquq3zyr`
- 浏览器（测试网）：`https://testnet.explorer.provable.com/program/compliant_gate_pass.aleo`

```bash
# 程序在链上
curl -s https://api.provable.com/v2/testnet/program/compliant_gate_pass.aleo

# 门禁累计通行数（prove_access 成功后 +1）
curl -s https://api.provable.com/v2/testnet/program/compliant_gate_pass.aleo/mapping/gate_access_count/777field
# => "1u64"
```

截图见 `screenshots/`：部署交易 · 程序页 · prove_access 非包含证明交易。

## 五、本地验证（可复现）

```bash
cd leo
leo build                       # 编译
node build_tree.mjs             # 用合约自身 BHP256 构吊销树 + 非包含证明，自检 path→root

# 正例：serial=300 未被吊销 → 通过，链上算出的 root 与离线一致
leo run prove_access <cred> 12345field 2u8 777field 100u32 100u128 500u128 <path>

# 反例（soundness）：被吊销的 serial=100 → 在 assert(low < serial) 处失败
#   Error: 'assert.eq' failed: 'false' is not equal to 'true'
```

实测：
- `build_tree.mjs` 自检 **OK — path walks to root**
- 正例 `prove_access` 产出的 finalize root 与离线 root **完全一致**（`912103…740945field`）
- 反例被吊销 serial 在范围断言处**正确 revert**

## 六、已知边界

- 发证 `issue` 不做访问控制（demo 自发自持），沿用 Task 3 标注；非包含证明 / 选择性披露不依赖这一点。
- Merkle 深度固定为 3（8 叶子，演示足够）；名单更大只需提高深度并加长 `path`。
- **隐私边界（精确）**：serial 值不直接上链，访客身份始终不暴露；但证明会**公开它落入的区间 `(low,high)`**，即把 serial 约束在该空隙内。吊销名单越**稀疏**空隙越大、泄露越少；名单越密空隙越窄（极端情况可缩到一个值）。
- **信任假设（关键）**：非包含证明只保证「serial 不是这棵**已承诺树**里的端点」，链上**无法验证名单是否完整**——若 `set_revocation_root` 漏掉某个被吊销 serial，该 serial 就能蒙混过关。故完整性依赖链下的**可信发布方**（本 demo 是部署者单签；现实可用门限多签 / 可验证计算）。这与 Chapter 4 的 OFAC 冻结名单是**同款**信任假设。
- `serial` 取值须落在开区间 `(0, u128::MAX)`（两端被哨兵占用；demo 用 `300`）。
- 状态级匿名：链上不暴露地址↔凭证关联；fee 付费方、时序仍可被相关（与 Task 3 同）。
