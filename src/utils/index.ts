import { networks, NetworkType } from '../constants/networks'
import { ChainId, getNetWorkConnect } from '../connectors/index'
import { PairInfo } from '../state/bridge/reducer'
import store from '../state'
import BN from 'bignumber.js'
import web3 from 'web3'
import { getBridgeContract, getErc20Contract } from './contract'
import { ListType } from '../pages/bridge/transfer'
import { BridgeService } from '../api/bridge'

const { utils } = new web3()

export const web3Utils = utils

export function getNetworkInfo(networkId: ChainId): NetworkType {
  return networks[networkId]
}

export function getPairInfo(pairId: number): PairInfo | undefined {
  const pairList = store.getState().bridge.pairList
  for (let i = 0; i < pairList.length; i++) {
    if (pairList[i].id === pairId) {
      return pairList[i]
    }
  }
}

export function wei2eth(amount: string, decimals: number, precision = 6) {
  return new BN(amount).div(Math.pow(10, decimals)).precision(precision).toString()
}

export function toHex(n: number) {
  const { utils } = new web3()
  return utils.toHex(n)
}

export async function getApproveStatus(account: string, tokenAddress: string, bridgeAddress: string, library: any) {
  const tokenContract = getErc20Contract(tokenAddress, library)
  const allowance = await tokenContract.methods.allowance(account, bridgeAddress).call()
  console.log('allowance', allowance)
  return allowance > 0
}

/**
 * @description check address status
 */
export const checkAddress = async (address: string, type: ListType): Promise<boolean> => {
  const checkApi = type === ListType.BLACK ? BridgeService.inBlackList : BridgeService.inWhiteList
  try {
    const res = await checkApi(address)
    console.log(res.data.data)
    if (res.data.data.status) {
      return Boolean(res.data?.data.status)
    }
    return false
  } catch {
    return false
  }
}

export async function getSwapFee(selectedChainInfo: PairInfo, library: any, isSelectedNetwork: boolean) {
  const networkInfo = getNetworkInfo(selectedChainInfo.srcChainInfo.chainId)
  const distNetworkInfo = getNetworkInfo(selectedChainInfo.dstChainInfo.chainId)
  const lib = isSelectedNetwork ? library : getNetWorkConnect(networkInfo.chain_id as any)
  const address = isSelectedNetwork ? networkInfo.bridgeCoreAddress : distNetworkInfo.bridgeCoreAddress
  const contract = getBridgeContract(address, lib)
  const swapFee = await contract.methods.swapFee().call()
  return swapFee
}

/**
 * getDecimals
 */
export function getDecimals(amount: string) {
  if (!amount.includes('.')) {
    return 0
  } else {
    const [interger, decimal] = amount.split('.')
    return decimal.length ?? 0
  }
}

export function formatNumber(number: any, precision = 6) {
  return new BN(new BN(number).toFixed(precision)).toNumber().toString()
}
