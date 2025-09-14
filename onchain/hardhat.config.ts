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
  networks: {
    credchainus: {
      url: "http://127.0.0.1:35885/ext/bc/3XbrmCiJw54WYP1WKiKV4sxX1mpjmc3WJapRZ78rwCgYt2kuQ/rpc",
      chainId: 1337001,
      accounts: process.env.USER_PRIVATE_KEY ? [process.env.USER_PRIVATE_KEY] : [],
      gas: 3000000,
      gasPrice: 25000000000, // 25 gwei
    },
    avalanche_l1: {
      url: "http://127.0.0.1:9650/ext/bc/C/rpc",
      chainId: 1337,
      accounts: process.env.RELAYER_PRIVATE_KEY ? [process.env.RELAYER_PRIVATE_KEY] : [],
      gas: 3000000,
      gasPrice: 25000000000, // 25 gwei
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
    }
  },
  defaultNetwork: "credchainus",
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
