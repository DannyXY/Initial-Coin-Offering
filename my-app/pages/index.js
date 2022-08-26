import Head from "next/head";
import * as ethers from "ethers";
import Web3Modal from "web3modal";
import { useEffect, useState, useRef } from "react";
import styles from "../styles/Home.module.css";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export default function Home() {
  const zero = ethers.BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [tokensMinted, setTokensMinted] = useState(zero);
  const [loading, setLoading] = useState(false);
  const [balanceOf0xWagmiTokens, setBalanceOf0xWagmiTokens] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const Web3ModalRef = useRef();

  async function getBalanceOfCryptoDevTokens() {
    try {
      const provider = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOf0xWagmiTokens(balance);
    } catch (error) {
      console.error(error);
    }
  }

  async function getTokensToBeClaimed() {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();

      const balance = await nftContract.balanceOf(address);
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        var amount = 0;

        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount += 1;
          }
        }
        setTokensToBeClaimed(ethers.BigNumber.from(amount));
      }
    } catch (error) {
      console.log(error);
      setTokensToBeClaimed(zero);
    }
  }

  async function getTotalTokensMinted() {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (error) {
      console.error(error);
    }
  }

  async function mintCryptoDevToken(amount) {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const value = 0.001 * amount;

      const tx = await tokenContract.mint(amount, {
        value: ethers.utils.parseEther(value.toString()),
      });
      await tx.wait();
      window.alert(`Success, You've minted ${amount.toString()} 0xW Token`);
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
    setLoading(false);
  }

  async function getProviderOrSigner(needSigner = false) {
    const provider = await Web3ModalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change Network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  async function connectWallet() {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
      setWalletConnected(false);
    }
  }

  async function claim0xWTokens() {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      await tx.wait();
      window.alert("You have successfully claimed your 0xW tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
    setLoading(false);
  }

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claim0xWTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            onChange={(e) => {
              setTokenAmount(ethers.BigNumber.from(e.target.value));
            }}
          />
          <button
            className={styles.button}
            disabled={!(tokenAmount > 0)}
            onClick={() => mintCryptoDevToken(tokenAmount)}
          >
            Mint Token
          </button>
        </div>
      </div>
    );
  };

  async function onPageLoad() {
    await connectWallet();
    await getBalanceOfCryptoDevTokens();
    await getTotalTokensMinted();
    await getTokensToBeClaimed();
  }

  useEffect(() => {
    if (!walletConnected) {
      Web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      onPageLoad();
    }
  }, [walletConnected]);
  return (
    <div>
      <Head>
        <title>Crypto Devs ICO</title>
        <meta name="description" content="ICO-dApp" />
        <link rel="icon" href="./favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO</h1>
          <div className={styles.description}>
            You can claim or mint your 0xWagmi Tokens Here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                Overall {ethers.utils.formatEther(tokensMinted)}/10,000 0xW has
                been minted
              </div>
              <div className={styles.description}>
                You have minted{" "}
                {ethers.utils.formatEther(balanceOf0xWagmiTokens)} of your
                0xWagmi tokens
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your Wallet
            </button>
          )}
        </div>
        <div>
          <img src="./0.png" className={styles.image} />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
