const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// 钱包地址和私钥
const DEPLOYER_ADDRESS = ""; // Set your deployer address
const PRIVATE_KEY = ""; // Set your private key

async function main() {
  // 设置私钥环境变量，这样hardhat配置可以使用它
  process.env.PRIVATE_KEY = PRIVATE_KEY;
  
  // 检查INFURA_API_KEY
  const infuraKey = process.env.INFURA_API_KEY;
  if (!infuraKey || infuraKey === "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz") {
    console.error("❌ Error: INFURA_API_KEY is required for Sepolia deployment.");
    console.error("\n📋 Please set INFURA_API_KEY using one of the following methods:");
    console.error("   1. Environment variable: export INFURA_API_KEY=your_key");
    console.error("   2. Hardhat vars: npx hardhat vars set INFURA_API_KEY");
    console.error("   3. Or modify hardhat.config.ts");
    console.error("\n💡 Get your free API key from: https://www.infura.io/");
    console.error("   See DEPLOY_SEPOLIA.md for detailed instructions.");
    process.exit(1);
  }
  
  // 使用hardhat的网络配置连接到Sepolia
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "sepolia" : network.name;
  
  console.log("Deploying contracts with the account:", signer.address);
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  console.log("Network:", networkName, "(Chain ID:", network.chainId.toString() + ")");
  
  // 验证地址是否匹配
  if (signer.address.toLowerCase() !== DEPLOYER_ADDRESS.toLowerCase()) {
    console.warn(`⚠️  Warning: Signer address ${signer.address} does not match expected address ${DEPLOYER_ADDRESS}`);
  }
  
  // 检查余额是否足够支付gas费用
  if (balance < ethers.parseEther("0.001")) {
    console.error("❌ Error: Insufficient balance to deploy. Please add ETH to the account.");
    process.exit(1);
  }
  
  const SolarTrackManager = await ethers.getContractFactory("SolarTrackManager");
  console.log("Deploying SolarTrackManager...");
  
  const solarTrack = await SolarTrackManager.connect(signer).deploy();
  
  await solarTrack.waitForDeployment();
  const address = await solarTrack.getAddress();
  
  console.log("✅ SolarTrackManager deployed to:", address);
  
  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments", networkName);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Read the compiled artifact
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "SolarTrackManager.sol", "SolarTrackManager.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const deploymentData = {
    address: address,
    abi: artifact.abi,
    deployer: signer.address,
    network: networkName,
    chainId: network.chainId,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(deploymentsDir, "SolarTrackManager.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  
  console.log(`✅ Deployment info saved to ${deploymentsDir}/SolarTrackManager.json`);
  console.log(`\n📋 Deployment Summary:`);
  console.log(`   Contract Address: ${address}`);
  console.log(`   Deployer: ${signer.address}`);
  console.log(`   Network: ${networkName} (Chain ID: ${network.chainId})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

