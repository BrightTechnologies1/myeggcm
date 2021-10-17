import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import * as anchor from "@project-serum/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";
import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";

// css imports
import "./css/linearicons.css";
import "./css/font-awesome.min.css";
import "./css/bootstrap.css";
import "./css/magnific-popup.css";
import "./css/nice-select.css";
import "./css/animate.min.css";
import "./css/main.css";

// correction css
import "./css/cssedit/connectButton.css";
import "./css/cssedit/bannerup.css";

// images 
import logo from "./images/logo.jpg";
import bright from "./images/Bright.jpg";
import boycope from "./images/Boycope.jpg";
import kizzy from "./images/Kizzy.jpg";
import ZH_Architect_Founder from "./images/ZH_Architect_Founder.jpg";

const ConnectButton = styled(WalletDialogButton)``;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = styled(Button)``; // add your styles here

export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const refreshCandyMachineState = () => {
    (async () => {
      if (!wallet) return;

      const {
        candyMachine,
        goLiveDate,
        itemsAvailable,
        itemsRemaining,
        itemsRedeemed,
      } = await getCandyMachineState(
        wallet as anchor.Wallet,
        props.candyMachineId,
        props.connection
      );

      setItemsAvailable(itemsAvailable);
      setItemsRemaining(itemsRemaining);
      setItemsRedeemed(itemsRedeemed);

      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  };

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet && candyMachine?.program) {
        const mintTxId = await mintOneToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          props.txTimeout,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
      refreshCandyMachineState();
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(refreshCandyMachineState, [
    wallet,
    props.candyMachineId,
    props.connection,
  ]);

  
  return (

    <>
    <header id="header">
		    <div className="container main-menu">
		    	<div className="row align-items-center justify-content-between d-flex">
			      <div className="logo">
			        <a href="index.html"><img src={logo} alt="" title="" width="40px" /></a>
			      </div>
			      <nav className="nav-menu-container">
			        <ul className="nav-menu scroll-js">
			          <li className="active"><a href="#header">Home</a></li>
			          <li><a href="#roadmap">Roadmap</a></li>
			          <li><a href="#faqs">Faq's</a></li>
			          <li><a href="#team">Team</a></li>
			        </ul>
			      </nav>  		
		    	</div>
		    </div>
		  </header>
      
    <main className="mintArea" >
      {wallet && (
        <p>Wallet {shortenAddress(wallet.publicKey.toBase58() || "")}</p>
      )}

      {wallet && <p>Balance: {(balance || 0).toLocaleString()} SOL</p>}

      {wallet && <p>Total Available: {itemsAvailable}</p>}

      {wallet && <p>Redeemed: {itemsRedeemed}</p>}

      {wallet && <p>Remaining: {itemsRemaining}</p>}

      <MintContainer>
        {!wallet ? ( <>
            <ConnectButton className="connectButton" >Connect Wallet</ConnectButton>
          </>
        ) : (
          <MintButton
            disabled={isSoldOut || isMinting || !isActive}
            onClick={onMint}
            variant="contained"
            className="connectButton"
          >
            {isSoldOut ? (
              "SOLD OUT"
            ) : isActive ? (
              isMinting ? (
                <CircularProgress />
              ) : (
                "MINT EGG"
              )
            ) : (
              <Countdown
                date={startDate}
                onMount={({ completed }) => completed && setIsActive(true)}
                onComplete={() => setIsActive(true)}
                renderer={renderCounter}
              />
            )}
          </MintButton>
        )}
      </MintContainer>

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
          <Alert
            onClose={() => setAlertState({ ...alertState, open: false })}
            severity={alertState.severity}
          >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>

    <section className="banner-area bannerup">
				<div className="container">
					<div className="row fullscreen align-items-center justify-content-between">
						<div className="col-lg-12 banner text-center">
							<h1>MyEggs NFT</h1>
              {/*ADD A STYLE HERER WIDGH 70% */}
							<p> 
								MyEggs are unique digital collectible assets hatching  on Solana block-chain. Each egg has unique expressions and characteristics which builds up rarity.
							</p>
							<a href="https://discord.gg/Bhbcvhvhsf" className="primary-btn text-uppercase">DISCORD</a>
							<a href="https://twitter.com/MyEggsNFT/" className="primary-btn text-uppercase">TWITTER</a>
						</div>
					</div>
				</div>					
			</section>

      <section id="roadmap" className="timeline pb-120">
				<div className="text-center">
					<div className="menu-content pb-70">
						<div className="title text-center">
							<h1 className="mb-10 pt-40">ROADMAP</h1>
						</div>
					</div>
				</div>				
				<ul>
					<li>
						<div className="content">
						<h4>
							<time>Stage 1</time>
						</h4>
						<p><b>The concept of 10,000 MyEggs starts to emerge. The founders bring together a team of a talented artist and developers to make this project alive.</b></p>
						</div>
					</li>
					<li>
						<div className="content">
						<h4>
							<time>Stage 2</time>
						</h4>
						<p><b>Release 10,000 MyEgg's on the Solana blockchain.</b></p>
						</div>
					</li>
					<li>
						<div className="content">
						<h4>
							<time>Stage 3</time>
						</h4>
						<p><b>List on all major marketplaces after launch such as DigitalEyes, Solsea.io or Solanart.io.</b></p>
						</div>
					</li>
					<li>
						<div className="content">
						<h4>
							<time>Stage 4</time>
						</h4>
						<p><b>50% of all royalties from trading fees will be sent back to holders on a weekly basis.</b></p>
						</div>
					</li>
					<li>
						<div className="content">
						<h4>
							<time>Stage 5</time>
						</h4>
						<p><b>25% of all royalties from trading fees will be sent to a mutual wallet. MyEgg's holders will be able to vote to choose how to spend those funds.</b></p>
						</div>
					</li>
					<li>
						<div className="content">
						<h4>
							<time>Stage 6</time>
						</h4>
						<p><b>8 MyEgg's holders will choose to either go on a crazy adventure trip to anywhere the community decides or to receive $10K.</b></p>
						</div>
					</li>
					<li>
						<div className="content">
						<h4>
							<time>Stage 7</time>
						</h4>
						<p><b>MyEgg's Hatch-lings are coming! Free airdrop for the community. 1 MyEgg's = 1 Hatch-ling coming to your wallet. The more MyEgg's you hold, the more Hatch-lings you'll get!</b></p>
						</div>
					</li>
					<li>
						<div className="content">
						<h4>
							<time>Stage 8</time>
						</h4>
						<p><b>All community members holding their Eggs will automatically be whitelisted for future sales.</b></p>
						</div>
					</li>
				</ul>
			</section>	

      <section id="faqs" className="faqs pb-120">
				<div className="text-center">
					<div className="menu-content pb-70">
						<div className="title text-center">
							<h1 className="mb-10 pt-40">FAQs</h1>
						</div>
					</div>
				</div>
				<div className="faq-v row pl-30 pr-30">
					<div className="accordion">
						<div className="accordion-item pb-20">
						  <a>When's the drop?</a>
							<p>TBA.</p>
						</div>
						<div className="accordion-item pb-20">
						  <a>Is MyEggs a generative art project?</a>
							<p>Yes, formulating in an NFT Collectors game.</p>
						</div>
						<div className="accordion-item pb-20">
						  <a>What do I get when I buy a MyEggs NFT?</a>
							<p>Think of our NFT’s as keys or memberships to our universe. As a member of this universe, you will get access to community rewards and drops, ETH giveaways, exclusive NFT content, beta access to our game, and more.</p>
						</div>
						<div className="accordion-item pb-20">
						  <a>Is MyEggs a game or a community?</a>
							<p>It’s both. By owning a MyEggs NFT you get early bird perks!</p>
						</div>
					  </div>
				</div>
			</section>

      <section id="team" className="services-area section-gap">
				<div className="container">
		            <div className="row d-flex justify-content-center">
		                <div className="menu-content  col-lg-12">
		                    <div className="title text-center">
								<h1 className="mb-40">TEAM</h1>		                        
							</div>
							<div className="line"> </div>
		                </div>
		            </div>
					<div className="row justify-content-center">
						<div className="col-lg-3 col-md-6 mb-20">
							<div className="single-services">
								<img src={bright} alt="" />
							</div>	
							<div className="text-center pt-20">
								<h4>
									<time>Bright</time>
								</h4>
								<p><b>Developer</b></p>
							</div>
						</div>
						<div className="col-lg-3 col-md-6 mb-20">
							<div className="single-services">
								<img src={boycope} alt="" />
							</div>
							<div className="text-center pt-20">
								<h4>
									<time>Boycope</time>
								</h4>
								<p><b>Artist</b></p>
							</div>	
						</div>
						<div className="col-lg-3 col-md-6 mb-20">
							<div className="single-services">
								<img src={kizzy} alt="" />
							</div>
							<div className="text-center pt-20">
								<h4>
									<time>Kizzy</time>
								</h4>
								<p><b>Artist</b></p>
							</div>
						</div>
						<div className="col-lg-3 col-md-6 mb-20">
							<div className="single-services">
              <img src={ZH_Architect_Founder} alt="" />
							</div>	
							<div className="text-center pt-20">
								<h4>
									<time>ZH_Architect</time>
								</h4>
								<p><b>Founder</b></p>
							</div>			
						</div>														
					</div>
				</div>	
			</section>

      <footer className="footer-area section-gap">
        <div className="container widget">
            <div className="row col-12">
              <div className="col-lg-6 col-md-12 col-sm-12">
                  <div className="single-footer-widget align-items-center">                               
                      <p className="footer-text">
                          Copyright &copy; 2021 All rights reserved | MyEggs 
                          <i className="fa fa-heart-o" aria-hidden="true"></i>
                      </p>
                  </div>
              </div>

						  <div className="col-lg-6 col-md-6 col-sm-6 social-widget">
						    <div className="single-footer-widget row">
							      <div className="footer-social d-flex align-items-center col-sm-12">
								        <a href="3"><i className="fa fa-twitter"></i></a>
								        <a href="4"><i className="fa fa-behance"></i></a>
							        </div>
						      </div>
					    </div>
           </div>		
        </div>
      </footer>
    </>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {hours + (days || 0) * 24} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default Home;
