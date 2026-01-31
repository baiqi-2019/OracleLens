/**
 * OracleLens AI Reasoning Module
 *
 * Uses Anthropic Claude for intelligent formula selection and analysis.
 * Falls back to rule-based logic when no API credentials are configured.
 *
 * Environment Variables:
 * - ANTHROPIC_AUTH_TOKEN: API key for Anthropic
 * - ANTHROPIC_BASE_URL: Custom base URL (optional, defaults to https://api.anthropic.com)
 */

import Anthropic from '@anthropic-ai/sdk';

// ============================================
// Types
// ============================================

interface FormulaSelection {
  formulaId: string;
  formulaName: string;
  reasoning: string;
}

interface AIAnalysisInput {
  oracleName: string;
  dataType: string;
  dataValue: Record<string, unknown>;
  sourceUrl?: string;
  baseScores: {
    source: number;
    time: number;
    accuracy: number;
    proof: number;
  };
  zkVerified: boolean;
  finalScore: number;
  trustLevel: string;
}

// ============================================
// Anthropic Client
// ============================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_AUTH_TOKEN;
  if (!apiKey) return null;

  const baseURL = process.env.ANTHROPIC_BASE_URL || undefined;

  anthropicClient = new Anthropic({
    apiKey,
    baseURL,
  });

  console.log('[AI] Anthropic client initialized', baseURL ? `(custom URL: ${baseURL})` : '');
  return anthropicClient;
}

// ============================================
// AI-Powered Formula Selection
// ============================================

const FORMULA_PROMPT = `You are an oracle data credibility evaluation expert for OracleLens. Your task is to select the most appropriate scoring formula for evaluating oracle data credibility.

Available formulas:
1. price_feed_v1 (Price Feed Formula): Optimized for financial price data. Weights: source=0.25, time=0.30, accuracy=0.30, proof=0.15. Min acceptable score: 70.
2. weather_v1 (Weather Data Formula): For weather/environmental data. Weights: source=0.35, time=0.25, accuracy=0.20, proof=0.20. Min acceptable score: 60.
3. generic_v1 (Generic Formula): Balanced formula for other data types. Weights: source=0.25, time=0.25, accuracy=0.25, proof=0.25. Min acceptable score: 65.

Given the oracle data below, select the best formula and explain your reasoning in 2-3 sentences.

Oracle Name: {oracleName}
Data Type: {dataType}
Data Value: {dataValue}
Source URL: {sourceUrl}

Respond in this exact JSON format (no markdown, no code blocks):
{"formulaId": "...", "formulaName": "...", "reasoning": "..."}`;

export async function selectFormulaWithAI(
  oracleName: string,
  dataType: string,
  dataValue: Record<string, unknown>,
  sourceUrl?: string
): Promise<FormulaSelection> {
  const client = getAnthropicClient();

  if (!client) {
    // Fallback to rule-based selection
    return selectFormulaRuleBased(dataType);
  }

  try {
    const prompt = FORMULA_PROMPT
      .replace('{oracleName}', oracleName)
      .replace('{dataType}', dataType)
      .replace('{dataValue}', JSON.stringify(dataValue))
      .replace('{sourceUrl}', sourceUrl || 'N/A');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text.trim());

    return {
      formulaId: parsed.formulaId,
      formulaName: parsed.formulaName,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error('[AI] Formula selection failed, using fallback:', error);
    return selectFormulaRuleBased(dataType);
  }
}

// ============================================
// AI-Powered Analysis Reasoning
// ============================================

const ANALYSIS_PROMPT = `You are an oracle data credibility analyst for OracleLens. Analyze the following evaluation results and provide a concise expert analysis.

Oracle: {oracleName}
Data Type: {dataType}
Data: {dataValue}
Source URL: {sourceUrl}

Evaluation Results:
- Final Score: {finalScore}/100 ({trustLevel})
- Source Reliability: {sourceScore}%
- Time Freshness: {timeScore}%
- Data Consistency: {accuracyScore}%
- zkTLS Proof: {proofScore}% (verified: {zkVerified})

Formula Used: {formulaName} ({formulaId})

Provide a 3-5 sentence expert analysis covering:
1. Overall credibility assessment
2. Key strengths or concerns
3. Recommendation for using this data

Respond with plain text only (no JSON, no markdown).`;

