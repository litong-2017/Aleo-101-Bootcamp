// Private Token - A privacy-preserving token on Aleo
// Demonstrates: private records, ownership, ZK-proven transfers
program yuxianwen_token.aleo {

    @noupgrade
    constructor() {}

    // Token record: stored encrypted on-chain, only owner can see amount
    record Token {
        owner: address,
        amount: u64,
    }

    // Mint new tokens - caller gets a private Token record
    fn mint(public amount: u64) -> Token {
        return Token {
            owner: self.signer,
            amount: amount,
        };
    }

    // Transfer tokens privately - ZK proof guarantees sender has enough
    // but the actual balance is never revealed on-chain
    fn transfer(
        token: Token,
        public recipient: address,
        public amount: u64
    ) -> (Token, Token) {
        assert(token.amount >= amount);

        let change: Token = Token {
            owner: token.owner,
            amount: token.amount - amount,
        };

        let sent: Token = Token {
            owner: recipient,
            amount: amount,
        };

        return (change, sent);
    }

    // Merge two tokens owned by the same person
    fn combine(first: Token, second: Token) -> Token {
        assert_eq(first.owner, second.owner);
        return Token {
            owner: first.owner,
            amount: first.amount + second.amount,
        };
    }
}
