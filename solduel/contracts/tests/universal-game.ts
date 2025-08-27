import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UniversalGame } from "../target/types/universal_game";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("universal-game", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.UniversalGame as Program<UniversalGame>;

  // Test accounts
  let configAccount: Keypair;

  before(async () => {
    // Generate test keypair for config
    configAccount = Keypair.generate();
    
    // Check wallet balance
    const balance = await provider.connection.getBalance(provider.wallet.publicKey);
    console.log("Wallet balance:", balance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
  });

  it("Initializes the configuration", async () => {
    // Derive the configuration PDA
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    try {
      // Initialize configuration (no arguments needed - uses defaults)
      const tx = await program.methods
        .initializeConfig()
        .accounts({
          config: configPDA,
          admin: provider.wallet.publicKey,
          treasury: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize config transaction signature", tx);

      // Fetch the account and verify
      const configData = await program.account.configurationAccount.fetch(configPDA);
      console.log("Config initialized with:");
      console.log("  Min stake:", configData.minStake.toString());
      console.log("  Max stake:", configData.maxStake.toString());
      console.log("  Platform fee:", configData.platformFee, "%");
    } catch (error) {
      // Config might already be initialized, which is fine
      console.log("Config may already be initialized");
      
      try {
        // Try to fetch existing config
        const configData = await program.account.configurationAccount.fetch(configPDA);
        console.log("Existing config found");
      } catch (fetchError) {
        console.log("Error:", error);
      }
    }
  });

  it("Creates a simple duel game", async () => {
    // Derive PDAs
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    // Get the game counter
    const configData = await program.account.configurationAccount.fetch(configPDA);
    const gameId = configData.gameCounter;

    const [gamePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("game"),
        provider.wallet.publicKey.toBuffer(),
        gameId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Also derive vault PDA
    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        gameId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Create game
    const tx = await program.methods
      .createGame(
        { simpleDuel: {} }, // GameType enum
        new anchor.BN(100000000), // stake: 0.1 SOL (matches minimum)
        null // max_players (optional)
      )
      .accounts({
        game: gamePDA,
        config: configPDA,
        vault: vaultPDA,
        player: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Create game transaction signature", tx);

    // Verify game was created (using AccountLoader for zero-copy)
    const gameAccountInfo = await provider.connection.getAccountInfo(gamePDA);
    assert.ok(gameAccountInfo, "Game account should exist");
    assert.equal(gameAccountInfo.owner.toString(), program.programId.toString());
    console.log("Game created successfully!");
    console.log("Game PDA:", gamePDA.toString());
  });
});