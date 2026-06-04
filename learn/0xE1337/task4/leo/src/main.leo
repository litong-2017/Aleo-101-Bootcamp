// compliant_gate_pass.aleo
//
// 合规匿名门禁 = Task 3 的「选择性披露」+ Chapter 4 的「非包含证明」吊销名单。
//
// 持有者向门禁证明三件事，全程不暴露自己是谁、用哪张凭证、具体几级：
//   1. 我是 issuer 的会员，且 tier >= N（选择性披露，沿用 private_gate_pass）
//   2. 在 epoch 时未过期
//   3. 我的凭证序列号没有被吊销 —— 用「非包含证明」对链上吊销名单的 Merkle root 证明
//
// 非包含证明（排序 Merkle 链表，等价于「相邻邻居」但只需一条路径）：
//   吊销名单 = 排序的被吊销 serial 集合，前后加哨兵 0 和 u128::MAX，切成连续区间
//   (low, high)。每个叶子 = hash(low, high)，建 Merkle 树，链上只存 root。
//   证明「serial 未被吊销」= 出示它落入的那个已承诺区间 (low,high) + Merkle 路径，
//   链上验 low < serial < high 且 hash(low,high) 在树里。若 serial 真被吊销，它会是
//   某区间端点，找不到能把它严格夹在中间的已承诺区间 → 无法证明。serial 是私密 witness。
//
// 链上只公开：per-gate 访问计数、被花的 nullifier、吊销名单的 Merkle root。
program compliant_gate_pass.aleo {
    @noupgrade
    constructor() {}

    // Merkle 树深度：2^3 = 8 个叶子（最多 7 个被吊销 serial + 哨兵）。演示足够。
    // 名单更大时只需提高深度并相应加长 path。

    // 私密会员凭证，加密给持有者。
    record Credential {
        owner: address, // 持有者（加密目标 + 花费权）
        issuer: field, // 发证方标识
        tier: u8, // 会员等级
        expiry: u32, // 过期 epoch
        secret: field, // 派生 nullifier 用的私密随机数
        serial: u128, // 唯一序列号；吊销名单针对它（u128 可比较大小，field 不行）
    }

    struct NullifierPreimage {
        secret: field,
        gate_id: field,
        epoch: u32,
    }

    // Merkle 叶子/内部节点的哈希输入。叶子 = hash(low as field, high as field)；
    // 内部节点 = hash(左孩子, 右孩子)。统一用这个 struct，抗碰撞。
    struct Node {
        left: field,
        right: field,
    }

    // Merkle 认证路径的一步：兄弟节点哈希 + 它是否在右边
    struct Sibling {
        hash: field,
        is_right: bool, // true = 兄弟在右（当前节点在左）
    }

    // 公开：已花费的 nullifier
    mapping spent_nullifiers: field => bool;
    // 公开：每个门禁的累计访问数
    mapping gate_access_count: field => u64;
    // 公开：吊销名单 Merkle 树的当前 root（单槽，key 固定 0u8）
    mapping revocation_root: u8 => field;

    // 工具 transition：让离线脚本用 snarkVM 自身的 BHP256 重算叶子/节点哈希，
    // 保证它构建的 Merkle 树与链上验证完全一致（无需在 JS 里重写 BHP256）。
    // 离线 `leo run hash_pair a b` 即可，不广播、不上链。
    fn hash_pair(a: field, b: field) -> field {
        return BHP256::hash_to_field(Node { left: a, right: b });
    }

    // 发证方签发一张带序列号的凭证（demo 不做发证访问控制，沿用 Task 3 的诚实标注）。
    fn issue(
        holder: address,
        issuer: field,
        tier: u8,
        expiry: u32,
        secret: field,
        serial: u128,
    ) -> Credential {
        return Credential {
            owner: holder,
            issuer: issuer,
            tier: tier,
            expiry: expiry,
            secret: secret,
            serial: serial,
        };
    }

    // 管理员（部署者）更新吊销名单的 Merkle root。对应 Chapter 4：只有监管/授权方
    // 能改冻结列表。链上只存 root，名单本身在链下。
    fn set_revocation_root(new_root: field) -> Final {
        assert_eq(self.signer, aleo1ntxq2hsvnh4s5rmh23z2hvdlkd5j97mrxpjutk0ze6nys7ll25zquq3zyr);
        return final {
            revocation_root.set(0u8, new_root);
        };
    }

    // 持有者过门禁：选择性披露 + 非包含证明（未被吊销）。
    fn prove_access(
        cred: Credential,
        issuer_req: field,
        min_tier: u8,
        gate_id: field,
        epoch: u32,
        low: u128, // 我的 serial 落入的区间下界（已承诺的相邻被吊销端点之一）
        high: u128, // 区间上界
        path: [Sibling; 3], // (low,high) 叶子到 root 的 Merkle 路径
    ) -> (Credential, Final) {
        // 选择性披露
        assert_eq(cred.issuer, issuer_req);
        assert(cred.tier >= min_tier);
        assert(cred.expiry >= epoch);

        // 非包含证明：serial 严格落在一个已承诺区间内 => 它不是任何被吊销端点
        assert(low < cred.serial);
        assert(cred.serial < high);

        // 从 (low,high) 叶子沿路径重算 Merkle root
        let leaf: field = BHP256::hash_to_field(Node {
            left: low as field,
            right: high as field,
        });
        let cur: field = leaf;
        for i: u8 in 0u8..3u8 {
            let sib: Sibling = path[i];
            let l: field = sib.is_right ? cur : sib.hash;
            let r: field = sib.is_right ? sib.hash : cur;
            cur = BHP256::hash_to_field(Node { left: l, right: r });
        }
        let claimed_root: field = cur;

        // nullifier = hash(secret, gate_id, epoch)，跨门禁/跨 epoch 不可关联
        let nul: field = BHP256::hash_to_field(NullifierPreimage {
            secret: cred.secret,
            gate_id: gate_id,
            epoch: epoch,
        });

        // 重新产出同样的凭证给持有者（验证不销毁凭证）
        let reissued: Credential = Credential {
            owner: cred.owner,
            issuer: cred.issuer,
            tier: cred.tier,
            expiry: cred.expiry,
            secret: cred.secret,
            serial: cred.serial,
        };

        return (reissued, final {
            // 非包含证明必须对「当前」链上 root 有效
            let root: field = revocation_root.get_or_use(0u8, 0field);
            assert_eq(claimed_root, root);
            // 同一凭证对同一门禁+epoch 只能过一次
            let used: bool = spent_nullifiers.get_or_use(nul, false);
            assert(!used);
            spent_nullifiers.set(nul, true);
            let c: u64 = gate_access_count.get_or_use(gate_id, 0u64);
            gate_access_count.set(gate_id, c + 1u64);
        });
    }
}
