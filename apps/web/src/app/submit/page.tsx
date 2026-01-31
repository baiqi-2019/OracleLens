'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { MOCK_ORACLE_DATA, MockDataKey, EvaluateRequest } from '@/lib/types';

type Tab = 'preset' | 'custom';

export default function SubmitPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('preset');
  const [selectedPreset, setSelectedPreset] = useState<MockDataKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customData, setCustomData] = useState({
    oracleName: '',
    dataType: 'price_feed',
    asset: '',
    value: '',
    referenceValues: '',
    sourceUrl: '',
  });

  const handlePresetSubmit = async () => {
    if (!selectedPreset) {
      setError(t.submit.selectError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = MOCK_ORACLE_DATA[selectedPreset];
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Evaluation failed');
      }

      sessionStorage.setItem('evaluationResult', JSON.stringify(result));
      sessionStorage.setItem('evaluationRequest', JSON.stringify(data));
      router.push('/result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
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

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Evaluation failed');
      }

      sessionStorage.setItem('evaluationResult', JSON.stringify(result));
      sessionStorage.setItem('evaluationRequest', JSON.stringify(request));
      router.push('/result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const presetKeys: MockDataKey[] = ['chainlink_eth_usd', 'pyth_btc_usd', 'weather_nyc', 'suspicious_unknown'];

  return (
    <div className="max-w-3xl mx-auto">
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
