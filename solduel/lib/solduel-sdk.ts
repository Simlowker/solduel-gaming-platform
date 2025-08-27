import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import UniversalGameIDL from '../idl/universal_game.json';
import * as crypto from 'crypto';

// Program ID for the universal game contract (deployed on devnet)
const UNIVERSAL_GAME_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'Cg8sF2yCkfStCqCViq676zXzRBqr7XRmyJtvLweNAh9x'
);

// Game Types
export enum GameType {
  SimpleDuel = 'SimpleDuel',
  MultiRound = 'MultiRound',
  Lottery = 'Lottery'
}

// Game States
export enum GameState {
  Waiting = 'Waiting',
  Active = 'Active',
  Resolving = 'Resolving',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

// Game Moves
export enum GameMove {
  None = 'None',
  Rock = 'Rock',
  Paper = 'Paper',
  Scissors = 'Scissors',
  Heads = 'Heads',
  Tails = 'Tails'
}

// Betting Actions
export enum BetAction {
  Check = 'Check',
  Call = 'Call',
  Raise = 'Raise',
  Fold = 'Fold'
}

// Strategic Actions for multi-round duels
export enum StrategicAction {
  Check = 'Check',
  Call = 'Call',
  Raise = 'Raise',
  Fold = 'Fold'
}

// Duel State for strategic games
export enum DuelState {
  WaitingForPlayer2 = 'WaitingForPlayer2',
  InProgress = 'InProgress',
  Resolving = 'Resolving',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

// Game interface
export interface Game {
  gameId: string;
  gameType: GameType;
  state: GameState;
  creator: PublicKey;
  players: PublicKey[];
  stakes: number[];
  potTotal: number;
  currentRound: number;
  maxRounds: number;
  winner?: PublicKey;
  startTime: Date;
  endTime?: Date;
  entryFee: number;
}

// Player stats interface
export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalStaked: number;
  totalWon: number;
  winStreak: number;
  bestStreak: number;
}

export class SolDuelSDK {
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program;
  private playerWallet: PublicKey;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    this.program = new Program(
      UniversalGameIDL as any,
      UNIVERSAL_GAME_PROGRAM_ID,
      this.provider
    );
    this.playerWallet = wallet.publicKey;
  }

  // ===== ADMIN FUNCTIONS =====

