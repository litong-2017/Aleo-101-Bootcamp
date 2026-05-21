// The `counter_app.aleo` program.
program counter_app.aleo {
    // A private counter record - only the owner can see the value
    record Counter {
        owner: address,
        value: u32,
    }

    // Transition 1: Create a new counter with initial value 0
    transition mint -> Counter {
        return Counter {
            owner: self.caller,
            value: 0u32,
        } then finalize mint();
    }

    // Transition 2: Increment the counter by 1 (private operation)
    transition increment(counter: Counter) -> Counter {
        // Check that the caller owns the counter
        assert_eq(counter.owner, self.caller);
        
        // Increment the value
        let new_value: u32 = counter.value + 1u32;
        
        // Return a new counter record with the incremented value
        return Counter {
            owner: self.caller,
            value: new_value,
        } then finalize increment();
    }

    // Transition 3: Get the current value (reveals the value - use carefully!)
    transition get_value(counter: Counter) -> u32 {
        assert_eq(counter.owner, self.caller);
        return counter.value;
    }

    // Finalize functions for on-chain state tracking
    async function mint() {
        // Track that a counter was minted
        mapping counter_count: u8 => u64;
        let count: u64 = Counter.counter_count.get(0u8).unwrap_or(0u64);
        Counter.counter_count.set(0u8, count + 1u64);
    }

    async function increment() {
        // Track total increments
        mapping total_increments: u8 => u64;
        let count: u64 = Counter.total_increments.get(0u8).unwrap_or(0u64);
        Counter.total_increments.set(0u8, count + 1u64);
    }
}
