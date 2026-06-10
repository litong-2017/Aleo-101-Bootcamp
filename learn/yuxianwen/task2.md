# Task 2 - Leo 入门：学会这门语言

请将本文件复制到 `learn/YourName/` 文件夹中，填写你的答案后提交 PR。

## 问题

**Q1. Leo 中的 "Private by Default"（默认隐私）语义是什么？**

A: 在 Leo 中，`record` 的所有字段和 `transition` 函数的参数默认都是 **private（私有）** 的。私有意味着这些数据在链上以加密密文存储，只有该 record 的 `owner` 通过自己的 view key 才能解密查看。

三种可见性修饰符：
- `private`（默认）：加密存储，仅所有者可见
- `public`：明文存储，任何人可读
- `constant`：编译期常量，值固定不变

这一设计让开发者无需额外操作就能得到隐私保护，隐私是默认行为而非可选项。

---

**Q2. Tuple 包含 array structs 的示例，以及如何访问 struct 中的元素。**

A: Tuple 可以包含数组和结构体，通过链式 `.` 和 `[]` 访问内部元素：

```leo
struct Point {
    x: u64,
    y: u64,
}

transition example() -> u64 {
    let pts: [Point; 2] = [
        Point { x: 10u64, y: 20u64 },
        Point { x: 30u64, y: 40u64 },
    ];

    // Tuple 包含数组和 struct
    let tup: ([u8; 3], Point) = (
        [1u8, 2u8, 3u8],
        Point { x: 5u64, y: 6u64 },
    );

    let first_x: u64 = pts[0].x;      // 数组中 struct 的字段
    let tup_point_x: u64 = tup.1.x;   // tuple 中 struct 的字段
    let tup_arr_0: u8 = tup.0[0];     // tuple 中数组的元素

    return first_x;
}
```

---

**Q3. Aleo record 中 owner 字段的作用是什么？**

A: `owner` 字段是每个 record 必须包含的字段（类型为 `address`），作用体现在三个层面：

1. **所有权标识**：指定谁能消费（使用）这个 record —— 只有 `owner` 对应的私钥持有者才能将此 record 作为 transition 的输入
2. **隐私保护基础**：record 在链上以密文存储，owner 通过 view key 解密查看内容，其他人看不到
3. **UTXO 所有权追踪**：类似比特币的 UTXO，每次 transition 消费旧 record 并创建新 record（owner 可变），实现链上资产的私密转移

```leo
record Token {
    owner: address,   // 必须存在
    amount: u64,
}
```

---

**Q4. 程序中的 final 是什么？**

A: `final` 是 Leo 中用于**链上公开执行**的代码块或函数类型，对应 Aleo 执行的第二阶段：

- **transition 阶段**：链下执行，处理私有数据，生成 ZK 证明
- **final 阶段**：链上由所有验证节点公开执行，可读写 `mapping`（公链状态存储）

```leo
// 方式一：transition 内嵌 final 块
async transition transfer(amount: u64) -> Future {
    return finalize_transfer(self.caller, amount);
}
async function finalize_transfer(addr: address, amount: u64) {
    let bal: u64 = balances.get_or_use(addr, 0u64);
    balances.set(addr, bal + amount);
}

// 方式二：独立 async function（等同 final fn）
mapping balances: address => u64;
```

关键限制：`mapping` 读写**只能**在 async function（final 块）中进行。

---

**Q5. 如何创建 helper functions（辅助函数）？**

A: 使用 `fn` 关键字（不是 `transition`）定义辅助函数。辅助函数在编译时被内联到调用它的 transition 中：

```leo
// 定义辅助函数
fn compute_fee(amount: u64, rate: u64) -> u64 {
    return amount * rate / 100u64;
}

// 在 transition 中调用
transition pay(amount: u64) -> u64 {
    let fee: u64 = compute_fee(amount, 3u64);
    return amount - fee;
}
```

