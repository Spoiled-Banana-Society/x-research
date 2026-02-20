'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import {
  createPublicClient,
  encodeFunctionData,
  formatUnits,
  http,
  type Address,
  type Hex,
} from 'viem';
import { useAuth } from '@/hooks/useAuth';
import {
  BASE_SEPOLIA,
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_RPC_URL,
  BASE_SEPOLIA_USDC_ADDRESS,
  BBB4_ABI,
  BBB4_CONTRACT_ADDRESS,
  USDC_ABI,
} from '@/lib/contracts/bbb4';

type MintFn = (quantity: number) => Promise<Hex>;

interface UseMintDraftPassResult {
  mint: MintFn;
  isApproving: boolean;
  isMinting: boolean;
  error: string | null;
  txHash: Hex | null;
  tokenPrice: bigint | null;
  mintActive: boolean;
  totalMinted: bigint | null;
  userPassCount: bigint | null;
}

const USDC_DECIMALS = 6;

function normalizeMintError(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null
      ? (error as { shortMessage?: string; message?: string }).shortMessage ??
        (error as { message?: string }).message ??
        'Transaction failed'
      : 'Transaction failed';

  const lower = message.toLowerCase();

  if (lower.includes('user rejected') || lower.includes('rejected the request')) {
    return 'Transaction was rejected in your wallet.';
  }

  if (lower.includes('insufficient funds')) {
    return 'Insufficient ETH for gas fees.';
  }

  if (lower.includes('mint is not active')) {
    return 'Mint is not active.';
  }

  return message;
}

