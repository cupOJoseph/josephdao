import { BigInt } from "@graphprotocol/graph-ts";
import {
  ProposalSubmitted,
  VoteOnProposal as VoteOnProposalEvent,
  ProposalExecuted,
} from "../generated/JosephDAO/JosephDAO";
import { Proposal, Vote } from "../generated/schema";

export function handleProposalSubmitted(event: ProposalSubmitted): void {
  let id = event.params.proposalID.toString();
  let proposal = new Proposal(id);
  proposal.proposalID = event.params.proposalID;
  proposal.description = event.params.description;
  proposal.sendTokenAddress = event.params.sendTokenAddress;
  proposal.receiverAddress = event.params.receiverAddress;
  proposal.sendTokenAmount = event.params.sendTokenAmount;
  proposal.endTime = event.params.endTime;
  proposal.yesVotes = BigInt.fromI32(0);
  proposal.noVotes = BigInt.fromI32(0);
  proposal.executed = false;
  proposal.createdAt = event.block.timestamp;
  proposal.createdTx = event.transaction.hash;
  proposal.save();
}

export function handleVoteOnProposal(event: VoteOnProposalEvent): void {
  let voteId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let vote = new Vote(voteId);
  vote.proposal = event.params.proposalID.toString();
  vote.voter = event.transaction.from;
  vote.support = event.params.vote;
  vote.timestamp = event.block.timestamp;
  vote.tx = event.transaction.hash;
  vote.save();

  let proposal = Proposal.load(event.params.proposalID.toString());
  if (proposal) {
    if (event.params.vote) {
      proposal.yesVotes = proposal.yesVotes.plus(BigInt.fromI32(1));
    } else {
      proposal.noVotes = proposal.noVotes.plus(BigInt.fromI32(1));
    }
    proposal.save();
  }
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  let proposal = Proposal.load(event.params.proposalID.toString());
  if (proposal) {
    proposal.executed = true;
    proposal.save();
  }
}
