program privacy_voting.aleo {
    struct Proposal {
        id: u64,
        title: u128,
        yes_votes: u64,
        no_votes: u64,
    }

    mapping proposals: u64 => Proposal;

    transition create_proposal(id: u64, title: u128) {
        let proposal = Proposal { id, title, yes_votes: 0u64, no_votes: 0u64 };
        Mapping::set(proposals, id, proposal);
    }

    transition vote_yes(id: u64) {
        let proposal = Mapping::get(proposals, id);
        proposal.yes_votes = proposal.yes_votes + 1u64;
        Mapping::set(proposals, id, proposal);
    }

    transition vote_no(id: u64) {
        let proposal = Mapping::get(proposals, id);
        proposal.no_votes = proposal.no_votes + 1u64;
        Mapping::set(proposals, id, proposal);
    }

    transition get_result(id: u64) -> (u64, u64) {
        let proposal = Mapping::get(proposals, id);
        return (proposal.yes_votes, proposal.no_votes);
    }
}