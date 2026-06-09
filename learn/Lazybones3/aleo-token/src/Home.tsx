import { useState } from "react";
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import unstable_token_program from "../unstable_token/build/unstable_token/unstable_token.aleo?raw";
import { AleoWorker } from "./workers/AleoWorker";

const aleoWorker = AleoWorker();
function Home() {
  const {
    // State
    // wallets,
    // wallet,
    address,
    connected,
    // connecting,
    // disconnecting,
    // reconnecting,
    // network,

    // Methods
    // selectWallet,
    // connect,
    // disconnect,
    // executeTransaction,
    // transactionStatus,
    // signMessage,
    // switchNetwork,
    // decrypt,
    // requestRecords,
    // executeDeployment,
    // transitionViewKeys,
    // requestTransactionHistory,
  } = useWallet();

  const [count, setCount] = useState(0);
  const [executing, setExecuting] = useState(false);

  async function mintToken() {
    if (!connected) {
      alert('钱包未连接');
      return;
    }
    if (count == 0) {
      alert('count不能为0');
      return;
    }
    setExecuting(true);
    const result = await aleoWorker.localProgramExecution(
      unstable_token_program,
      "mint",
      [address, `${count}u64`],
    );
    console.log(result);
    setExecuting(false);

    if (result.length > 0) {
      const jsonObject = stringToObject(result[0]);
      const amount = jsonObject['amount'].replace('u64.private', '')
      alert(`成功铸造${amount}枚token`);
    } else {
      alert('返回结果为空');
    }

  }

  const stringToObject = (inputString) => {
    // 1. Wrap unquoted keys in double quotes
    let sanitized = inputString.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":');

    // 2. Wrap unquoted string values (including suffixes) in double quotes
    sanitized = sanitized.replace(/:\s*([a-zA-Z0-9_\.]+)(,|}|\n)/g, ': "$1"$2');

    // 3. Remove trailing commas if any exist before closing braces
    sanitized = sanitized.replace(/,\s*}/g, '}');

    // 4. Parse into a JavaScript Object
    return JSON.parse(sanitized);
  }

  return (
    <>
      <div className="flex flex-col items-center gap-6">
        <button
          className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <button
          className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
          onClick={mintToken}
          disabled={executing}
        >
          {executing ? 'Minting…' : 'Mint Token'}
        </button>
      </div>
    </>
  );
}

export default Home;
