# ☀️ SolarTrackChain - 太阳能使用统计上链 DApp

基于 FHEVM v0.9 的太阳能使用统计 DApp，使用全同态加密技术保护用户隐私。

## 🎉 项目已成功运行

- ✅ Hardhat 节点运行中：http://localhost:8545
- ✅ Next.js 前端运行中：http://localhost:3000
- ✅ 合约已部署：0x5FbDB2315678afecb367f032d93F642f64180aa3
- ✅ FHEVM Mock 模式已启用

## 项目结构

```
action/
├── contracts/          # 智能合约
│   ├── contracts/
│   │   └── SolarTrackManager.sol
│   ├── deploy/
│   │   └── deploy.ts
│   └── ...
└── frontend/          # 前端应用
    ├── app/
    ├── components/
    ├── fhevm/
    ├── hooks/
    └── ...
```

## 技术栈

### 合约端
- **Solidity**: ^0.8.27
- **FHEVM**: @fhevm/solidity@^0.9.1
- **Hardhat**: ^2.26.0
- **Hardhat Plugin**: @fhevm/hardhat-plugin@^0.3.0-1

### 前端端
- **Next.js**: ^15.4.2
- **React**: ^19.1.0
- **TypeScript**: ^5
- **Tailwind CSS**: ^3.4.1
- **Relayer SDK**: @zama-fhe/relayer-sdk@0.3.0-5
- **Mock Utils**: @fhevm/mock-utils@0.3.0-1

## 快速开始

### 1. 安装依赖

#### 合约端
```bash
cd action/contracts
npm install
```

#### 前端端
```bash
cd action/frontend
npm install
```

### 2. 启动本地 FHEVM Hardhat 节点

```bash
cd action/contracts
npx hardhat node --network hardhat
```

### 3. 部署合约

在另一个终端：

```bash
cd action/contracts
npx hardhat deploy --network localhost
```

### 4. 生成 ABI

```bash
cd action/frontend
npm run genabi
```

### 5. 启动前端（Mock 模式）

```bash
cd action/frontend
npm run dev:mock
```

前端将在 `http://localhost:3000` 启动。

## 部署到 Sepolia 测试网

### 1. 配置环境变量

在 `action/contracts` 目录下创建 `.env` 文件：

```env
MNEMONIC=your_mnemonic_phrase
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 2. 部署合约

```bash
cd action/contracts
npx hardhat deploy --network sepolia
```

### 3. 更新前端 ABI

```bash
cd action/frontend
npm run genabi
```

### 4. 启动前端（Sepolia 模式）

```bash
cd action/frontend
npm run dev
```

前端将使用 Relayer SDK 与 Sepolia 测试网上的合约交互。

## 🎨 UI 页面

### 多页面架构
1. **Dashboard (/)** - 主仪表盘
   - 全局统计数据展示
   - 今日状态卡片
   - 快速导航入口

2. **Log Usage (/log)** - 上报页面
   - 加密输入太阳能数据
   - IPFS 备注支持
   - 成功动画反馈

3. **My Profile (/profile)** - 个人主页
   - 个人总能量统计
   - 活动日历热力图
   - 成就徽章系统

4. **Leaderboard (/leaderboard)** - 排行榜
   - Top 100 贡献者
   - 全球统计数据
   - 用户排名展示

## 功能特性

### 合约功能
- ✅ 使用 FHEVM 加密存储 kWh 数据
- ✅ 每日仅允许一次上报
- ✅ 支持 IPFS CID 存储备注
- ✅ 加密计算总 kWh
- ✅ ACL 访问控制
- ✅ 用户注册和统计

### 前端功能
- ✅ 支持本地 Mock 模式（开发）
- ✅ 支持 Sepolia 测试网模式（生产）
- ✅ 自动检测和使用 FHEVM 实例
- ✅ 加密输入和解密输出
- ✅ 精美的多页面环保主题 UI
- ✅ 响应式设计
- ✅ 动画效果和交互反馈
- ✅ MetaMask 钱包集成

## 开发说明

### Mock 模式 vs Relayer SDK 模式

- **Mock 模式** (chainId=31337): 使用 `@fhevm/mock-utils`，适用于本地开发
- **Relayer SDK 模式** (chainId=11155111): 使用 `@zama-fhe/relayer-sdk`，适用于测试网/主网

前端会自动检测 chainId 并选择相应的模式。

### 合约接口

主要接口：
- `logSolarUsage(externalEuint32 encryptedKwh, bytes calldata inputProof, string calldata noteCID)`: 记录太阳能使用量
- `getUserTotalKwh(address user)`: 获取用户总 kWh（加密）
- `getGlobalTotalKwh()`: 获取全局总 kWh（加密）
- `hasLoggedToday(address user)`: 检查今日是否已记录

## 注意事项

1. **本地开发**: 确保 Hardhat 节点正在运行（`npx hardhat node`）
2. **测试网部署**: 需要配置正确的环境变量
3. **WASM 文件**: 如果使用 Relayer SDK，需要将 WASM 文件复制到 `public/` 目录
4. **浏览器兼容性**: 需要支持 SharedArrayBuffer 的现代浏览器

## 许可证

MIT

