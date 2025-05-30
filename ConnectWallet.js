import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import globalContext from './../../context/global/globalContext';
import socketContext from '../../context/websocket/socketContext';
import { CS_FETCH_LOBBY_INFO } from '../../pokergame/actions';
import LoadingScreen from '../../components/loading/LoadingScreen';
import { ethers } from 'ethers';
import './ConnectWallet.scss';

const ConnectWallet = () => {
  const { setWalletAddress, setChipsAmount } = useContext(globalContext);
  const { socket } = useContext(socketContext);
  const navigate = useNavigate();
  const useQuery = () => new URLSearchParams(useLocation().search);
  let query = useQuery();

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If socket is connected, try to fetch game info from query params
    if (socket !== null && socket.connected === true) {
      const walletAddress = query.get('walletAddress');
      const gameId = query.get('gameId');
      const username = query.get('username');
      
      if (walletAddress && gameId && username) {
        console.log(username);
        setWalletAddress(walletAddress);
        socket.emit(CS_FETCH_LOBBY_INFO, { walletAddress, socketId: socket.id, gameId, username });
        console.log(CS_FETCH_LOBBY_INFO, { walletAddress, socketId: socket.id, gameId, username });
        navigate('/play');
      }
    }
  }, [socket, query]);

  // Function to connect Ethereum wallet (Metamask)
  const connectEthereumWallet = async () => {
    setConnecting(true);
    setError('');
    
    if (window.ethereum) {
      try {
        // Request wallet connection
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Create provider and signer using ethers.js
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Get the connected wallet address
        const walletAddress = await signer.getAddress();
        console.log('Connected wallet address:', walletAddress);

        // Update global context with the wallet address
        setWalletAddress(walletAddress);

        // Sign the test message
        const message = 'This is a test';
        const signature = await signer.signMessage(message);
        console.log('Signed message:', signature);

        // Emit event with wallet address and signed message
        socket.emit(CS_FETCH_LOBBY_INFO, { walletAddress, socketId: socket.id, gameId: query.get('gameId'), username: query.get('username') });
        
        // Navigate to the game page after successful connection
        navigate('/play');
      } catch (err) {
        console.error('Error connecting wallet:', err);
        setError('Failed to connect wallet. Please try again.');
      } finally {
        setConnecting(false);
      }
    } else {
      Swal.fire('Error', 'Please install Metamask!', 'error');
      setConnecting(false);
    }
  };

  return (
    <div className="connect-wallet-area">
      <LoadingScreen />
      <div className="connect-wallet-container">
        {/* Display a loading state if the wallet is connecting */}
        {connecting && <div className="loading">Connecting to wallet...</div>}
        
        {/* Display error if there's an issue connecting */}
        {error && <div className="error">{error}</div>}
        
        {/* Connect wallet button */}
        <button onClick={connectEthereumWallet} className="connect-wallet-button">
          Connect Ethereum Wallet
        </button>
      </div>
    </div>
  );
};

export default ConnectWallet;
