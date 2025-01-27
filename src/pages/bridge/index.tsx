import React, { lazy } from 'react'
import { Route, Switch, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { CSSTransition, SwitchTransition } from 'react-transition-group'
import { BridgeHistoryList, BridgeOrderDetail, BridgeTransfer, BridgeOrderConfirm } from '../../App'

import { useConnectWalletModalShow } from '../../state/wallet/hooks'
import WalletListModal from '../../components/WalletListModal'

import BridgeLoading from '../../components/BridgeLoading'
import { useBridgeLoading } from '../../state/application/hooks'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { updateBridgeLoading } from '../../state/application/actions'
import { BridgeService } from '../../api/bridge'
import { useWeb3React } from '@web3-react/core'
import { updatePairList } from '../../state/bridge/actions'
import { PairInfo } from '../../state/bridge/reducer'
import { ConnectorNames } from '../../constants/wallet'
import useAuth from '../../hooks/useAuth'
import { ChainIds } from '../../connectors'
import { updateErrorInfo } from '../../state/wallet/actions'

import '../../styles/transition.css'

export interface BridgePageProps {}

const TopBg = require('../../assets/images/bridge/top-bg.svg').default
const CenterBg = require('../../assets/images/bridge/center-bg@2x.png').default

const BridgeWrap = styled.div`
  position: relative;
  background: #000;
  color: #fff;
  min-height: calc(100vh - 200px);
  background: url(${TopBg}) center 80px no-repeat, #000;
`

const NavBg = styled.div`
  height: 80px;
  width: 100%;
  background: rgba(0, 0, 0, 1);
`

const Content = styled.div`
  position: relative;
  z-index: 2;
  padding-bottom: 80px;
`

const CenterBgImg = styled.img`
  position: absolute;
  width: 80%;
  top: 250px;
  left: 50%;
  z-index: 1;
  transform: translateX(-50%);
`

const ButtonBgImg = styled.img`
  position: absolute;
  width: 100%;
  heigth: 800px;
  bottom: 0;
  left: 0;
`

const LoadingBg = styled.div`
  margin: 200px auto;
  background: #fff;
  position: relative;
  width: 464px;
  height: 306px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
`

const Success = styled.div`
  margin-top: 120px;
  height: 36px;
  font-size: 24px;
  font-family: URWDIN-Medium, URWDIN;
  font-weight: 500;
  color: #000426;
  line-height: 36px;
  text-align: center;
`

const CloseIcon = styled.img`
  width: 24px;
  height: 24px;
  position: absolute;
  right: 16px;
  top: 16px;
  cursor: pointer;
`

const BridgePage: React.FunctionComponent<BridgePageProps> = ({ children }) => {
  const { t } = useTranslation()

  const { status, visible } = useBridgeLoading()

  const location = useLocation()

  const walletListModalShow = useConnectWalletModalShow()

  const [loading, setLoading] = React.useState<boolean>(false)

  const { active, account, chainId } = useWeb3React()

  const { login, logout } = useAuth()

  const dispatch = useDispatch()

  const handleChainChanged = () => {
    if (ChainIds.includes(chainId as any)) {
      dispatch(updateErrorInfo({ hasError: false, errorInfo: '' }))
    } else {
      dispatch(updateErrorInfo({ hasError: false, errorInfo: 'Unsupported Network' }))
    }
  }

  React.useEffect(() => {
    const { ethereum } = window
    if (ethereum) {
      ethereum.on('chainChanged', handleChainChanged)
    }
    return () => {
      if (!window.ethereum) return
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  // important, logout for refresh wallet data

  const getPairList = async () => {
    try {
      const res = await BridgeService.pairList()

      console.log(res.data.data)

      const list: PairInfo[] = []

      for (let i = 0; i < res.data.data.length; i++) {
        const chain: PairInfo = res.data.data[i]
        const status = chain.status
        if ((chain.status & 1) !== 1) {
          continue
        } else {
          chain.openStatus = true
          chain.limitStatus = (chain.status & 2) === 2 ? true : false
          chain.whiteListStatus = (chain.status & 4) === 4 ? true : false
          list.push({ ...chain })
        }
      }
      dispatch(updatePairList({ pairList: list }))
    } catch {
      console.log('get pairList error')
    }
  }

  const hideLoading = () => {
    dispatch(updateBridgeLoading({ visible: false, status: 0 }))
  }

  const autoLogin = () => {
    const { ethereum } = window
    if (ethereum && ethereum.on && active && !account) {
      login(ConnectorNames.Injected)
    }
  }

  React.useEffect(() => {
    const init = async () => {
      try {
        setLoading(() => true)
        await getPairList()
      } finally {
        setLoading(() => false)
      }
    }
    autoLogin()
    init()
  }, [])

  React.useEffect(() => {
    if (account) {
      hideLoading()
    }
  }, [account])

  React.useEffect(() => {
    console.log('chainId', chainId)
  }, [chainId])

  return (
    <BridgeWrap>
      <WalletListModal visible={walletListModalShow} />
      <NavBg />
      <Content>
        {visible || loading ? (
          <LoadingBg>
            <BridgeLoading status={status} />
            <CloseIcon src={require('../../assets/images/bridge/close@2x.png').default} onClick={hideLoading} />
            {loading ? (
              <Success>{t('Loading')}...</Success>
            ) : (
              <Success>{status !== 0 ? t(`SUCCESS`) + '!' : t('Waiting for confirmation')}</Success>
            )}
          </LoadingBg>
        ) : (
          <SwitchTransition mode="out-in">
            <CSSTransition
              key={location.pathname}
              classNames="fade"
              addEndListener={(node, done) => node.addEventListener('transitionend', done, false)}
            >
              <Switch>
                <Route path="/bridge/transfer" component={BridgeTransfer} />
                <Route path="/bridge/list" component={BridgeHistoryList} />
                <Route path="/bridge/detail" component={BridgeOrderDetail} />
                <Route path="/bridge/confirm" component={BridgeOrderConfirm} />
              </Switch>
            </CSSTransition>
          </SwitchTransition>
        )}
      </Content>

      <CenterBgImg src={CenterBg} />
      <ButtonBgImg src={require('../../assets/images/bridge/bottom-bg@2x.png').default} />
    </BridgeWrap>
  )
}

export default BridgePage
