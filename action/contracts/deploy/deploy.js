const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("Network:", networkName);

  const SolarTrackManager = await ethers.getContractFactory("SolarTrackManager");
  const solarTrack = await SolarTrackManager.deploy();
  
  await solarTrack.waitForDeployment();
  const address = await solarTrack.getAddress();
  
  console.log("SolarTrackManager deployed to:", address);
  
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
    abi: artifact.abi
  };
  
  fs.writeFileSync(
    path.join(deploymentsDir, "SolarTrackManager.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  
  console.log(`Deployment info saved to ${deploymentsDir}/SolarTrackManager.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

