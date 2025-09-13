#!/usr/bin/env node
import { ethers } from 'ethers'

const wallet = ethers.Wallet.createRandom()
console.log('Address:', wallet.address)
console.log('Private Key:', wallet.privateKey)
console.log('--- COPY THESE FOR DEV USE ONLY ---')
