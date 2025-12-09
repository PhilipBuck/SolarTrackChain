# 部署到 Sepolia 测试网

## 前置要求

1. **INFURA_API_KEY**: 需要从 [Infura](https://www.infura.io/) 获取免费的 API Key
   - 访问 https://www.infura.io/
   - 注册账号并创建新项目
   - 选择 Sepolia 网络
   - 复制 API Key

2. **测试网 ETH**: 确保钱包地址 `0x0000000000000000000000000000000000000000` 有足够的 Sepolia ETH 用于支付 gas 费用
   - 可以从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取测试网 ETH

## 部署步骤

### 方法 1: 使用环境变量

```bash
cd action/contracts
export INFURA_API_KEY=your_infura_api_key_here
export PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
npx hardhat run deploy/deploy-sepolia.js --network sepolia
```

### 方法 2: 使用 Hardhat Vars

```bash
cd action/contracts
npx hardhat vars set INFURA_API_KEY
# 输入你的 Infura API Key

export PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
npx hardhat run deploy/deploy-sepolia.js --network sepolia
```

### 方法 3: 修改 hardhat.config.ts

直接在 `hardhat.config.ts` 中替换默认的 INFURA_API_KEY 值。

## 验证部署

部署成功后，合约地址会保存在 `deployments/sepolia/SolarTrackManager.json` 文件中。

你可以在 [Sepolia Etherscan](https://sepolia.etherscan.io/) 上查看部署的合约。