特点：只能被 `transition` 或其他 `fn` 调用，不能直接被外部调用，无法访问 `self.caller`。

---

**Q6. helper functions 能否创建 records？**

A: **不能**。`fn`（辅助函数）无法创建或消费 record。只有 `transition` 函数才有权创建 record（作为返回值输出）和消费 record（作为输入参数）。

这是 Leo 的核心安全设计：record 代表链上资产所有权，其生命周期必须由 transition 管理，才能正确生成 ZK 证明并更新链上状态。辅助函数仅负责纯计算逻辑。

---

**Q7. constructor 的目的是什么？**

A: Constructor 是创建 struct 或 record 实例的语法，格式为 `TypeName { field: value, ... }`。目的是类型安全地初始化——必须为所有字段提供正确类型的值，不能遗漏或添加多余字段，编译器在编译期验证。

```leo
struct Metadata {
    score: u32,
    active: bool,
}

record Badge {
    owner: address,
    data: Metadata,
}

transition mint_badge(score: u32) -> Badge {
    let meta: Metadata = Metadata { score: score, active: true };
    return Badge {
        owner: self.caller,
        data: meta,
    };
}
```

---

**Q8. 如何组合多个 interfaces（接口）？**

A: Leo 通过 **struct 嵌套** 实现数据组合，一个 struct 的字段可以是另一个 struct 类型，用链式 `.` 访问：

```leo
struct Position {
    x: u64,
    y: u64,
}

struct GameState {
    player: address,
    pos: Position,
    score: u64,
}

transition move_player(state: GameState, dx: u64) -> GameState {
    let new_pos: Position = Position { x: state.pos.x + dx, y: state.pos.y };
    return GameState { player: state.player, pos: new_pos, score: state.score };
}
```

对于程序间接口，Leo 使用 `import` 导入外部程序并通过动态调度（dynamic dispatch）跨程序调用 transition。

---

**Q9. record interface 中 `..` 的含义是什么？**

A: `..` 是 **spread 语法（展开运算符）**，在创建新 record/struct 实例时，复制旧实例中未显式修改的字段，避免逐一重写所有字段：

```leo
record Token {
    owner: address,
    amount: u64,
    locked: bool,
}

transition transfer_partial(
    t: Token,
    public new_owner: address,
    public send_amount: u64
) -> (Token, Token) {
    let sent: Token = Token { owner: new_owner, amount: send_amount, ..t };
    let remaining: Token = Token { amount: t.amount - send_amount, ..t };
    return (sent, remaining);
}
```

---

**Q10. 何时使用 dyn record（动态 record）？**

A: 当需要在**运行时处理来自不同程序的 record 类型**时使用 `dyn record`，典型场景：

1. **跨程序互操作**：一个通用协议程序需要接受来自多个不同代币合约的 record 输入，但编译时无法确定具体类型
2. **可扩展协议**：允许未来部署的新程序与现有程序交互，无需修改现有代码
3. **动态调度**：结合 `identifier` 类型，在运行时决定调用哪个程序和处理哪种 record

这类似于其他语言的接口/多态机制，但在 ZK 环境下通过 snarkVM 在运行时解析。

---

**Q11. storage vector 支持的核心操作有哪些？**

A: `storage vector` 声明为 `storage name: [type];`，是链上的动态数组。核心操作：

| 操作 | 语法 | 说明 |
|------|------|------|
| 读取 | `name.get(idx)` | 返回 `type?`，越界返回 `none` |
| 长度 | `name.len()` | 返回当前元素数量 |
| 追加 | `name.push(val)` | 在末尾添加元素 |
| 弹出 | `name.pop()` | 移除并返回最后一个元素（返回 `type?`） |
| 更新 | `name.set(idx, val)` | 修改指定索引的值（索引必须合法） |

所有 storage vector 操作只能在 `async function`（final 块）中使用，因为它们修改链上状态。
