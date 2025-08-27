#!/usr/bin/env ts-node

/**
 * Script to initialize the configuration account for the SolDuel program
 * Run this once after deploying the program to devnet
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import UniversalGameIDL from '../idl/universal_game.json';
import fs from 'fs';
import os from 'os';

const PROGRAM_ID = new PublicKey('BELsmsp7jdUSUJDfcsLXP8HSdJsaAtbSBSJ95gRUbTyg');

async function main() {
  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load the admin wallet
  const walletPath = `${os.homedir()}/.config/solana/devnet-keypair.json`;
  const walletData = fs.readFileSync(walletPath, 'utf-8');
  const walletKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(walletData)));
  
  // Create provider
  const wallet = {
    publicKey: walletKeypair.publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  
  const provider = new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions());
  
  // Create program interface
  const program = new Program(UniversalGameIDL as any, PROGRAM_ID, provider);
  
  // Derive config PDA
  const [configPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    program.programId
  );
  
  console.log('Program ID:', PROGRAM_ID.toString());
  console.log('Config PDA:', configPDA.toString());
  console.log('Admin:', walletKeypair.publicKey.toString());
  
  try {
    // Check if config already exists
    const configAccount = await program.account.configurationAccount.fetch(configPDA);
    console.log('Config already initialized:', configAccount);
    return;
  } catch (error) {
    console.log('Config not found, initializing...');
  }
  
  // Use admin wallet as treasury for simplicity (you can change this)
  const treasury = walletKeypair.publicKey;
  
  try {
    // Initialize config
    const tx = await program.methods
      .initializeConfig()
      .accounts({
        config: configPDA,
        admin: walletKeypair.publicKey,
        treasury: treasury,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([walletKeypair])
      .rpc();
    
    console.log('Config initialized successfully!');
    console.log('Transaction signature:', tx);
    
    // Fetch and display the config
    const configAccount = await program.account.configurationAccount.fetch(configPDA);
    console.log('\nConfiguration:');
    console.log('- Admin:', configAccount.admin.toString());
    console.log('- Treasury:', configAccount.treasury.toString());
    console.log('- Min Stake:', configAccount.minStake.toNumber() / 1e9, 'SOL');
    console.log('- Max Stake:', configAccount.maxStake.toNumber() / 1e9, 'SOL');
    console.log('- Platform Fee:', configAccount.platformFee, '%');
    console.log('- Timeout:', configAccount.timeout.toNumber(), 'seconds');
    
  } catch (error) {
    console.error('Error initializing config:', error);
  }
}

main().catch(console.error);