export function useMintDraftPass(): UseMintDraftPassResult {
  const { wallets, ready: walletsReady } = useWallets();
  const { walletAddress } = useAuth();
  const { sendTransaction } = useSendTransaction();

  const [isApproving, setIsApproving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [tokenPrice, setTokenPrice] = useState<bigint | null>(null);
  const [mintActive, setMintActive] = useState(false);
  const [totalMinted, setTotalMinted] = useState<bigint | null>(null);
  const [userPassCount, setUserPassCount] = useState<bigint | null>(null);

  // Pick best wallet: match auth address first, then any available
  const selectedWallet = useMemo(() => {
    if (wallets.length === 0) return null;
    if (walletAddress) {
      return (
        wallets.find((w) => w.address.toLowerCase() === walletAddress.toLowerCase()) ?? wallets[0]
      );
    }
    return wallets[0];
  }, [walletAddress, wallets]);

  // The address we use for on-chain reads (balance, allowance, NFT count)
  const onChainAddress = selectedWallet?.address ?? walletAddress;

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: BASE_SEPOLIA,
        transport: http(BASE_SEPOLIA_RPC_URL),
      }),
    []
  );

  const refreshContractState = useCallback(async () => {
    try {
      const calls: Promise<unknown>[] = [
        publicClient.readContract({
          address: BBB4_CONTRACT_ADDRESS,
          abi: BBB4_ABI,
          functionName: 'TOKEN_PRICE_USDC',
        }),
        publicClient.readContract({
          address: BBB4_CONTRACT_ADDRESS,
          abi: BBB4_ABI,
          functionName: 'mintIsActive',
        }),
        publicClient.readContract({
          address: BBB4_CONTRACT_ADDRESS,
          abi: BBB4_ABI,
          functionName: 'totalMinted',
        }),
      ];

      if (onChainAddress) {
        calls.push(
          publicClient.readContract({
            address: BBB4_CONTRACT_ADDRESS,
            abi: [{ type: 'function', stateMutability: 'view', name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }] as const,
            functionName: 'balanceOf',
            args: [onChainAddress as Address],
          })
        );
      }

      const results = await Promise.all(calls);
      setTokenPrice(results[0] as bigint);
      setMintActive(results[1] as boolean);
      setTotalMinted(results[2] as bigint);
      if (results[3] !== undefined) {
        setUserPassCount(results[3] as bigint);
      }
    } catch {
      // Keep UI functional even if read calls fail
    }
  }, [publicClient, onChainAddress]);

  useEffect(() => {
    void refreshContractState();
  }, [refreshContractState]);

  const mint = useCallback<MintFn>(
    async (quantity) => {
      setError(null);
      setTxHash(null);

      if (!walletsReady || !selectedWallet) {
        const message = 'Wallet not ready — please wait a moment and try again.';
        setError(message);
        throw new Error(message);
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        const message = 'Quantity must be a positive whole number.';
        setError(message);
        throw new Error(message);
      }

      try {
        // Ensure wallet is on Base
        const provider = await selectedWallet.getEthereumProvider();
        const currentChainHex = (await provider.request({ method: 'eth_chainId' })) as string;
        const currentChainId = parseInt(currentChainHex, 16);
        if (currentChainId !== BASE_SEPOLIA_CHAIN_ID) {
          await selectedWallet.switchChain(BASE_SEPOLIA_CHAIN_ID);
        }

        // Read contract state
        const [price, isActive, maxTokensPerTx] = await Promise.all([
          publicClient.readContract({
            address: BBB4_CONTRACT_ADDRESS,
            abi: BBB4_ABI,
            functionName: 'TOKEN_PRICE_USDC',
          }),
          publicClient.readContract({
            address: BBB4_CONTRACT_ADDRESS,
            abi: BBB4_ABI,
            functionName: 'mintIsActive',
          }),
          publicClient.readContract({
            address: BBB4_CONTRACT_ADDRESS,
            abi: BBB4_ABI,
            functionName: 'MAX_TOKENS_PER_TX',
          }),
        ]);

        if (!isActive) throw new Error('Mint is not active.');
        if (BigInt(quantity) > maxTokensPerTx) {
          throw new Error(`Max tokens per transaction is ${maxTokensPerTx.toString()}.`);
        }

        const totalCost = price * BigInt(quantity);
        const userAddr = selectedWallet.address as Address;

        // Check USDC balance and allowance
        const [balance, allowance] = await Promise.all([
          publicClient.readContract({
            address: BASE_SEPOLIA_USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'balanceOf',
            args: [userAddr],
          }),
          publicClient.readContract({
            address: BASE_SEPOLIA_USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'allowance',
            args: [userAddr, BBB4_CONTRACT_ADDRESS],
          }),
        ]);

        if (balance < totalCost) {
          throw new Error(
            `Insufficient USDC balance. Need ${formatUnits(totalCost, USDC_DECIMALS)} USDC, have ${formatUnits(balance, USDC_DECIMALS)} USDC.`
          );
        }

        // Approve USDC if needed — using Privy's sendTransaction with gas sponsorship
        if (allowance < totalCost) {
          setIsApproving(true);
          try {
            const approveData = encodeFunctionData({
              abi: USDC_ABI,
              functionName: 'approve',
              args: [BBB4_CONTRACT_ADDRESS, totalCost],
            });

            const approveReceipt = await sendTransaction(
              { to: BASE_SEPOLIA_USDC_ADDRESS, data: approveData, chainId: BASE_SEPOLIA_CHAIN_ID },
              { sponsor: true }
            );

            await publicClient.waitForTransactionReceipt({
              hash: (approveReceipt as Record<string, unknown>).transactionHash as Hex ?? approveReceipt.hash,
            });
          } finally {
            setIsApproving(false);
          }
        }

        // Mint — using Privy's sendTransaction with gas sponsorship
        setIsMinting(true);
        try {
          const mintData = encodeFunctionData({
            abi: BBB4_ABI,
            functionName: 'mint',
            args: [BigInt(quantity)],
          });

          const mintReceipt = await sendTransaction(
            { to: BBB4_CONTRACT_ADDRESS, data: mintData, chainId: BASE_SEPOLIA_CHAIN_ID },
            { sponsor: true }
          );

          const hash = ((mintReceipt as Record<string, unknown>).transactionHash as Hex) ?? mintReceipt.hash;
          await publicClient.waitForTransactionReceipt({ hash });
          setTxHash(hash);
          await refreshContractState();
          return hash;
        } finally {
          setIsMinting(false);
        }
      } catch (err) {
        const message = normalizeMintError(err);
        setError(message);
        throw new Error(message);
      }
    },
    [publicClient, walletsReady, refreshContractState, selectedWallet, sendTransaction]
  );

  return {
    mint,
    isApproving,
    isMinting,
    error,
    txHash,
    tokenPrice,
    mintActive,
    totalMinted,
    userPassCount,
  };
}
