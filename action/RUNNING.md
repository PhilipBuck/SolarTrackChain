# 🚀 SolarTrackChain 运行指南

## 当前运行状态

✅ **项目已成功启动**

### 运行中的服务

1. **Hardhat FHEVM 节点**
   - 地址：http://localhost:8545
   - ChainId: 31337
   - 状态：运行中 ✅

2. **Next.js 前端**
   - 地址：http://localhost:3000
   - 模式：Mock (本地开发)
   - 状态：运行中 ✅

3. **合约部署信息**
   - 合约名称：SolarTrackManager
   - 合约地址：`0x5FbDB2315678afecb367f032d93F642f64180aa3`
   - 网络：localhost (chainId: 31337)

## 📱 访问应用

在浏览器中打开：**http://localhost:3000**

### 可用页面

1. **主页** - http://localhost:3000/
   - 全局统计数据
   - 今日状态
   - 快速操作入口

2. **上报页面** - http://localhost:3000/log
   - 输入每日太阳能数据
   - 加密上传到链上
   - 成功动画反馈

3. **个人主页** - http://localhost:3000/profile
   - 查看个人总能量
   - 活动日历
   - 成就徽章

4. **排行榜** - http://localhost:3000/leaderboard
   - Top 100 贡献者
   - 全球统计
   - 个人排名

## 🔧 如何使用

### 第一步：连接钱包

1. 点击页面上的 "Connect Wallet" 按钮
2. MetaMask 会弹出连接请求
3. 确认连接

### 第二步：切换到本地网络

1. 打开 MetaMask
2. 切换网络到 "Localhost 8545"
3. 确认 ChainId 为 31337

### 第三步：开始使用

1. 访问 "Log Usage" 页面
2. 输入今日太阳能使用量（kWh）
3. 可选：添加 IPFS CID 备注
4. 点击 "Submit (Encrypted)" 提交

### 第四步：查看数据

1. 数据会以加密形式存储在链上
2. 访问 "My Profile" 查看个人统计
3. 点击 "Decrypt My Data" 解密查看明文数据
4. 访问 "Leaderboard" 查看全球排名

## 🎯 核心特性演示

### FHEVM 加密流程

1. **加密输入**
   - 前端使用 FHEVM instance 加密 kWh 数值
   - 生成加密证明（proof）
   - 提交到智能合约

2. **链上存储**
   - 合约使用 `euint32` 类型存储加密数据
   - 使用 `FHE.fromExternal` 转换外部密文
   - 使用 `FHE.add` 进行加密加法运算

3. **ACL 权限控制**
   - 使用 `FHE.allowThis` 授权合约访问
   - 使用 `FHE.allow` 授权用户访问
   - 只有授权用户可以解密数据

4. **解密输出**
   - 用户请求解密签名
   - 使用 `instance.userDecrypt` 解密密文
   - 获得明文数据展示

## 🛠️ 开发命令

### 合约端

```bash
cd action/contracts

# 编译合约
npm run compile

# 启动 Hardhat 节点
npx hardhat node

# 部署合约（新终端）
npx hardhat run deploy/deploy.js --network localhost

# 运行测试
npm test
```

### 前端端

```bash
cd action/frontend

# Mock 模式（需要 Hardhat 节点运行）
npm run dev:mock

# Sepolia 模式
npm run dev

# 生成 ABI
npm run genabi

# 构建生产版本
npm run build
```

## 📊 技术架构

### 合约层
- **FHEVM v0.9**: 全同态加密
- **Solidity 0.8.27**: 智能合约语言
- **Hardhat**: 开发框架
- **TypeChain**: 类型生成

### 前端层
- **Next.js 15**: React 框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **ethers.js v6**: Web3 库
- **FHEVM SDK**: 加密集成

### 双模式支持
- **Mock 模式**: @fhevm/mock-utils (本地开发)
- **Relayer SDK**: @zama-fhe/relayer-sdk (测试网/主网)

## 🐛 故障排除

### 如果 Hardhat 节点未运行

```bash
cd action/contracts
npx hardhat node
```

### 如果前端报错

```bash
cd action/frontend
npm run clean
npm run genabi
npm run dev:mock
```

### 如果合约地址不正确

```bash
# 重新部署合约
cd action/contracts
npx hardhat run deploy/deploy.js --network localhost

# 重新生成 ABI
cd action/frontend
npm run genabi
```

## 🎨 UI 特性

- ✨ 渐变色背景和卡片
- 🌟 悬浮动画效果
- 💫 加载状态动画
- 🎯 响应式布局
- 🔄 自动刷新数据
- 🎭 成功/错误状态反馈
- 📱 移动端优化

## 📝 下一步

1. 测试加密和解密流程
2. 查看个人统计数据
3. 探索排行榜功能
4. 部署到 Sepolia 测试网（可选）

---

**注意**：所有用户数据都经过 FHEVM 加密，确保隐私安全。只有授权用户可以解密自己的数据。