  async initializeConfig(treasury: PublicKey): Promise<string> {
    const [configPDA] = this.getConfigPDA();
    
    const tx = await this.program.methods
      .initializeConfig()
      .accounts({
        config: configPDA,
        admin: this.playerWallet,
        treasury,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  }

  async updateConfig(params: {
    minStake?: number;
    maxStake?: number;
    platformFee?: number;
    timeout?: number;
  }): Promise<string> {
    const [configPDA] = this.getConfigPDA();
    
    const tx = await this.program.methods
      .updateConfig(
        params.minStake ? new BN(params.minStake * LAMPORTS_PER_SOL) : null,
        params.maxStake ? new BN(params.maxStake * LAMPORTS_PER_SOL) : null,
        params.platformFee || null,
        params.timeout ? new BN(params.timeout) : null
      )
      .accounts({
        config: configPDA,
        admin: this.playerWallet,
      })
      .rpc();
    
    return tx;
  }

  // ===== GAME LIFECYCLE =====

  async createGame(
    gameType: GameType,
    stakeAmount: number,
    maxPlayers?: number
  ): Promise<{ gameId: string; tx: string }> {
    const [configPDA] = this.getConfigPDA();
    const config = await this.program.account.configurationAccount.fetch(configPDA);
    const gameId = config.gameCounter;
    
    const [gamePDA] = this.getGamePDA(gameId, this.playerWallet);
    const [vaultPDA] = this.getVaultPDA(gameId);
    
    const gameTypeAnchor = this.mapGameType(gameType);
    const stakeAmountBN = new BN(stakeAmount * LAMPORTS_PER_SOL);
    
    const tx = await this.program.methods
      .createGame(gameTypeAnchor, stakeAmountBN, maxPlayers || null)
      .accounts({
        game: gamePDA,
        config: configPDA,
        vault: vaultPDA,
        player: this.playerWallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return { gameId: gameId.toString(), tx };
  }

  async joinGame(gameId: string): Promise<string> {
    const gameIdBN = new BN(gameId);
    const game = await this.getGame(gameId);
    
    if (!game) throw new Error('Game not found');
    
    const [gamePDA] = this.getGamePDA(gameIdBN, game.creator);
    const [vaultPDA] = this.getVaultPDA(gameIdBN);
    
    const tx = await this.program.methods
      .joinGame()
      .accounts({
        game: gamePDA,
        vault: vaultPDA,
        player: this.playerWallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  }

  async cancelGame(gameId: string): Promise<string> {
    const gameIdBN = new BN(gameId);
    const game = await this.getGame(gameId);
    
    if (!game) throw new Error('Game not found');
    
    const [gamePDA] = this.getGamePDA(gameIdBN, game.creator);
    
    const tx = await this.program.methods
      .cancelGame()
      .accounts({
        game: gamePDA,
        player: this.playerWallet,
      })
      .rpc();
    
    return tx;
  }

  // ===== SIMPLE DUEL FUNCTIONS =====

  async commitMove(
    gameId: string,
    move: GameMove
  ): Promise<{ tx: string; nonce: string }> {
    const gameIdBN = new BN(gameId);
    const game = await this.getGame(gameId);
    
    if (!game) throw new Error('Game not found');
    
    const [gamePDA] = this.getGamePDA(gameIdBN, game.creator);
    
    // Generate nonce and hash
    const nonce = crypto.randomBytes(32);
    const moveBytes = Buffer.from([this.getMoveIndex(move)]);
    const dataToHash = Buffer.concat([moveBytes, nonce]);
    const moveHash = crypto.createHash('sha256').update(dataToHash).digest();
    
    const tx = await this.program.methods
      .commitMove(Array.from(moveHash))
      .accounts({
        game: gamePDA,
        player: this.playerWallet,
      })
      .rpc();
    
    return { tx, nonce: nonce.toString('hex') };
  }

  async revealMove(
    gameId: string,
    move: GameMove,
    nonce: string
  ): Promise<string> {
    const gameIdBN = new BN(gameId);
    const game = await this.getGame(gameId);
    
    if (!game) throw new Error('Game not found');
    
    const [gamePDA] = this.getGamePDA(gameIdBN, game.creator);
    const nonceBuffer = Buffer.from(nonce, 'hex');
    const moveAnchor = this.mapGameMove(move);
    
    const tx = await this.program.methods
      .revealMove(moveAnchor, Array.from(nonceBuffer))
      .accounts({
        game: gamePDA,
        player: this.playerWallet,
      })
      .rpc();
    
    return tx;
  }

  // ===== STRATEGIC DUEL FUNCTIONS =====
  
  async createStrategicDuel(stakeAmount: number): Promise<{ duelId: string; tx: string }> {
    // Create a multi-round game for strategic duels
    return this.createGame(GameType.MultiRound, stakeAmount, 2);
  }

  async getDuelState(duelId: string): Promise<any> {
    const game = await this.getGame(duelId);
    if (!game) return null;
    
    // Map game state to duel state
    let state = DuelState.Cancelled;
    if (game.state === GameState.Waiting) {
      state = DuelState.WaitingForPlayer2;
    } else if (game.state === GameState.Active) {
      state = DuelState.InProgress;
    } else if (game.state === GameState.Resolving) {
      state = DuelState.Resolving;
    } else if (game.state === GameState.Completed) {
      state = DuelState.Completed;
    }
    
    return {
      duelId: game.gameId,
      state,
      players: game.players,
      stakes: game.stakes,
      potTotal: game.potTotal,
      currentRound: game.currentRound,
      winner: game.winner,
      startTime: game.startTime,
      endTime: game.endTime
    };
  }

  async submitAction(
    duelId: string, 
    action: StrategicAction, 
    raiseAmount?: number
  ): Promise<string> {
    // Map strategic action to bet action
    const betAction = action as unknown as BetAction;
    return this.placeBet(duelId, betAction, raiseAmount);
  }

  // ===== MULTI-ROUND FUNCTIONS =====

  async placeBet(
    gameId: string,
    action: BetAction,
    raiseAmount?: number
  ): Promise<string> {
    const gameIdBN = new BN(gameId);
    const game = await this.getGame(gameId);
    
    if (!game) throw new Error('Game not found');
    
    const [gamePDA] = this.getGamePDA(gameIdBN, game.creator);
    const [vaultPDA] = this.getVaultPDA(gameIdBN);
    
    let actionAnchor: any;
    if (action === BetAction.Raise && raiseAmount) {
      actionAnchor = { raise: new BN(raiseAmount * LAMPORTS_PER_SOL) };
    } else {
      actionAnchor = this.mapBetAction(action);
    }
    
    const tx = await this.program.methods
      .placeBet(actionAnchor)
      .accounts({
        game: gamePDA,
        vault: vaultPDA,
        player: this.playerWallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  }

  // ===== LOTTERY FUNCTIONS =====

  async enterLottery(gameId: string, numTickets: number): Promise<string> {
    const gameIdBN = new BN(gameId);
    const game = await this.getGame(gameId);
    
    if (!game) throw new Error('Game not found');
    
    const [gamePDA] = this.getGamePDA(gameIdBN, game.creator);
    const [vaultPDA] = this.getVaultPDA(gameIdBN);
    
    const tx = await this.program.methods
      .enterLottery(numTickets)
      .accounts({
        game: gamePDA,
        vault: vaultPDA,
        player: this.playerWallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  }

  async drawLottery(gameId: string): Promise<string> {
    const gameIdBN = new BN(gameId);
    const game = await this.getGame(gameId);
    
    if (!game) throw new Error('Game not found');
    
    const [gamePDA] = this.getGamePDA(gameIdBN, game.creator);
    
    const tx = await this.program.methods
      .drawLottery()
      .accounts({
        game: gamePDA,
        player: this.playerWallet,
      })
      .rpc();
    
    return tx;
  }

  // ===== CLAIMING & RESOLUTION =====

  async claimWinnings(gameId: string): Promise<string> {
    const gameIdBN = new BN(gameId);
    const game = await this.getGame(gameId);
    
    if (!game) throw new Error('Game not found');
    
    const [gamePDA] = this.getGamePDA(gameIdBN, game.creator);
    const [configPDA] = this.getConfigPDA();
    const [vaultPDA] = this.getVaultPDA(gameIdBN);
    
    const config = await this.program.account.configurationAccount.fetch(configPDA);
    
    const tx = await this.program.methods
      .claimWinnings()
      .accounts({
        game: gamePDA,
        config: configPDA,
        vault: vaultPDA,
        treasury: config.treasury,
        player: this.playerWallet,
      })
      .rpc();
    
    return tx;
  }

  async resolveGame(gameId: string): Promise<string> {
    const gameIdBN = new BN(gameId);
    const game = await this.getGame(gameId);
    
    if (!game) throw new Error('Game not found');
    
    const [gamePDA] = this.getGamePDA(gameIdBN, game.creator);
    
    const tx = await this.program.methods
      .resolveGame()
      .accounts({
        game: gamePDA,
        player: this.playerWallet,
      })
      .rpc();
    
    return tx;
  }

  // ===== QUERY FUNCTIONS =====

  async getGame(gameId: string): Promise<Game | null> {
    try {
      // Find the game by searching through all games
      const games = await this.program.account.gameAccountOptimized.all();
      const gameIdBN = new BN(gameId);
      
      const gameAccount = games.find(g => 
        g.account.gameId.eq(gameIdBN)
      );
      
      if (!gameAccount) return null;
      
      return this.parseGameAccount(gameAccount.account);
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }

  async getActiveGames(): Promise<Game[]> {
    try {
      const games = await this.program.account.gameAccountOptimized.all();
      return games
        .map(g => this.parseGameAccount(g.account))
        .filter(g => g.state === GameState.Active || g.state === GameState.Waiting);
    } catch (error) {
      console.error('Error fetching active games:', error);
      return [];
    }
  }

  async getPlayerStats(playerPubkey?: PublicKey): Promise<PlayerStats | null> {
    const player = playerPubkey || this.playerWallet;
    const [playerPDA] = this.getPlayerPDA(player);
    
    try {
      const account = await this.program.account.playerAccount.fetch(playerPDA);
      return {
        gamesPlayed: account.gamesPlayed,
        wins: account.wins,
        losses: account.losses,
        draws: account.draws,
        totalStaked: account.totalStaked.toNumber() / LAMPORTS_PER_SOL,
        totalWon: account.totalWon.toNumber() / LAMPORTS_PER_SOL,
        winStreak: account.winStreak,
        bestStreak: account.bestStreak,
      };
    } catch (error) {
      // Player account might not exist yet
      return null;
    }
  }

  // ===== HELPER FUNCTIONS =====

  private getConfigPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      this.program.programId
    );
  }

  private getGamePDA(gameId: BN, creator: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('game'),
        creator.toBuffer(),
        gameId.toArrayLike(Buffer, 'le', 8)
      ],
      this.program.programId
    );
  }

  private getVaultPDA(gameId: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('vault'),
        gameId.toArrayLike(Buffer, 'le', 8)
      ],
      this.program.programId
    );
  }

  private getPlayerPDA(player: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('player'), player.toBuffer()],
      this.program.programId
    );
  }

  private parseGameAccount(account: any): Game {
    // Unpack game type from packed byte (lower 4 bits)
    const gameTypeBits = account.gameTypeAndState & 0x0F;
    const gameType = gameTypeBits === 0 ? GameType.SimpleDuel : 
                     gameTypeBits === 1 ? GameType.MultiRound : 
                     GameType.Lottery;
    
    // Unpack game state from packed byte (upper 4 bits)
    const stateBits = (account.gameTypeAndState >> 4) & 0x0F;
    const state = stateBits === 0 ? GameState.Waiting :
                  stateBits === 1 ? GameState.Active :
                  stateBits === 2 ? GameState.Resolving :
                  stateBits === 3 ? GameState.Completed :
                  GameState.Cancelled;
    
    // Unpack rounds (lower 4 bits: current, upper 4 bits: max)
    const currentRound = account.rounds & 0x0F;
    const maxRounds = (account.rounds >> 4) & 0x0F;
    
    // Unpack timestamps (lower 32 bits: start_time, upper 32 bits: last_action_time)
    const startTime = Number(account.timestamps & BigInt(0xFFFFFFFF));
    const lastActionTime = Number((account.timestamps >> BigInt(32)) & BigInt(0xFFFFFFFF));
    
    // Filter active players and stakes based on player_count
    const activePlayers = account.players.slice(0, account.playerCount).filter((p: PublicKey) => !p.equals(PublicKey.default()));
    const activeStakes = account.stakes.slice(0, account.playerCount);
    
    return {
      gameId: account.gameId.toString(),
      gameType,
      state,
      creator: account.creator,
      players: activePlayers,
      stakes: activeStakes.map((s: BN) => s.toNumber() / LAMPORTS_PER_SOL),
      potTotal: account.potTotal.toNumber() / LAMPORTS_PER_SOL,
      currentRound,
      maxRounds,
      winner: account.winner,
      startTime: new Date(startTime * 1000),
      endTime: lastActionTime > 0 && state === GameState.Completed ? new Date(lastActionTime * 1000) : undefined,
      entryFee: account.entryFee.toNumber() / LAMPORTS_PER_SOL,
    };
  }

  private mapGameType(type: GameType): any {
    const mapping = {
      [GameType.SimpleDuel]: { simpleDuel: {} },
      [GameType.MultiRound]: { multiRound: {} },
      [GameType.Lottery]: { lottery: {} },
    };
    return mapping[type];
  }

  private mapGameMove(move: GameMove): any {
    const mapping = {
      [GameMove.None]: { none: {} },
      [GameMove.Rock]: { rock: {} },
      [GameMove.Paper]: { paper: {} },
      [GameMove.Scissors]: { scissors: {} },
      [GameMove.Heads]: { heads: {} },
      [GameMove.Tails]: { tails: {} },
    };
    return mapping[move];
  }

  private mapBetAction(action: BetAction): any {
    const mapping = {
      [BetAction.Check]: { check: {} },
      [BetAction.Call]: { call: {} },
      [BetAction.Fold]: { fold: {} },
    };
    return mapping[action as keyof typeof mapping] || { check: {} };
  }

  private getMoveIndex(move: GameMove): number {
    const indices = {
      [GameMove.None]: 0,
      [GameMove.Rock]: 1,
      [GameMove.Paper]: 2,
      [GameMove.Scissors]: 3,
      [GameMove.Heads]: 4,
      [GameMove.Tails]: 5,
    };
    return indices[move] || 0;
  }
}

export default SolDuelSDK;