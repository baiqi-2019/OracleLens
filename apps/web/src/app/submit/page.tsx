'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { MOCK_ORACLE_DATA, MockDataKey, EvaluateRequest } from '@/lib/types';
import { useZkTls } from '@/lib/useZkTls';

type Tab = 'preset' | 'custom';

// Step icons for the progress modal
const STEP_ICONS = [
  // Validate input
  <svg key="0" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  // AI formula
  <svg key="1" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  // Calculate scores
  <svg key="2" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  // zkTLS
  <svg key="3" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  // AI analysis
  <svg key="4" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  // Save DB
  <svg key="5" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>,
  // On-chain
  <svg key="6" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  // Done
  <svg key="7" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
];

// Time intervals between steps (ms) - simulated progression
const STEP_INTERVALS = [400, 800, 600, 1000, 1200, 500, 800, 600];

function ProgressModal({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 mx-4 w-full max-w-md animate-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#4A90D9] to-[#5B4BC4] mb-4">
            <svg className="w-7 h-7 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {steps.length > 0 ? steps[Math.min(currentStep, steps.length - 1)] : ''}
          </h3>
        </div>

        {/* Steps list */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            const isPending = i > currentStep;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                  isActive ? 'bg-blue-50 border border-blue-200' :
                  isCompleted ? 'bg-gray-50' :
                  'opacity-40'
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 ${
                  isCompleted ? 'text-emerald-500' :
                  isActive ? 'text-[#4A90D9]' :
                  'text-gray-300'
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div className="relative">
                      {STEP_ICONS[i]}
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#4A90D9] rounded-full animate-pulse" />
                    </div>
                  ) : (
                    STEP_ICONS[i]
                  )}
                </div>

                {/* Text */}
                <span className={`text-sm font-medium ${
                  isCompleted ? 'text-gray-500 line-through' :
                  isActive ? 'text-gray-900' :
                  'text-gray-400'
                }`}>
                  {step}
                </span>

                {/* Spinner for active */}
                {isActive && (
                  <div className="ml-auto">
                    <div className="spinner w-4 h-4"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4A90D9] to-[#5B4BC4] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(((currentStep + 1) / steps.length) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            {currentStep + 1} / {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('preset');
  const [selectedPreset, setSelectedPreset] = useState<MockDataKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const pendingResultRef = useRef<{ result: any; request: any } | null>(null);
  const apiDoneRef = useRef(false);

  // zkTLS hook
  const { isInitialized: zkInitialized, isExtensionInstalled, startVerification } = useZkTls();

  const [customData, setCustomData] = useState({
    oracleName: '',
    dataType: 'price_feed',
    asset: '',
    value: '',
    referenceValues: '',
    sourceUrl: '',
  });

  // Progress step simulation
  const startProgress = useCallback(() => {
    setShowProgress(true);
    setProgressStep(0);
    pendingResultRef.current = null;
    apiDoneRef.current = false;
  }, []);

  // Navigate to result page
  const navigateToResult = useCallback(() => {
    const pending = pendingResultRef.current;
    if (!pending) return;
    sessionStorage.setItem('evaluationResult', JSON.stringify(pending.result));
    sessionStorage.setItem('evaluationRequest', JSON.stringify(pending.request));
    pendingResultRef.current = null;
    setShowProgress(false);
    setIsLoading(false);
    router.push('/result');
  }, [router]);

  useEffect(() => {
    if (!showProgress) return;

    const totalSteps = (t.submit as any).progress?.steps?.length ?? 8;

    // If we're on the last step and API is done, navigate after a short delay
    if (progressStep >= totalSteps - 1) {
      if (apiDoneRef.current && pendingResultRef.current) {
        const timer = setTimeout(navigateToResult, 600);
        return () => clearTimeout(timer);
      }
      return;
    }

    const timer = setTimeout(() => {
      setProgressStep((prev) => {
        const next = prev + 1;
        // Don't advance to last step until API is done
        if (next >= totalSteps - 1 && !apiDoneRef.current) {
          return prev; // stay on current step
        }
        return Math.min(next, totalSteps - 1);
      });
    }, STEP_INTERVALS[progressStep] ?? 600);

    return () => clearTimeout(timer);
  }, [showProgress, progressStep, t, navigateToResult]);

  // When API finishes and progress is stuck waiting, advance to last step
  useEffect(() => {
    if (!showProgress || !apiDoneRef.current) return;
    const totalSteps = (t.submit as any).progress?.steps?.length ?? 8;
    if (progressStep < totalSteps - 1) {
      setProgressStep(totalSteps - 1);
    }
  }, [showProgress, progressStep, t]);

  const doEvaluate = async (requestData: EvaluateRequest) => {
    setIsLoading(true);
    setError(null);
    startProgress();

    try {
      // Step 1: Frontend zkTLS verification (if extension is available)
      let zkTlsResult = null;
      if (zkInitialized && isExtensionInstalled) {
        console.log('[Submit] Starting frontend zkTLS verification...');
        // Generate a user address based on oracle name for attestation
        const userAddress = '0x' + Array.from(
          new TextEncoder().encode(requestData.oracleName)
        ).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 40).padEnd(40, '0');

        try {
          zkTlsResult = await startVerification(userAddress);
          console.log('[Submit] zkTLS verification result:', zkTlsResult);
        } catch (zkErr) {
          console.warn('[Submit] zkTLS verification failed, continuing with server fallback:', zkErr);
        }
      } else {
        console.log('[Submit] zkTLS extension not available, using server-side verification');
      }

      // Step 2: Call backend API with zkTLS result
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestData,
          // Include frontend zkTLS result if available
          clientZkTls: zkTlsResult ? {
            verified: zkTlsResult.verified,
            proofHash: zkTlsResult.proofHash,
            mode: zkTlsResult.mode,
            attestation: zkTlsResult.attestation,
          } : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Evaluation failed');
      }

      // Store result and signal that API is done
      pendingResultRef.current = { result, request: requestData };
      apiDoneRef.current = true;

      // If progress already reached the second-to-last step, force advance
      const totalSteps = (t.submit as any).progress?.steps?.length ?? 8;
      setProgressStep((prev) => {
        if (prev >= totalSteps - 2) return totalSteps - 1;
        return prev;
      });
    } catch (err) {
      setShowProgress(false);
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handlePresetSubmit = async () => {
    if (!selectedPreset) {
      setError(t.submit.selectError);
      return;
    }
    const data = MOCK_ORACLE_DATA[selectedPreset];
    await doEvaluate({
      ...data,
      referenceValues: data.referenceValues ? [...data.referenceValues] : undefined,
    });
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const request: EvaluateRequest = {
      oracleName: customData.oracleName,
      dataType: customData.dataType,
      dataValue: {
        asset: customData.asset,
        [customData.dataType.includes('weather') ? 'temperature' : 'price']: parseFloat(customData.value),
        timestamp: Date.now(),
      },
      sourceUrl: customData.sourceUrl || undefined,
      referenceValues: customData.referenceValues
        ? customData.referenceValues.split(',').map((v) => parseFloat(v.trim()))
        : undefined,
    };
    await doEvaluate(request);
  };

  const presetKeys: MockDataKey[] = ['chainlink_eth_usd', 'pyth_btc_usd', 'weather_nyc', 'suspicious_unknown'];

  const progressSteps: string[] = (t.submit as any).progress?.steps ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Modal */}
      {showProgress && (
        <ProgressModal currentStep={progressStep} steps={progressSteps} />
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-block mb-4">
          <span className="badge badge-brand">
            S.T.A.P. Evaluation
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.submit.title}</h1>
        <p className="text-gray-600">{t.submit.description}</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="tab-container">
          <button
            onClick={() => setActiveTab('preset')}
            className={`tab-button ${activeTab === 'preset' ? 'active' : ''}`}
          >
            {t.submit.tabPreset}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
          >
            {t.submit.tabCustom}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-box mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Preset Tab */}
      {activeTab === 'preset' && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">{t.submit.selectPrompt}</p>

          <div className="grid gap-4">
            {presetKeys.map((key) => {
              const preset = t.submit.presets[key];
              const isSuspicious = key === 'suspicious_unknown';

              return (
                <label
                  key={key}
                  className={`radio-card ${selectedPreset === key ? 'selected' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="radio-dot mt-0.5">
                      {selectedPreset === key && <span className="sr-only">Selected</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${isSuspicious ? 'text-amber-600' : 'text-gray-900'}`}>
                          {preset.label}
                        </span>
                        {isSuspicious && (
                          <span className="badge badge-warning">
                            TEST
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{preset.desc}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      key === 'chainlink_eth_usd' ? 'bg-emerald-500' :
                      key === 'pyth_btc_usd' ? 'bg-emerald-500' :
                      key === 'weather_nyc' ? 'bg-blue-500' :
                      'bg-amber-500'
                    }`}></div>
                    <input
                      type="radio"
                      name="preset"
                      value={key}
                      checked={selectedPreset === key}
                      onChange={() => setSelectedPreset(key)}
                      className="sr-only"
                    />
                  </div>
                </label>
              );
            })}
          </div>

          {/* Data Preview */}
          {selectedPreset && (
            <div className="card p-5">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#4A90D9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                {t.submit.dataPreview}
              </h3>
              <pre className="code-block text-xs overflow-auto">
                {JSON.stringify(MOCK_ORACLE_DATA[selectedPreset], null, 2)}
              </pre>
            </div>
          )}

          <button
            onClick={handlePresetSubmit}
            disabled={!selectedPreset || isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              !selectedPreset || isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="spinner w-5 h-5"></div>
                {t.submit.evaluating}
              </span>
            ) : (
              t.submit.evaluateSelected
            )}
          </button>
        </div>
      )}

      {/* Custom Tab */}
      {activeTab === 'custom' && (
        <form onSubmit={handleCustomSubmit} className="space-y-5">
          <div className="card p-6 space-y-5">
            {/* Oracle Name */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {t.submit.form.oracleName} <span className="text-[#4A90D9]">*</span>
              </label>
              <input
                type="text"
                value={customData.oracleName}
                onChange={(e) => setCustomData({ ...customData, oracleName: e.target.value })}
                placeholder={t.submit.form.oracleNamePlaceholder}
                required
                className="input-field"
              />
            </div>

            {/* Data Type */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {t.submit.form.dataType} <span className="text-[#4A90D9]">*</span>
              </label>
              <select
                value={customData.dataType}
                onChange={(e) => setCustomData({ ...customData, dataType: e.target.value })}
                className="select-field"
              >
                <option value="price_feed">{t.submit.form.dataTypes.price_feed}</option>
                <option value="weather">{t.submit.form.dataTypes.weather}</option>
                <option value="generic">{t.submit.form.dataTypes.generic}</option>
              </select>
            </div>

            {/* Asset */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {t.submit.form.asset} <span className="text-[#4A90D9]">*</span>
              </label>
              <input
                type="text"
                value={customData.asset}
                onChange={(e) => setCustomData({ ...customData, asset: e.target.value })}
                placeholder={t.submit.form.assetPlaceholder}
                required
                className="input-field"
              />
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {t.submit.form.value} <span className="text-[#4A90D9]">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={customData.value}
                onChange={(e) => setCustomData({ ...customData, value: e.target.value })}
                placeholder={t.submit.form.valuePlaceholder}
                required
                className="input-field"
              />
            </div>

            {/* Reference Values */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {t.submit.form.referenceValues}
              </label>
              <input
                type="text"
                value={customData.referenceValues}
                onChange={(e) => setCustomData({ ...customData, referenceValues: e.target.value })}
                placeholder={t.submit.form.referenceValuesPlaceholder}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1.5">{t.submit.form.referenceValuesHint}</p>
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {t.submit.form.sourceUrl}
              </label>
              <input
                type="url"
                value={customData.sourceUrl}
                onChange={(e) => setCustomData({ ...customData, sourceUrl: e.target.value })}
                placeholder={t.submit.form.sourceUrlPlaceholder}
                className="input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="spinner w-5 h-5"></div>
                {t.submit.evaluating}
              </span>
            ) : (
              t.submit.evaluateCustom
            )}
          </button>
        </form>
      )}
    </div>
  );
}
