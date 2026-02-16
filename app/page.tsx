'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, type Address } from 'viem';
import { useState, useEffect } from 'react';
import { DAO_ADDRESS, DAO_ABI, ERC20_ABI } from './config';

function Header() {
  return (
    <header className="flex items-center justify-between p-4 md:p-6">
      <div className="flex items-center gap-2">
        <span className="text-3xl">🏛️</span>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          JosephDAO
        </h1>
      </div>
      <ConnectButton showBalance={false} />
    </header>
  );
}

function Hero() {
  return (
    <div className="text-center py-8 px-4">
      <h2 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
        Welcome to JosephDAO ✨
      </h2>
      <p className="text-lg text-gray-600 max-w-xl mx-auto">
        A cozy community DAO on Arbitrum. Propose ideas, vote with quadratic power, and shape the future together! 🌈
      </p>
    </div>
  );
}

function Stats() {
  const { data: proposalCount } = useReadContract({
    address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'proposalCount',
  });
  const { data: voteTokenAddr } = useReadContract({
    address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'voteToken',
  });
  const { data: quorum } = useReadContract({
    address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'minimumQuorum',
  });
  const { data: tokenName } = useReadContract({
    address: voteTokenAddr as Address, abi: ERC20_ABI, functionName: 'name',
    query: { enabled: !!voteTokenAddr },
  });
  const { data: totalSupply } = useReadContract({
    address: voteTokenAddr as Address, abi: ERC20_ABI, functionName: 'totalSupply',
    query: { enabled: !!voteTokenAddr },
  });
  const { data: decimals } = useReadContract({
    address: voteTokenAddr as Address, abi: ERC20_ABI, functionName: 'decimals',
    query: { enabled: !!voteTokenAddr },
  });
  const { address } = useAccount();
  const { data: userBalance } = useReadContract({
    address: voteTokenAddr as Address, abi: ERC20_ABI, functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!voteTokenAddr && !!address },
  });

  const stats = [
    { label: 'Total Proposals', value: proposalCount?.toString() ?? '...', emoji: '📋' },
    { label: 'Token', value: tokenName ?? 'JOE', emoji: '🪙' },
    { label: 'Total Supply', value: totalSupply && decimals ? Number(formatUnits(totalSupply, decimals)).toLocaleString() : '...', emoji: '💰' },
    { label: 'Min Quorum', value: quorum?.toString() ?? '...', emoji: '🎯' },
    { label: 'Your Balance', value: userBalance && decimals ? Number(formatUnits(userBalance, decimals)).toLocaleString() : address ? '...' : 'Connect wallet', emoji: '👛' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-4 md:px-8 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
          <div className="text-2xl mb-1">{s.emoji}</div>
          <div className="text-sm text-gray-500 font-semibold">{s.label}</div>
          <div className="text-lg font-bold text-gray-800 truncate">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function Countdown({ endTime }: { endTime: bigint }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const i = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(i);
  }, []);
  const end = Number(endTime);
  if (now >= end) return <span className="text-red-400 font-bold">⏰ Ended</span>;
  const diff = end - now;
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return <span className="text-emerald-600 font-bold">⏳ {d}d {h}h {m}m</span>;
}