export async function generateAIAnalysis(input: AIAnalysisInput): Promise<string> {
  const client = getAnthropicClient();

  if (!client) {
    return generateRuleBasedAnalysis(input);
  }

  try {
    const prompt = ANALYSIS_PROMPT
      .replace('{oracleName}', input.oracleName)
      .replace('{dataType}', input.dataType)
      .replace('{dataValue}', JSON.stringify(input.dataValue))
      .replace('{sourceUrl}', input.sourceUrl || 'N/A')
      .replace('{finalScore}', input.finalScore.toString())
      .replace('{trustLevel}', input.trustLevel.toUpperCase())
      .replace('{sourceScore}', Math.round(input.baseScores.source * 100).toString())
      .replace('{timeScore}', Math.round(input.baseScores.time * 100).toString())
      .replace('{accuracyScore}', Math.round(input.baseScores.accuracy * 100).toString())
      .replace('{proofScore}', Math.round(input.baseScores.proof * 100).toString())
      .replace('{zkVerified}', input.zkVerified ? 'yes' : 'no')
      .replace('{formulaName}', 'Price Feed Formula')
      .replace('{formulaId}', 'price_feed_v1');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text.trim();
  } catch (error) {
    console.error('[AI] Analysis generation failed, using fallback:', error);
    return generateRuleBasedAnalysis(input);
  }
}

// ============================================
// Rule-Based Fallbacks
// ============================================

function selectFormulaRuleBased(dataType: string): FormulaSelection {
  const type = dataType.toLowerCase();
  if (type.includes('price') || type.includes('token') || type.includes('exchange')) {
    return {
      formulaId: 'price_feed_v1',
      formulaName: 'Price Feed Formula',
      reasoning: 'Selected price feed formula based on data type pattern matching. This formula prioritizes time freshness and accuracy for financial data.',
    };
  }
  if (type.includes('weather') || type.includes('temperature')) {
    return {
      formulaId: 'weather_v1',
      formulaName: 'Weather Data Formula',
      reasoning: 'Selected weather formula based on data type. This formula emphasizes source reputation and allows for natural data variation.',
    };
  }
  return {
    formulaId: 'generic_v1',
    formulaName: 'Generic Formula',
    reasoning: 'Using balanced generic formula as data type does not match specialized patterns. All scoring factors are weighted equally.',
  };
}

const ORACLE_REPUTATION: Record<string, number> = {
  chainlink: 0.95,
  pyth: 0.90,
  api3: 0.85,
  band: 0.80,
  dia: 0.75,
  weatherapi: 0.80,
};

function generateRuleBasedAnalysis(input: AIAnalysisInput): string {
  const parts: string[] = [];

  parts.push(`AI Formula Selection Analysis`);
  parts.push(`============================`);
  parts.push('');
  parts.push(`Selected formula based on data type "${input.dataType}".`);
  parts.push('');

  const oracleTrust = ORACLE_REPUTATION[input.oracleName.toLowerCase()];
  if (oracleTrust) {
    parts.push(`Oracle "${input.oracleName}" is recognized with ${Math.round(oracleTrust * 100)}% base trust.`);
  } else {
    parts.push(`Oracle "${input.oracleName}" is not in our trusted database - applying extra scrutiny.`);
  }

  parts.push('');
  if (input.dataType.toLowerCase().includes('price')) {
    parts.push('Data type is financial price data - using formula optimized for:');
    parts.push('  - High accuracy requirements (30% weight)');
    parts.push('  - Time sensitivity (30% weight)');
  } else if (input.dataType.toLowerCase().includes('weather')) {
    parts.push('Data type is weather data - using formula that:');
    parts.push('  - Prioritizes source reputation (35% weight)');
    parts.push('  - Allows for natural variation');
  } else {
    parts.push('Using balanced generic formula with equal weights.');
  }

  parts.push('');
  if (input.zkVerified) {
    parts.push('zkTLS proof is available - this provides strong authenticity guarantees.');
  } else {
    parts.push('No zkTLS proof provided - relying on other factors for credibility assessment.');
  }

  return parts.join('\n');
}
