import { execSync } from "child_process";

try {
  execSync("curl -s http://localhost:8545", { stdio: "ignore" });
  console.log("Hardhat node is running");
} catch {
  console.error("Hardhat node is not running. Please start it first.");
  process.exit(1);
}

