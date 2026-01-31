'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EvaluateResponse, EvaluateRequest } from '@/lib/types';

function getTrustColor(level: string): string {
  switch (level) {
    case 'high':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'untrusted':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

function ScoreBar({ label, raw, weighted }: { label: string; raw: number; weighted: number }) {
  const percentage = Math.round(raw * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">
          {percentage}% (weighted: {(weighted * 100).toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            percentage >= 80
              ? 'bg-green-500'
              : percentage >= 60
              ? 'bg-yellow-500'
              : percentage >= 40
              ? 'bg-orange-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [request, setRequest] = useState<EvaluateRequest | null>(null);

  useEffect(() => {
    const storedResult = sessionStorage.getItem('evaluationResult');
    const storedRequest = sessionStorage.getItem('evaluationRequest');

    if (!storedResult) {
      router.push('/submit');
      return;
    }

    setResult(JSON.parse(storedResult));
    if (storedRequest) {
      setRequest(JSON.parse(storedRequest));
    }
  }, [router]);

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluation Result</h1>
        <p className="text-gray-600">
          Request ID: <code className="text-sm bg-gray-100 px-2 py-1 rounded">{result.requestId}</code>
        </p>
      </div>

      {/* Main Score Card */}
      <div className={`border rounded-lg p-6 mb-6 ${getTrustColor(result.trustLevel)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold">{result.score}</div>
            <div className="text-lg font-medium mt-1">/ 100</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold uppercase">{result.trustLevel}</div>
            <div className="text-sm mt-1">Trust Level</div>
          </div>
        </div>
      </div>

      {/* Request Summary */}
      {request && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Evaluated Data</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Oracle:</span>
              <span className="ml-2 font-medium">{request.oracleName}</span>
            </div>
            <div>
              <span className="text-gray-500">Data Type:</span>
              <span className="ml-2 font-medium">{request.dataType}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Value:</span>
              <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(request.dataValue, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Score Breakdown (S.T.A.P.)
        </h2>
        <ScoreBar
          label="S - Source Reliability"
          raw={result.breakdown.source.raw}
          weighted={result.breakdown.source.weighted}
        />
        <ScoreBar
          label="T - Time Freshness"
          raw={result.breakdown.time.raw}
          weighted={result.breakdown.time.weighted}
        />
        <ScoreBar
          label="A - Accuracy/Consistency"
          raw={result.breakdown.accuracy.raw}
          weighted={result.breakdown.accuracy.weighted}
        />
        <ScoreBar
          label="P - Proof (zkTLS)"
          raw={result.breakdown.proof.raw}
          weighted={result.breakdown.proof.weighted}
        />
      </div>

      {/* Formula Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Formula Used</h2>
        <div className="text-sm">
          <div className="mb-2">
            <span className="text-gray-500">Formula:</span>
            <span className="ml-2 font-medium">{result.formulaName}</span>
            <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{result.formulaId}</code>
          </div>
        </div>
      </div>

      {/* zkTLS Verification */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">zkTLS Verification</h2>
        <div className="flex items-center space-x-3">
          <div
            className={`w-4 h-4 rounded-full ${
              result.zkVerified ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className={result.zkVerified ? 'text-green-700' : 'text-red-700'}>
            {result.zkVerified ? 'Verified' : 'Not Verified'}
          </span>
        </div>
        {result.proofHash && (
          <div className="mt-3 text-sm">
            <span className="text-gray-500">Proof Hash:</span>
            <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded break-all">
              {result.proofHash}
            </code>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Explanation</h2>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
          {result.explanation}
        </pre>
      </div>

      {/* AI Reasoning */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
          {result.aiReasoning}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <Link
          href="/submit"
          className="flex-1 text-center bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Evaluate Another
        </Link>
        <button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
            alert('Result copied to clipboard');
          }}
          className="flex-1 text-center border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Copy JSON
        </button>
      </div>

      {/* Timestamp */}
      <div className="text-center text-sm text-gray-400 mt-8">
        Evaluated at: {new Date(result.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
