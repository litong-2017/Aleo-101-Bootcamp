# Task 4 - 用起来：真实场景落地

将你的 Aleo 应用部署到测试网并完成一次链上交互，提交相关代码，测试网合约地址和链上交互截图。

---

## 部署信息

### 合约地址
- **程序名称**：counter_v2.aleo
- **网络**：Aleo Testnet
- **部署者地址**：aleo15xrzy5rp2rz8xadnv8htm267k7tt3q3gmkh7nqqfva5kt02v6yyqpdnu8e

### 部署交易
- **部署交易 ID**：`at1wp7s9nkpgjpxenm6ufx8h8yd6f4lfwp9uex6j0h477ja8n99kczqc6lkl3`
- **Fee ID**：`au1yjudw0e2yv6nsxgu673jdq8l63sek8kpvu79zydnt6gqs47jzuyqh4q76q`
- **Fee 交易 ID**：`at129yu4r37a67qr0uamr54tfdfs6sc3yzhanth7l0vjdzpvft59cps9wkzj2`
- **部署费用**：4.561 credits
- **部署时间**：2026-05-21
- **状态**：✅ Transaction accepted and confirmed

### 区块浏览器
- **部署交易**：https://testnet.explorer.provable.com/transaction/at1wp7s9nkpgjpxenm6ufx8h8yd6f4lfwp9uex6j0h477ja8n99kczqc6lkl3

---

## 链上交互

### 交易 1：调用 mint 函数创建计数器

- **交易 ID**：`at1a7l5hkgwl03ecm7dtj2mrcnnhv7ys90fcddq6pvmf88l6p2rxcrqr450da`
- **Fee ID**：`au162lp8lkhyfqnxm07ygt289yc3z39jgx0aq66949jxlv7k79ua5pqpypdwk`
- **Fee 交易 ID**：`at1wrdrtlcas4rtsgy2chj7zc8vx8mfju8rh6ann9udrr67h4skgqxszdeee7`
- **执行费用**：0.001454 credits
- **执行时间**：2026-05-21
- **状态**：✅ Execution confirmed

**输出结果**：
```
Counter {
    owner: aleo15xrzy5rp2rz8xadnv8htm267k7tt3q3gmkh7nqqfva5kt02v6yyqpdnu8e.private,
    count: 0u32.private,
    _nonce: 5917162202531231934717023552963376063125046338432672204288999068889910927585group.public,
    _version: 1u8.public
}
```

### 区块浏览器
- **执行交易**：https://testnet.explorer.provable.com/transaction/at1a7l5hkgwl03ecm7dtj2mrcnnhv7ys90fcddq6pvmf88l6p2rxcrqr450da

---

## 程序功能

| 函数 | 功能 | 输入 | 输出 |
|------|------|------|------|
| `mint` | 创建新计数器 | owner: address | Counter record (count=0) |
| `increment` | 增加计数 | counter: Counter | Counter record (count+1) |
| `get_count` | 获取当前值 | counter: Counter | u32 |

## Leo 源代码

```leo
program counter_v2.aleo {
    @noupgrade
    constructor() {}

    record Counter {
        owner: address,
        count: u32,
    }

    fn mint(owner: address) -> Counter {
        return Counter {
            owner: owner,
            count: 0u32,
        };
    }

    fn increment(counter: Counter) -> Counter {
        assert_eq(counter.owner, self.caller);
        let new_count: u32 = counter.count + 1u32;
        return Counter {
            owner: self.caller,
            count: new_count,
        };
    }

    fn get_count(counter: Counter) -> u32 {
        assert_eq(counter.owner, self.caller);
        return counter.count;
    }
}
```

---

## 部署过程截图

### 部署成功
```
📡 Broadcasting deployment for counter_v2.aleo...
💰Your current public balance is 18.088046 credits.

✉️ Broadcasted transaction with:
  - transaction ID: 'at1wp7s9nkpgjpxenm6ufx8h8yd6f4lfwp9uex6j0h477ja8n99kczqc6lkl3'

🔄 Searching up to 12 blocks to confirm transaction...
Explored 3 blocks.
Transaction accepted.
✅ Deployment confirmed!
```

### 执行成功
```
⚙️ Executing counter_v2.aleo/mint...

📊 Execution Cost Summary for counter_v2.aleo
💰 Cost Breakdown (credits)
  Transaction Storage:  0.001454
  Total Fee:            0.001454

➡️  Output
 • {
  owner: aleo15xrzy5rp2rz8xadnv8htm267k7tt3q3gmkh7nqqfva5kt02v6yyqpdnu8e.private,
  count: 0u32.private
}

📡 Broadcasting execution for counter_v2.aleo...
💰Your current public balance is 13.527046 credits.

🔄 Searching up to 12 blocks to confirm transaction...
Explored 3 blocks.
Transaction accepted.
✅ Execution confirmed!
```

---

## 代码文件

完整代码已提交至：`learn/Lukeknow0/private-counter/`

- `counter_app/src/main.leo` - Leo 智能合约源码
- `counter_app/build/main.aleo` - 编译产物
- `counter_app/build/abi.json` - 程序 ABI
- `counter_app/program.json` - 程序配置
- `index.html` - 前端界面
- `README.md` - 项目说明文档

---

## 验证链接

1. **查看部署交易**：
   https://testnet.explorer.provable.com/transaction/at1wp7s9nkpgjpxenm6ufx8h8yd6f4lfwp9uex6j0h477ja8n99kczqc6lkl3

2. **查看执行交易**：
   https://testnet.explorer.provable.com/transaction/at1a7l5hkgwl03ecm7dtj2mrcnnhv7ys90fcddq6pvmf88l6p2rxcrqr450da

3. **查看钱包地址**：
   https://testnet.explorer.provable.com/address/aleo15xrzy5rp2rz8xadnv8htm267k7tt3q3gmkh7nqqfva5kt02v6yyqpdnu8e

---

**提交人**：luke不吃面 (Lukeknow0)
**日期**：2026年5月21日
**Aleo 钱包地址**：aleo15xrzy5rp2rz8xadnv8htm267k7tt3q3gmkh7nqqfva5kt02v6yyqpdnu8e