function ProposalCard({ id }: { id: number }) {
  const { address } = useAccount();
  const { data: proposal } = useReadContract({
    address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'proposals', args: [BigInt(id)],
  });
  const { data: yesVotes } = useReadContract({
    address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'yesVotes', args: [BigInt(id)],
  });
  const { data: noVotes } = useReadContract({
    address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'noVotes', args: [BigInt(id)],
  });
  const { data: executed } = useReadContract({
    address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'isExecuted', args: [BigInt(id)],
  });
  const { data: hasVoted } = useReadContract({
    address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'userHasVoted', args: [BigInt(id), address!],
    query: { enabled: !!address },
  });

  const { writeContract: vote, data: voteTxHash } = useWriteContract();
  const { writeContract: execute, data: execTxHash } = useWriteContract();
  const { isLoading: voteLoading } = useWaitForTransactionReceipt({ hash: voteTxHash });
  const { isLoading: execLoading } = useWaitForTransactionReceipt({ hash: execTxHash });

  if (!proposal) return <div className="bg-white/60 rounded-2xl p-6 animate-pulse h-48" />;

  const [description, sendTokenAddress, receiverAddress, sendTokenAmount, endTime] = proposal;
  const now = Math.floor(Date.now() / 1000);
  const ended = now >= Number(endTime);
  const yes = Number(yesVotes ?? 0n);
  const no = Number(noVotes ?? 0n);
  const total = yes + no;
  const yesPct = total > 0 ? (yes / total) * 100 : 50;

  const getStatus = () => {
    if (executed) return { label: 'Executed 🎉', color: 'bg-purple-100 text-purple-700' };
    if (!ended) return { label: 'Active 🟢', color: 'bg-green-100 text-green-700' };
    if (yes > no) return { label: 'Passed ✅', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Failed ❌', color: 'bg-red-100 text-red-700' };
  };
  const status = getStatus();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-purple-100 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold text-gray-400">#{id}</span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-2">{description}</h3>
      {sendTokenAmount > 0n && (
        <div className="text-sm text-gray-500 mb-3 bg-gray-50 rounded-xl p-3">
          💸 Send <span className="font-bold">{formatUnits(sendTokenAmount, 18)}</span> tokens
          <br />📍 To: <span className="font-mono text-xs">{receiverAddress.slice(0, 6)}...{receiverAddress.slice(-4)}</span>
          <br />🪙 Token: <span className="font-mono text-xs">{sendTokenAddress.slice(0, 6)}...{sendTokenAddress.slice(-4)}</span>
        </div>
      )}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>👍 Yes: {yes}</span>
          <span>👎 No: {no}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all" style={{ width: `${yesPct}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Countdown endTime={endTime} />
        <div className="flex gap-2">
          {!ended && !hasVoted && address && (
            <>
              <button
                onClick={() => vote({ address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'voteOnProposal', args: [BigInt(id), true] })}
                disabled={voteLoading}
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-500 text-white rounded-full font-bold text-sm transition-colors disabled:opacity-50"
              >
                {voteLoading ? '...' : '👍 Yes'}
              </button>
              <button
                onClick={() => vote({ address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'voteOnProposal', args: [BigInt(id), false] })}
                disabled={voteLoading}
                className="px-4 py-2 bg-red-400 hover:bg-red-500 text-white rounded-full font-bold text-sm transition-colors disabled:opacity-50"
              >
                {voteLoading ? '...' : '👎 No'}
              </button>
            </>
          )}
          {hasVoted && <span className="text-sm text-gray-400 font-bold">✅ Voted</span>}
          {ended && !executed && yes > no && address && (
            <button
              onClick={() => execute({ address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'executeProposal', args: [BigInt(id)] })}
              disabled={execLoading}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-bold text-sm transition-colors disabled:opacity-50"
            >
              {execLoading ? '...' : '⚡ Execute'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProposalList() {
  const { data: count } = useReadContract({
    address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'proposalCount',
  });
  const proposalCount = Number(count ?? 0n);
  if (proposalCount === 0) return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-6xl mb-4">🦗</div>
      <p className="text-lg font-bold">No proposals yet! Be the first to propose something ✨</p>
    </div>
  );
  return (
    <div className="grid gap-4 px-4 md:px-8 mb-8">
      <h2 className="text-2xl font-extrabold text-gray-700">🗳️ Proposals</h2>
      {Array.from({ length: proposalCount }, (_, i) => (
        <ProposalCard key={i} id={i} />
      ))}
    </div>
  );
}

function SubmitProposal() {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [tokenAddr, setTokenAddr] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const { address } = useAccount();
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const submit = () => {
    writeContract({
      address: DAO_ADDRESS, abi: DAO_ABI, functionName: 'submitProposal',
      args: [desc, tokenAddr as Address, receiver as Address, parseUnits(amount || '0', 18)],
    });
  };

  if (!open) return (
    <div className="px-4 md:px-8 mb-8">
      <button onClick={() => setOpen(true)} className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-2xl p-4 font-extrabold text-lg hover:opacity-90 transition-opacity shadow-lg">
        ✍️ Submit a New Proposal
      </button>
    </div>
  );

  return (
    <div className="px-4 md:px-8 mb-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-extrabold text-gray-700">✍️ New Proposal</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-xl border border-purple-200 p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" rows={3} placeholder="What do you want to propose? 💭" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">Token Address to Send</label>
            <input value={tokenAddr} onChange={(e) => setTokenAddr(e.target.value)} className="w-full rounded-xl border border-purple-200 p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm" placeholder="0x..." />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">Receiver Address</label>
            <input value={receiver} onChange={(e) => setReceiver(e.target.value)} className="w-full rounded-xl border border-purple-200 p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm" placeholder="0x..." />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">Amount</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-purple-200 p-3 focus:outline-none focus:ring-2 focus:ring-purple-400" type="number" placeholder="0.0" />
          </div>
          <button
            onClick={submit}
            disabled={!address || isLoading || !desc}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-3 font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {!address ? '🔗 Connect Wallet First' : isLoading ? '⏳ Confirming...' : isSuccess ? '🎉 Submitted!' : '🚀 Submit Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto min-h-screen">
      <Header />
      <Hero />
      <Stats />
      <SubmitProposal />
      <ProposalList />
      <footer className="text-center py-8 text-gray-400 text-sm">
        Made with 💜 by JosephDAO community · Arbitrum One
      </footer>
    </div>
  );
}
