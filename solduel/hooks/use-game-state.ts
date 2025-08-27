import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import SolDuelSDK from '../lib/solduel-sdk';
import { useConnection } from '@solana/wallet-adapter-react';

export function useGameState(gameId: string) {
  const { wallet } = useWallet();
  const { connection } = useConnection();
  const [sdk, setSdk] = useState<SolDuelSDK | null>(null);

  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (wallet) {
      const sdkInstance = new SolDuelSDK(connection, wallet);
      setSdk(sdkInstance);
    }
  }, [wallet, connection]);

  useEffect(() => {
    if (sdk && gameId) {
      setLoading(true);
      sdk.getGameState(gameId)
        .then(state => {
          setGameState(state);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });

      // TODO: Add subscription to game state changes
    }
  }, [sdk, gameId]);

  return { gameState, loading, error };
}
