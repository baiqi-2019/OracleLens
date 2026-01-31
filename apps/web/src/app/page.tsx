import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          OracleLens
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          A credibility verification layer that evaluates whether oracle-provided data
          should be trusted before it reaches your smart contracts.
        </p>
        <Link
          href="/submit"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Evaluate Oracle Data
        </Link>
      </section>

      {/* What OracleLens Is NOT */}
      <section className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-amber-800 mb-3">
          Important: What OracleLens Is NOT
        </h2>
        <ul className="text-amber-700 space-y-2">
          <li>• OracleLens is <strong>NOT</strong> an oracle</li>
          <li>• OracleLens does <strong>NOT</strong> provide price feeds or external data</li>
          <li>• OracleLens sits <strong>BETWEEN</strong> oracle data and on-chain decisions</li>
        </ul>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl mb-3">1</div>
            <h3 className="font-semibold mb-2">Submit Data</h3>
            <p className="text-gray-600 text-sm">
              Submit oracle data you want to verify (oracle name, data type, values)
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl mb-3">2</div>
            <h3 className="font-semibold mb-2">AI Selects Formula</h3>
            <p className="text-gray-600 text-sm">
              AI analyzes the data type and selects the appropriate scoring formula
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl mb-3">3</div>
            <h3 className="font-semibold mb-2">Calculate Score</h3>
            <p className="text-gray-600 text-sm">
              Evaluate source reliability, time freshness, consistency, and zkTLS proof
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl mb-3">4</div>
            <h3 className="font-semibold mb-2">Get Result</h3>
            <p className="text-gray-600 text-sm">
              Receive a credibility score with clear explanation of why
            </p>
          </div>
        </div>
      </section>

      {/* Scoring Factors */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Scoring Factors (S.T.A.P.)</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">S - Source Reliability</h3>
            <p className="text-gray-600">
              How trusted is the oracle? Known oracles like Chainlink and Pyth have established reputations.
            </p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">T - Time Freshness</h3>
            <p className="text-gray-600">
              How fresh is the data? Stale data loses credibility exponentially.
            </p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">A - Accuracy/Consistency</h3>
            <p className="text-gray-600">
              Does the data align with other sources? Significant deviations are flagged.
            </p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">P - Proof (zkTLS)</h3>
            <p className="text-gray-600">
              Is there cryptographic proof of data authenticity via zero-knowledge TLS?
            </p>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Technology Stack</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Frontend & Backend</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Next.js (App Router)</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Verification</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Primus Labs zkTLS SDK</li>
                <li>• AI Formula Selection</li>
                <li>• Deterministic Scoring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">On-Chain</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Solidity Smart Contracts</li>
                <li>• Foundry</li>
                <li>• Sepolia Testnet</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <Link
          href="/submit"
          className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition"
        >
          Try It Now - Evaluate Oracle Data
        </Link>
      </section>
    </div>
  );
}
