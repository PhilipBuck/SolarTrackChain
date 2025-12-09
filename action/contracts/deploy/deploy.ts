import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedSolarTrack = await deploy("SolarTrackManager", {
    from: deployer,
    log: true,
  });

  console.log(`SolarTrackManager contract: `, deployedSolarTrack.address);
};
export default func;
func.id = "deploy_solarTrack"; // id required to prevent reexecution
func.tags = ["SolarTrackManager"];

