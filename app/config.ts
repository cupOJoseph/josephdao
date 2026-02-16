import { http } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const DAO_ADDRESS = '0x28DD040160484e194A7551d98af7Acec631ee2d4' as const;

export const DAO_ABI = [
  { name: 'voteToken', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'proposalCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'minimumQuorum', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'proposals', type: 'function', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ name: 'description', type: 'string' }, { name: 'sendTokenAddress', type: 'address' }, { name: 'receiverAddress', type: 'address' }, { name: 'sendTokenAmount', type: 'uint256' }, { name: 'endTime', type: 'uint256' }] },
  { name: 'yesVotes', type: 'function', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'noVotes', type: 'function', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'isExecuted', type: 'function', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'userHasVoted', type: 'function', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint256' }, { name: 'user', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'submitProposal', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'description', type: 'string' }, { name: 'sendTokenAddress', type: 'address' }, { name: 'receiverAddress', type: 'address' }, { name: 'sendTokenAmount', type: 'uint256' }], outputs: [] },
  { name: 'voteOnProposal', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalID', type: 'uint256' }, { name: 'vote', type: 'bool' }], outputs: [] },
  { name: 'executeProposal', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalID', type: 'uint256' }], outputs: [] },
] as const;

export const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const;

export const config = getDefaultConfig({
  appName: 'JosephDAO',
  projectId: 'josephdao-dashboard',
  chains: [arbitrum],
  transports: {
    [arbitrum.id]: http('https://arb-mainnet.g.alchemy.com/v2/WtGzKM0NAY_Mr3rAYlykQWnzPF6JbcHy'),
  },
});
