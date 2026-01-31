'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_ORACLE_DATA, MockDataKey, EvaluateRequest } from '@/lib/types';

type Tab = 'preset' | 'custom';

export default function SubmitPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('preset');
  const [selectedPreset, setSelectedPreset] = useState<MockDataKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom form state
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
      setError('Please select a data source');
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

      // Store result and navigate
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

  const presetOptions: { key: MockDataKey; label: string; description: string }[] = [
    {
      key: 'chainlink_eth_usd',
      label: 'Chainlink ETH/USD',
      description: 'Highly trusted price feed with fresh data',
    },
    {
      key: 'pyth_btc_usd',
      label: 'Pyth BTC/USD',
      description: 'Trusted price feed with very fresh data',
    },
    {
      key: 'weather_nyc',
      label: 'Weather NYC',
      description: 'Weather data from WeatherAPI',
    },
    {
      key: 'suspicious_unknown',
      label: 'Suspicious Unknown Oracle',
      description: 'Unknown source with stale, deviating data',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluate Oracle Data</h1>
      <p className="text-gray-600 mb-8">
        Submit oracle data to receive a credibility score based on source reliability,
        time freshness, consistency, and zkTLS verification.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('preset')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'preset'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Preset Examples
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'custom'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Custom Data
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Preset Tab */}
      {activeTab === 'preset' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a preset data source to test the evaluation:
          </p>

          <div className="space-y-3">
            {presetOptions.map((option) => (
              <label
                key={option.key}
                className={`block p-4 border rounded-lg cursor-pointer transition ${
                  selectedPreset === option.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="preset"
                    value={option.key}
                    checked={selectedPreset === option.key}
                    onChange={() => setSelectedPreset(option.key)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {selectedPreset && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Data Preview</h3>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(MOCK_ORACLE_DATA[selectedPreset], null, 2)}
              </pre>
            </div>
          )}

          <button
            onClick={handlePresetSubmit}
            disabled={!selectedPreset || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition ${
              !selectedPreset || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Evaluating...' : 'Evaluate Selected Data'}
          </button>
        </div>
      )}

      {/* Custom Tab */}
      {activeTab === 'custom' && (
        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Oracle Name *
            </label>
            <input
              type="text"
              value={customData.oracleName}
              onChange={(e) => setCustomData({ ...customData, oracleName: e.target.value })}
              placeholder="e.g., Chainlink, Pyth, Custom Oracle"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Type *
            </label>
            <select
              value={customData.dataType}
              onChange={(e) => setCustomData({ ...customData, dataType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="price_feed">Price Feed</option>
              <option value="weather">Weather Data</option>
              <option value="generic">Generic Data</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset / Label *
            </label>
            <input
              type="text"
              value={customData.asset}
              onChange={(e) => setCustomData({ ...customData, asset: e.target.value })}
              placeholder="e.g., ETH/USD, BTC/USD, NYC Temperature"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value *
            </label>
            <input
              type="number"
              step="any"
              value={customData.value}
              onChange={(e) => setCustomData({ ...customData, value: e.target.value })}
              placeholder="e.g., 2500.00"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Values (optional)
            </label>
            <input
              type="text"
              value={customData.referenceValues}
              onChange={(e) => setCustomData({ ...customData, referenceValues: e.target.value })}
              placeholder="e.g., 2498, 2502, 2501 (comma-separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Values from other oracles to compare against
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source URL (optional)
            </label>
            <input
              type="url"
              value={customData.sourceUrl}
              onChange={(e) => setCustomData({ ...customData, sourceUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Evaluating...' : 'Evaluate Custom Data'}
          </button>
        </form>
      )}
    </div>
  );
}
