'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { EvaluateResponse, EvaluateRequest } from '@/lib/types';

function getTrustStyles(level: string): { bg: string; border: string; badge: string; text: string } {
  switch (level) {
    case 'high':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'trust-high',
        text: 'text-emerald-600',
      };
    case 'medium':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'trust-medium',
        text: 'text-amber-600',
      };
    case 'low':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'trust-low',
        text: 'text-orange-600',
      };
    case 'untrusted':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'trust-untrusted',
        text: 'text-red-600',
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-600',
        text: 'text-gray-600',
      };
  }
}

function ScoreBar({ label, raw, weighted, colorClass }: { label: string; raw: number; weighted: number; colorClass: string }) {
  const percentage = Math.round(raw * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-800 font-medium">{label}</span>
        <span className="text-gray-600 font-mono">
          {percentage}% <span className="text-gray-400">({(weighted * 100).toFixed(1)}%)</span>
        </span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ScoreCircle({ score, trustLevel }: { score: number; trustLevel: string }) {
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-circle">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A90D9" />
            <stop offset="100%" stopColor="#5B4BC4" />
          </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="80"
          r="58"
          className="score-circle-bg"
        />
        <circle
          cx="80"
          cy="80"
          r="58"
          className="score-circle-progress"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold gradient-text">{score}</span>
        <span className="text-gray-500 text-sm">/100</span>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const { t } = useLanguage();
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">{t.result.loading}</p>
        </div>
      </div>
    );
  }

  const trustStyles = getTrustStyles(result.trustLevel);
  const trustLabel = t.result.trust[result.trustLevel as keyof typeof t.result.trust];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block mb-4">
          <span className="badge badge-brand">
            Evaluation Complete
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.result.title}</h1>
        <p className="text-gray-600 font-mono text-sm">
          {t.result.requestId}: <code className="text-[#4A90D9]">{result.requestId}</code>
        </p>
      </div>

      {/* Main Score Card */}
      <div className={`card p-8 mb-6 ${trustStyles.border} ${trustStyles.bg}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <ScoreCircle score={result.score} trustLevel={result.trustLevel} />
            <div>
              <div className={`trust-badge ${trustStyles.badge} text-lg`}>
                {trustLabel}
              </div>
              <div className="text-gray-600 mt-2">{t.result.trustLevel}</div>
            </div>
          </div>

          {/* zkTLS Badge */}
          <div className={`px-6 py-4 rounded-xl ${result.zkVerified ? 'success-box' : 'error-box'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${result.zkVerified ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <div>
                <div className={`font-semibold ${result.zkVerified ? 'text-emerald-700' : 'text-red-700'}`}>
                  zkTLS {result.zkVerified ? t.result.zkVerified : t.result.zkNotVerified}
                </div>
                <div className="text-xs text-gray-600 font-mono truncate max-w-[200px]">
                  {result.proofHash.slice(0, 20)}...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Request Summary */}
          {request && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4A90D9] to-[#5B4BC4] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {t.result.evaluatedData}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t.result.oracle}:</span>
                  <span className="text-gray-900 font-medium">{request.oracleName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t.result.dataType}:</span>
                  <span className="text-gray-900 font-mono">{request.dataType}</span>
                </div>
                <div className="pt-2">
                  <span className="text-gray-600">{t.result.value}:</span>
                  <pre className="code-block text-xs mt-2 overflow-auto">
                    {JSON.stringify(request.dataValue, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Formula Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              {t.result.formulaUsed}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-gray-800">{result.formulaName}</span>
              <code className="px-3 py-1 rounded-lg bg-purple-50 text-[#5B4BC4] text-xs font-mono border border-purple-200">
                {result.formulaId}
              </code>
            </div>
          </div>

          {/* zkTLS Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              {t.result.zkTitle}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${result.zkVerified ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className={result.zkVerified ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                  {result.zkVerified ? t.result.zkVerified : t.result.zkNotVerified}
                </span>
              </div>
              <div>
                <span className="text-gray-600 text-sm">{t.result.proofHash}:</span>
                <code className="block mt-2 text-xs bg-gray-100 px-4 py-3 rounded-lg text-gray-700 break-all font-mono border border-gray-200">
                  {result.proofHash}
                </code>
              </div>
            </div>
          </div>

          {/* On-Chain Record */}
          {result.onChain && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                {t.result.onChainTitle}
              </h2>
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    result.onChain.mode === 'skipped' ? 'bg-gray-400' :
                    result.onChain.success ? 'bg-emerald-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-medium ${
                    result.onChain.mode === 'skipped' ? 'text-gray-600' :
                    result.onChain.success ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {result.onChain.mode === 'skipped' ? t.result.onChainSkipped :
                     result.onChain.success ? t.result.onChainSuccess : t.result.onChainFailed}
                  </span>
                </div>

                {/* Transaction Hash */}
                {result.onChain.txHash && (
                  <div>
                    <span className="text-gray-600 text-sm">{t.result.txHash}:</span>
                    <code className="block mt-2 text-xs bg-gray-100 px-4 py-3 rounded-lg text-gray-700 break-all font-mono border border-gray-200">
                      {result.onChain.txHash}
                    </code>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${result.onChain.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 text-sm text-[#4A90D9] hover:text-[#5B4BC4] transition-colors"
                    >
                      {t.result.viewOnExplorer}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}

                {/* Block Number */}
                {result.onChain.blockNumber && (
                  <div className="flex justify-between py-2 border-t border-gray-100">
                    <span className="text-gray-600 text-sm">{t.result.blockNumber}:</span>
                    <span className="text-gray-900 font-mono text-sm">{result.onChain.blockNumber}</span>
                  </div>
                )}

                {/* Error */}
                {result.onChain.error && (
                  <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{result.onChain.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Score Breakdown */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4A90D9] to-[#5B4BC4] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {t.result.breakdown}
            </h2>
            <ScoreBar
              label={t.result.breakdownLabels.source}
              raw={result.breakdown.source.raw}
              weighted={result.breakdown.source.weighted}
              colorClass="progress-fill-source"
            />
            <ScoreBar
              label={t.result.breakdownLabels.time}
              raw={result.breakdown.time.raw}
              weighted={result.breakdown.time.weighted}
              colorClass="progress-fill-time"
            />
            <ScoreBar
              label={t.result.breakdownLabels.accuracy}
              raw={result.breakdown.accuracy.raw}
              weighted={result.breakdown.accuracy.weighted}
              colorClass="progress-fill-accuracy"
            />
            <ScoreBar
              label={t.result.breakdownLabels.proof}
              raw={result.breakdown.proof.raw}
              weighted={result.breakdown.proof.weighted}
              colorClass="progress-fill-proof"
            />
          </div>

          {/* Explanation */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {t.result.explanation}
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {result.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis - Full Width */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B4BC4] to-[#4A90D9] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          {t.result.aiAnalysis}
        </h2>
        <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-lg p-5 border border-gray-200">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {result.aiReasoning}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Link
          href="/submit"
          className="flex-1 btn-primary text-center py-4 rounded-xl font-semibold"
        >
          {t.result.evaluateAnother}
        </Link>
        <button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
            alert(t.result.copied);
          }}
          className="flex-1 btn-secondary text-center py-4 rounded-xl font-semibold"
        >
          {t.result.copyJson}
        </button>
      </div>

      {/* Timestamp */}
      <div className="text-center text-sm text-gray-500 mt-8 font-mono">
        {t.result.evaluatedAt}: {new Date(result.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
