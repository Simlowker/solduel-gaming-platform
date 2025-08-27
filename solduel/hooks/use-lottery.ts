import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import SolDuelSDK from '../lib/solduel-sdk';
import { useConnection } from '@solana/wallet-adapter-react';

export function useLottery() {
  const { wallet } = useWallet();
  const { connection } = useConnection();
  const [sdk, setSdk] = useState<SolDuelSDK | null>(null);

  const [currentRound, setCurrentRound] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [prizePool, setPrizePool] = useState<number>(0);
  const [myTickets, setMyTickets] = useState<number>(0);

  useEffect(() => {
    if (wallet) {
      const sdkInstance = new SolDuelSDK(connection, wallet);
      setSdk(sdkInstance);
    }
  }, [wallet, connection]);

  useEffect(() => {
    if (sdk) {
      sdk.getCurrentLotteryRound().then(setCurrentRound);
      // Mock data for now
      setPrizePool(145.2);
      setTimeRemaining(3600);
    }
  }, [sdk]);

  const buyTickets = async (amount: number, numberOfTickets: number) => {
    if (sdk) {
      await sdk.buyLotteryTickets(amount, numberOfTickets);
      // Optimistic update
      // This should be replaced with real data from the chain
      setMyTickets(myTickets + numberOfTickets);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  return {
    currentRound,
    participants,
    timeRemaining,
    prizePool,
    buyTickets,
    myTickets,
  };
}
