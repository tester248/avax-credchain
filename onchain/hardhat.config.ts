import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "./cache",
    artifacts: "artifacts"
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5"
  }
};

export default config;
