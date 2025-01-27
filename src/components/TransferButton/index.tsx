import React from 'react'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'
import { theme } from '../../constants/theme'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { toggleConnectWalletModalShow } from '../../state/wallet/actions'
import { withRouter } from 'react-router-dom'
import { useHistory } from 'react-router'
import { CheckListType } from '../../pages/bridge/transfer'
import { getPairInfo, getNetworkInfo, web3Utils } from '../../utils/index'
import { message } from 'antd'

export interface TransferButtonProps {
  applyApprove: any
  generateOrder: any
  checkList: CheckListType
  pairId: number
  amount: string
  bridgeStatus: string
}

const TransferButtonWrap = styled.div`
  margin-top: 20px;
`
export const BaseButton = styled.div`
  height: 48px;
  background: ${theme.colors.bridgePrimay};
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  cursor: pointer;
  user-select: none;
  letter-space: 1px;
`
const HistoryText = styled.div`
  margin-top: 10px;
  font-size: 14px;
  font-family: URWDIN-Regular, URWDIN;
  font-weight: 400;
  color: #00dea9;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  &:hover {
    font-weight: bold;
    text-decoration: underline;
  }
`
const DisabledButton = styled(BaseButton)`
  background: #e4f3f2;
  cursor: not-allowed;
  color: #ccc;
`

const TransferButton: React.FunctionComponent<TransferButtonProps> = ({
  applyApprove,
  generateOrder,
  checkList,
  pairId,
  amount,
  bridgeStatus,
}) => {
  const { t } = useTranslation()
  const { account } = useWeb3React()

  const history = useHistory()

  const dispatch = useDispatch()

  const connect = () => {
    dispatch(toggleConnectWalletModalShow({ show: true }))
  }

  const next = () => {
    generateOrder()
    history.push('/bridge/confirm')
  }

  const selectedPairInfo = React.useMemo(() => {
    return getPairInfo(pairId)
  }, [pairId])

  const selectedNetworkInfo = React.useMemo(() => {
    return getNetworkInfo(selectedPairInfo?.srcChainInfo.chainId as any)
  }, [selectedPairInfo])

  const allStatus = React.useMemo(() => {
    const keys = Reflect.ownKeys(checkList)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (!checkList[key as keyof CheckListType]) {
        return false
      }
    }
    return true
  }, [checkList])

  const switchNetwork = async () => {
    console.log(selectedNetworkInfo)
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: web3Utils.toHex(selectedNetworkInfo.chain_id).toString() }],
      })
      if (selectedNetworkInfo.chain_id === 321) {
        window.location.reload()
      }
    } catch (error) {
      console.log(error)
      // This error code indicates that the chain has not been added to MetaMask.
      if (error.code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: web3Utils.toHex(selectedNetworkInfo.chain_id).toString(), // A 0x-prefixed hexadecimal string
                chainName: selectedNetworkInfo.fullName,
                nativeCurrency: {
                  name: selectedNetworkInfo.symbol,
                  symbol: selectedNetworkInfo.symbol.toUpperCase(), // 2-6 characters long
                  decimals: selectedNetworkInfo.decimals,
                },
                rpcUrls: [selectedNetworkInfo.rpc],
                blockExplorerUrls: [selectedNetworkInfo.browser],
                iconUrls: [selectedNetworkInfo.logo],
              },
            ],
          })
          if (selectedNetworkInfo.chain_id === 321) {
            window.location.reload()
          }
        } catch (addError) {
          message.error(addError)
        }
      }
      // handle other "switch" errors
    }
  }

  // not connect
  if (!account) {
    return (
      <TransferButtonWrap>
        <BaseButton onClick={connect}>{t(`Connect your wallet`)}</BaseButton>
      </TransferButtonWrap>
    )
  }

  if (!bridgeStatus) {
    return (
      <TransferButtonWrap>
        <DisabledButton>{t(`KCC bridge under maintenance`)}</DisabledButton>
      </TransferButtonWrap>
    )
  }

  // not select pair
  if (pairId === -1) {
    return (
      <TransferButtonWrap>
        <DisabledButton>{t(`No Available Network`)}</DisabledButton>
      </TransferButtonWrap>
    )
  }

  // switch network
  if (!checkList.network && selectedNetworkInfo) {
    return (
      <TransferButtonWrap>
        <BaseButton onClick={switchNetwork}>
          {t(`Switch Network`)} {selectedNetworkInfo?.fullName}
        </BaseButton>
        <HistoryText onClick={() => history.push('/bridge/list')}>{t(`Transaction History`)}</HistoryText>
      </TransferButtonWrap>
    )
  }

  // not approve
  if (!checkList.approve) {
    return (
      <TransferButtonWrap>
        <BaseButton onClick={applyApprove}>{t(`Approved`)}</BaseButton>
        <HistoryText onClick={() => history.push('/bridge/list')}>{t(`Transaction History`)}</HistoryText>
      </TransferButtonWrap>
    )
  }

  if (!allStatus) {
    let key = ''
    if (amount === '' || !checkList.amount) {
      key = `Invalid number`
    } else if (!checkList.address) {
      key = `Invalid address`
    } else if (!checkList.senderWhite) {
      key = `Sender is not in whiteList`
    } else if (!checkList.receiverWhite) {
      key = `Receiver is not in whiteList`
    } else if (!checkList.senderBlack) {
      key = `Sender is in blackList`
    } else if (!checkList.receiverBlack) {
      key = `Receiver is in blackList`
    } else if (!checkList.totolSupply) {
      key = `Get bridge balance failed`
    } else if (!checkList.swapFee) {
      key = `Get transfer fee failed`
    } else if (!checkList.available) {
      key = `Get account available balance failed`
    } else {
      key = `Follow the tips`
    }

    return (
      <TransferButtonWrap>
        <DisabledButton>{t(`${key}`)}</DisabledButton>
        <HistoryText onClick={() => history.push('/bridge/list')}>{t(`Transaction History`)}</HistoryText>
      </TransferButtonWrap>
    )
  }

  // all check is pass
  return (
    <TransferButtonWrap>
      <BaseButton onClick={next}>{t(`Next`)}</BaseButton>
      <HistoryText onClick={() => history.push('/bridge/list')}>{t(`Transaction History`)}</HistoryText>
    </TransferButtonWrap>
  )
}

export default withRouter<any, any>(TransferButton)
