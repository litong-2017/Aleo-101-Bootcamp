# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。


## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在 Leo 中，所有变量、record 字段、函数输入/输出默认都是 **private** 的，除非显式标记 `public` 关键字。Private 值仅在本地（链下）transition 执行期间存在，存储在链上时为密文（加密），只有持有对应 view key 的人才能解密。Public 值以明文形式出现在链上，所有网络参与者可见。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A:
```leo
struct Point {
    x: u32,
    y: u32,
}

// Tuple 包含一个 u8 和一个 Point 数组
let data: (u8, [Point; 3]) = (
    1u8,
    [
        Point { x: 1u32, y: 2u32 },
        Point { x: 3u32, y: 4u32 },
        Point { x: 5u32, y: 6u32 },
    ],
);

// 访问方式：tuple索引.数组索引.字段名
let x0: u32 = data.1[0u32].x;   // = 1u32
let y2: u32 = data.1[2u32].y;   // = 6u32
```

访问语法：`.N` 访问 tuple 索引，`[i]` 访问数组索引（必须显式 u32 类型），`.field` 访问 struct 字段。

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 是每个 Aleo record 的第一个且必须的字段，类型为 `address`，作用有三：
1. **所有权/花费权限**：只有 owner 地址对应的私钥才能消费（spend）该 record，消费时会用 owner 的私钥派生唯一序列号（nullifier），防止双花。
2. **加密目标**：record 以密文存储在链上，使用 owner 的 view key 加密，只有 owner 能解密读取内容。
3. **隐私边界**：Aleo 不是"地址->余额"的账户模型，而是 program ID + 加密 record，地址只出现在 record 内部，防止账户行为画像。

---

**Q4. 程序中的 final 是什么？**

A: `final`（或 `finalize`/`async function`）是 Aleo 混合 VM 模型的**链上执行阶段**，用于桥接私有链下计算与公开链上状态更新。

工作流程：
1. `transition`/`fn` 主体在用户本地机器上**链下**执行，处理私有输入并生成 ZK 证明。
2. 网络验证 ZK 证明后，`finalize`/`final` 块由所有网络节点**链上**执行，更新公开状态（mappings、storage vectors 等）。

规则：final 块中所有数据必须是 public 的；如果 finalize 函数失败，整个程序逻辑回滚。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 在 Leo 4.0+ 语法中，在 `program {}` 块**外部**声明 `fn` 即为辅助函数；在 Aleo Instructions 中使用 `closure` 关键字。

```leo
// 辅助函数：在 program 块外部定义
fn add_u32(x: u32, y: u32) -> u32 {
    return x + y;
}

program calculator.aleo {
    @noupgrade
    constructor() {}

    fn compute(public a: u32, b: u32) -> u32 {
        let s: u32 = add_u32(a, b);
        return s;
    }
}
```

特点：辅助函数是纯计算，不能访问链上状态（mappings/storage），编译时内联到调用方的电路中，对外部调用者不可见，不能返回 record 或 Future 类型。

---

**Q6. helper functions 能否创建 records？**

A: **不能。** 辅助函数不能返回 record。原因：
- Record 创建必须绑定到 transition 边界的 ZK 证明。
- 每个 transition = 一个独立 ZK 电路 = 一个状态转换证明（消费旧 record + 产生新 record）。
- 辅助函数没有独立的 ZK 电路，会被内联到 transition 的电路中。
- owner、nonce、commitment 等关键字段由编译器/运行时在 transition 上下文中设置。

要创建 record，逻辑必须放在 `transition`/入口函数中。

---

**Q7. constructor 的目的是什么？**

A: Leo 中的 `constructor` 不是传统 OOP 的初始化器，而是**程序治理入口**，定义程序的升级策略——谁可以升级、在什么条件下、是否允许升级。

四种构造器注解模式：

| 注解 | 升级策略 | 用途 |
|------|---------|------|
| `@noupgrade` | 无人可升级 | 不可变的"代码即法律"合约 |
| `@admin(address="aleo1...")` | 仅指定管理员可升级 | 项目维护、紧急修复 |
| `@checksum(mapping="...", key="...")` | 仅当 checksum 匹配链上映射值时可升级 | DAO 治理 |
| `@custom` | 开发者自定义升级逻辑 | 多签、时间锁、复杂治理 |

构造器逻辑部署后不可变，每次部署/升级时运行，失败则拒绝部署/升级。

---

**Q8. 如何组合多个 interfaces（接口）？**

A: 使用 `+` 运算符组合多个接口：

```leo
interface Transfer {
    record Token {
        owner: address,
        balance: u64,
        ..
    }
    fn transfer(token: Token, to: address, amount: u64) -> Token;
}

interface Pausable {
    mapping paused: u8 => bool;
    fn pause() -> Final;
}

// 程序实现两个接口
program my_token.aleo: Transfer + Pausable {
    @noupgrade
    constructor() {}
    // 必须实现两个接口的所有字段和函数签名
}
```

编译器会强制检查声明了 `: InterfaceA + InterfaceB` 的程序必须满足两个接口的所有要求。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: 在 record 接口定义中，`..` 是**剩余模式**（rest pattern），表示"此接口只要求列出的字段存在，实现该接口的 record 可以包含额外字段"。

```leo
interface Transfer {
    record Token {
        owner: address,
        balance: u64,
        ..             // 实现方可以添加更多字段
    }
}
```

这允许接口只锁定**最小契约**，同时给实现方留出差异化空间（如稳定币需要 KYC 标志，NFT 需要 metadata 等），而不破坏接口一致性。

注意：record 接口中的 `..` 与 record 更新语法 `..old_record`（复制已有 record 实例的剩余字段）含义不同。

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当程序需要处理**编译时类型未知但保证符合某个接口**的 record 时，使用 `dyn record`。它是 Aleo 中动态分发/路由模式的基础。

典型使用场景：
- **通用包装器/路由合约**：将调用路由到任何实现 ARC-20 接口的 token 合约
- **通用托管/金库**：持有来自不同程序的任意资产 record
- **跨程序可组合性**：接受任何符合接口的 NFT record 的市场

特点：`record.dynamic` 有固定字段（`owner`、`_root`、`_nonce`、`_version`），大小不随数据字段数量变化，配合 `call.dynamic` 实现运行时函数分发。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: `storage vector` 是 Leo 的链上动态数组，支持以下核心操作：

| 操作 | 描述 | 复杂度 |
|------|------|--------|
| `push(value)` | 在末尾追加元素 | O(1) |
| `pop()` | 移除并返回最后一个元素 | O(1) |
| `get(index)` | 读取指定索引的元素（返回 Optional） | O(1) |
| `set(index, value)` | 替换指定索引的元素 | O(1) |
| `len()` | 返回当前元素数量 | O(1) |
| `swap_remove(index)` | 移除指定索引元素，用最后一个元素填充（不保持顺序） | O(1) |
| `clear()` | 将长度设为零 | O(1) |

约束：storage vector 操作只能在 `final`/`finalize`/`async function` 块中执行（链上），不能在链下 transition 主体中使用。`get(index)` 返回 Optional 类型，需用 `unwrap_or(default)` 获取实际值。
