import { useState } from "react";
import zkvoteapp_program from "../zkvoteapp/build/main.aleo?raw";
import { AleoWorker } from "./workers/AleoWorker";
import "./Vote.css";

// Program name on-chain (must match the deployed program)
const ZKVOTEAPP_NAME = "zkvoteapp2026.aleo";

const aleoWorker = AleoWorker();

interface VoteRecord {
  owner: string;
  proposal_id: string;
  vote_value: string;
  _nonce?: string;
  _version?: string;
}

function parseVoteRecord(raw: string): VoteRecord | null {
  const fields: Record<string, string> = {};
  const cleaned = raw.replace(/[{}]/g, "").trim();
  for (const part of cleaned.split(",")) {
    const [key, ...rest] = part.split(":");
    if (key && rest.length) {
      fields[key.trim()] = rest.join(":").trim();
    }
  }
  if (!fields.owner) return null;
  return fields as unknown as VoteRecord;
}

function Vote() {
  const [voting, setVoting] = useState(false);
  const [proposalId, setProposalId] = useState("");
  const [voteValue, setVoteValue] = useState(true);
  const [mode, setMode] = useState<"local" | "onchain">("local");
  const [privateKey, setPrivateKey] = useState("");
  const [result, setResult] = useState<VoteRecord | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createVote() {
    if (!proposalId.trim()) {
      setError("Please enter a proposal ID");
      return;
    }
    if (mode === "onchain" && !privateKey.trim()) {
      setError("Private key is required for on-chain execution");
      return;
    }

    setError(null);
    setResult(null);
    setTxId(null);
    setVoting(true);

    try {
      const inputs = [proposalId.trim() + "field", voteValue.toString()];

      if (mode === "onchain") {
        // On-chain: submit transaction to Aleo testnet
        const tx = await aleoWorker.executeOnChain(
          privateKey.trim(),
          ZKVOTEAPP_NAME,
          "create_vote",
          inputs,
        );
        console.log("On-chain transaction:", tx);
        setTxId(String(tx));
        setResult({ owner: "(on-chain)", proposal_id: proposalId, vote_value: String(voteValue) });
      } else {
        // Local: run off-chain
        const outputs = await aleoWorker.localProgramExecution(
          zkvoteapp_program,
          "create_vote",
          inputs,
        );
        console.log("Local execution outputs:", outputs);
        const raw = Array.isArray(outputs) ? outputs[0] : String(outputs);
        const parsed = parseVoteRecord(String(raw));
        setResult(parsed || { owner: "unknown", proposal_id: proposalId, vote_value: String(voteValue) });
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    }
    setVoting(false);
  }

  return (
    <div className="vote-container">
      {/* Header */}
      <div className="vote-header">
        <h2>🗳️ ZK Vote</h2>
        <p>Private voting powered by zero-knowledge proofs</p>
      </div>

      {/* Body */}
      <div className="vote-body">
        {/* Mode Toggle */}
        <div className="form-group">
          <label>Execution Mode</label>
          <div className="vote-toggle">
            <button
              className={`vote-toggle-btn ${mode === "local" ? "active-agree" : ""}`}
              onClick={() => setMode("local")}
              disabled={voting}
              type="button"
            >
              💻 Local
            </button>
            <button
              className={`vote-toggle-btn ${mode === "onchain" ? "active-disagree" : ""}`}
              onClick={() => setMode("onchain")}
              disabled={voting}
              type="button"
            >
              ⛓️ On-chain
            </button>
          </div>
        </div>

        {/* Private Key (on-chain only) */}
        {mode === "onchain" && (
          <div className="form-group">
            <label>Private Key</label>
            <input
              type="password"
              placeholder="APrivateKey1..."
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              disabled={voting}
            />
          </div>
        )}

        {/* Proposal ID */}
        <div className="form-group">
          <label>Proposal ID</label>
          <input
            type="text"
            placeholder="e.g. 12345"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
            disabled={voting}
          />
        </div>

        {/* Vote Toggle */}
        <div className="form-group">
          <label>Your Vote</label>
          <div className="vote-toggle">
            <button
              className={`vote-toggle-btn ${voteValue ? "active-agree" : ""}`}
              onClick={() => setVoteValue(true)}
              disabled={voting}
              type="button"
            >
              👍 Agree
            </button>
            <button
              className={`vote-toggle-btn ${!voteValue ? "active-disagree" : ""}`}
              onClick={() => setVoteValue(false)}
              disabled={voting}
              type="button"
            >
              👎 Disagree
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          className="vote-submit"
          onClick={createVote}
          disabled={voting || !proposalId.trim() || (mode === "onchain" && !privateKey.trim())}
        >
          {voting ? (
            <><span className="spinner" />{mode === "onchain" ? "Submitting Transaction..." : "Generating ZK Proof..."}</>
          ) : (
            mode === "onchain" ? "⛓️ Submit On-chain Vote" : "💻 Create Local Vote"
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="vote-error">⚠️ {error}</div>
        )}

        {/* Transaction ID */}
        {txId && (
          <div className="vote-result">
            <h3>⛓️ Transaction Submitted</h3>
            <div className="vote-result-fields">
              <div className="vote-result-field">
                <span className="field-key">Tx ID</span>
                <span className="field-value">{txId.slice(0, 20)}...</span>
              </div>
            </div>
            <a
              href={`https://testnet.explorer.provable.com/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", marginTop: "0.8rem", color: "#818cf8", fontSize: "0.85em" }}
            >
              View on Explorer →
            </a>
          </div>
        )}

        {/* Result (local mode) */}
        {result && !txId && (
          <div className="vote-result">
            <h3>✅ Vote Record Created</h3>
            <div className="vote-result-fields">
              <div className="vote-result-field">
                <span className="field-key">Owner</span>
                <span className="field-value">{result.owner.replace(".private", "")} <span className="badge badge-private">private</span></span>
              </div>
              <div className="vote-result-field">
                <span className="field-key">Proposal</span>
                <span className="field-value">{result.proposal_id.replace(".private", "")} <span className="badge badge-private">private</span></span>
              </div>
              <div className="vote-result-field">
                <span className="field-key">Vote</span>
                <span className="field-value">{result.vote_value.replace(".private", "")} <span className="badge badge-private">private</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Vote;
