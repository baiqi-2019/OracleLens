/**
 * OracleLens i18n - Internationalization
 */

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Navigation
    nav: {
      home: 'Home',
      evaluate: 'Evaluate Data',
      language: 'EN',
    },

    // Home page
    home: {
      title: 'OracleLens',
      subtitle: 'Oracle Data Credibility Verification Layer',
      description: 'A credibility verification layer that evaluates whether oracle-provided data should be trusted before it reaches your smart contracts.',
      cta: 'Evaluate Oracle Data',
      ctaBottom: 'Try It Now - Evaluate Oracle Data',

      // What it is NOT
      notTitle: 'Important: What OracleLens Is NOT',
      notItems: [
        'OracleLens is <strong>NOT</strong> an oracle',
        'OracleLens does <strong>NOT</strong> provide price feeds or external data',
        'OracleLens sits <strong>BETWEEN</strong> oracle data and on-chain decisions',
      ],

      // How it works
      howTitle: 'How It Works',
      steps: [
        { num: '01', title: 'Submit Data', desc: 'Submit oracle data you want to verify (oracle name, data type, values)' },
        { num: '02', title: 'AI Selects Formula', desc: 'AI analyzes the data type and selects the appropriate scoring formula' },
        { num: '03', title: 'Calculate Score', desc: 'Evaluate source reliability, time freshness, consistency, and zkTLS proof' },
        { num: '04', title: 'Get Result', desc: 'Receive a credibility score with clear explanation of why' },
      ],

      // Scoring factors
      stapTitle: 'Scoring Factors (S.T.A.P.)',
      stap: {
        s: { title: 'S - Source Reliability', desc: 'How trusted is the oracle? Known oracles like Chainlink and Pyth have established reputations.' },
        t: { title: 'T - Time Freshness', desc: 'How fresh is the data? Stale data loses credibility exponentially.' },
        a: { title: 'A - Accuracy/Consistency', desc: 'Does the data align with other sources? Significant deviations are flagged.' },
        p: { title: 'P - Proof (zkTLS)', desc: 'Is there cryptographic proof of data authenticity via zero-knowledge TLS?' },
      },

      // Tech stack
      techTitle: 'Technology Stack',
      tech: {
        frontend: { title: 'Frontend & Backend', items: ['Next.js (App Router)', 'TypeScript', 'Tailwind CSS'] },
        verification: { title: 'Verification', items: ['Primus Labs zkTLS SDK', 'AI Formula Selection', 'Deterministic Scoring'] },
        onchain: { title: 'On-Chain', items: ['Solidity Smart Contracts', 'Foundry', 'Sepolia Testnet'] },
      },
    },

    // Submit page
    submit: {
      title: 'Evaluate Oracle Data',
      description: 'Submit oracle data to receive a credibility score based on source reliability, time freshness, consistency, and zkTLS verification.',
      tabPreset: 'Preset Examples',
      tabCustom: 'Custom Data',
      selectPrompt: 'Select a preset data source to test the evaluation:',
      dataPreview: 'Data Preview',
      evaluateSelected: 'Evaluate Selected Data',
      evaluateCustom: 'Evaluate Custom Data',
      evaluating: 'Evaluating...',
      selectError: 'Please select a data source',

      // Progress modal
      progress: {
        title: 'Evaluating Data',
        steps: [
          'Validating input data...',
          'AI selecting scoring formula...',
          'Calculating S.T.A.P. scores...',
          'zkTLS verifying data source...',
          'Generating AI analysis...',
          'Saving to database...',
          'Submitting result on-chain...',
          'Done!',
        ],
      },

      // Preset options
      presets: {
        chainlink_eth_usd: { label: 'Chainlink ETH/USD', desc: 'Highly trusted price feed with fresh data' },
        pyth_btc_usd: { label: 'Pyth BTC/USD', desc: 'Trusted price feed with very fresh data' },
        weather_nyc: { label: 'Weather NYC', desc: 'Weather data from WeatherAPI' },
        suspicious_unknown: { label: 'Suspicious Unknown Oracle', desc: 'Unknown source with stale, deviating data' },
      },

      // Form fields
      form: {
        oracleName: 'Oracle Name',
        oracleNamePlaceholder: 'e.g., Chainlink, Pyth, Custom Oracle',
        dataType: 'Data Type',
        dataTypes: { price_feed: 'Price Feed', weather: 'Weather Data', generic: 'Generic Data' },
        asset: 'Asset / Label',
        assetPlaceholder: 'e.g., ETH/USD, BTC/USD, NYC Temperature',
        value: 'Value',
        valuePlaceholder: 'e.g., 2500.00',
        referenceValues: 'Reference Values (optional)',
        referenceValuesPlaceholder: 'e.g., 2498, 2502, 2501 (comma-separated)',
        referenceValuesHint: 'Values from other oracles to compare against',
        sourceUrl: 'Source URL (optional)',
        sourceUrlPlaceholder: 'https://...',
      },
    },

    // Result page
    result: {
      title: 'Evaluation Result',
      requestId: 'Request ID',
      score: 'Score',
      trustLevel: 'Trust Level',
      loading: 'Loading results...',

      // Trust levels
      trust: {
        high: 'HIGH',
        medium: 'MEDIUM',
        low: 'LOW',
        untrusted: 'UNTRUSTED',
      },

      // Sections
      evaluatedData: 'Evaluated Data',
      oracle: 'Oracle',
      dataType: 'Data Type',
      value: 'Value',

      breakdown: 'Score Breakdown (S.T.A.P.)',
      breakdownLabels: {
        source: 'S - Source Reliability',
        time: 'T - Time Freshness',
        accuracy: 'A - Accuracy/Consistency',
        proof: 'P - Proof (zkTLS)',
      },

      formulaUsed: 'Formula Used',
      formula: 'Formula',

      zkTitle: 'zkTLS Verification',
      zkVerified: 'Verified',
      zkNotVerified: 'Not Verified',
      proofHash: 'Proof Hash',

      // On-chain
      onChainTitle: 'On-Chain Record',
      onChainSuccess: 'Submitted',
      onChainSkipped: 'Skipped',
      onChainFailed: 'Failed',
      txHash: 'Transaction Hash',
      blockNumber: 'Block Number',
      viewOnExplorer: 'View on Etherscan',

      explanation: 'Explanation',
      aiAnalysis: 'AI Analysis',

      // Actions
      evaluateAnother: 'Evaluate Another',
      copyJson: 'Copy JSON',
      copied: 'Result copied to clipboard',
      evaluatedAt: 'Evaluated at',
    },

    // Footer
    footer: {
      text: 'OracleLens - A credibility verification layer for oracle data',
    },
  },

  zh: {
    // Navigation
    nav: {
      home: '首页',
      evaluate: '评估数据',
      language: '中文',
    },

    // Home page
    home: {
      title: 'OracleLens',
      subtitle: '预言机数据可信度验证层',
      description: '一个可信度验证层，在预言机提供的数据到达您的智能合约之前，评估该数据是否应该被信任。',
      cta: '评估预言机数据',
      ctaBottom: '立即体验 - 评估预言机数据',

      // What it is NOT
      notTitle: '重要说明：OracleLens 不是什么',
      notItems: [
        'OracleLens <strong>不是</strong>预言机',
        'OracleLens <strong>不提供</strong>价格数据或外部数据',
        'OracleLens 位于预言机数据和链上决策<strong>之间</strong>',
      ],

      // How it works
      howTitle: '工作原理',
      steps: [
        { num: '01', title: '提交数据', desc: '提交您要验证的预言机数据（预言机名称、数据类型、数值）' },
        { num: '02', title: 'AI选择公式', desc: 'AI分析数据类型并选择合适的评分公式' },
        { num: '03', title: '计算分数', desc: '评估来源可靠性、时间新鲜度、一致性和zkTLS证明' },
        { num: '04', title: '获取结果', desc: '获得可信度评分和清晰的原因说明' },
      ],

      // Scoring factors
      stapTitle: '评分因子 (S.T.A.P.)',
      stap: {
        s: { title: 'S - 来源可靠性', desc: '预言机有多可信？Chainlink和Pyth等知名预言机已建立良好声誉。' },
        t: { title: 'T - 时间新鲜度', desc: '数据有多新鲜？过时的数据会呈指数级失去可信度。' },
        a: { title: 'A - 准确性/一致性', desc: '数据是否与其他来源一致？显著偏差会被标记。' },
        p: { title: 'P - 证明 (zkTLS)', desc: '是否有通过零知识TLS证明的数据真实性加密证明？' },
      },

      // Tech stack
      techTitle: '技术栈',
      tech: {
        frontend: { title: '前端 & 后端', items: ['Next.js (App Router)', 'TypeScript', 'Tailwind CSS'] },
        verification: { title: '验证层', items: ['Primus Labs zkTLS SDK', 'AI公式选择', '确定性评分'] },
        onchain: { title: '链上', items: ['Solidity智能合约', 'Foundry', 'Sepolia测试网'] },
      },
    },

    // Submit page
    submit: {
      title: '评估预言机数据',
      description: '提交预言机数据，基于来源可靠性、时间新鲜度、一致性和zkTLS验证获得可信度评分。',
      tabPreset: '预设示例',
      tabCustom: '自定义数据',
      selectPrompt: '选择一个预设数据源进行测试：',
      dataPreview: '数据预览',
      evaluateSelected: '评估所选数据',
      evaluateCustom: '评估自定义数据',
      evaluating: '评估中...',
      selectError: '请选择一个数据源',

      // Progress modal
      progress: {
        title: '数据评估中',
        steps: [
          '验证输入数据...',
          'AI 选择评分公式...',
          '计算 S.T.A.P. 分数...',
          'zkTLS 验证数据来源...',
          '生成 AI 分析报告...',
          '保存到数据库...',
          '提交结果上链...',
          '完成！',
        ],
      },

      // Preset options
      presets: {
        chainlink_eth_usd: { label: 'Chainlink ETH/USD', desc: '高度可信的价格源，数据新鲜' },
        pyth_btc_usd: { label: 'Pyth BTC/USD', desc: '可信的价格源，数据非常新鲜' },
        weather_nyc: { label: '纽约天气', desc: '来自WeatherAPI的天气数据' },
        suspicious_unknown: { label: '可疑的未知预言机', desc: '未知来源，数据过时且有偏差' },
      },

      // Form fields
      form: {
        oracleName: '预言机名称',
        oracleNamePlaceholder: '例如：Chainlink, Pyth, 自定义预言机',
        dataType: '数据类型',
        dataTypes: { price_feed: '价格数据', weather: '天气数据', generic: '通用数据' },
        asset: '资产 / 标签',
        assetPlaceholder: '例如：ETH/USD, BTC/USD, 纽约气温',
        value: '数值',
        valuePlaceholder: '例如：2500.00',
        referenceValues: '参考值（可选）',
        referenceValuesPlaceholder: '例如：2498, 2502, 2501（逗号分隔）',
        referenceValuesHint: '来自其他预言机的数值用于对比',
        sourceUrl: '数据源URL（可选）',
        sourceUrlPlaceholder: 'https://...',
      },
    },

    // Result page
    result: {
      title: '评估结果',
      requestId: '请求ID',
      score: '评分',
      trustLevel: '信任等级',
      loading: '加载结果中...',

      // Trust levels
      trust: {
        high: '高可信',
        medium: '中等可信',
        low: '低可信',
        untrusted: '不可信',
      },

      // Sections
      evaluatedData: '评估数据',
      oracle: '预言机',
      dataType: '数据类型',
      value: '数值',

      breakdown: '评分详情 (S.T.A.P.)',
      breakdownLabels: {
        source: 'S - 来源可靠性',
        time: 'T - 时间新鲜度',
        accuracy: 'A - 准确性/一致性',
        proof: 'P - 证明 (zkTLS)',
      },

      formulaUsed: '使用公式',
      formula: '公式',

      zkTitle: 'zkTLS 验证',
      zkVerified: '已验证',
      zkNotVerified: '未验证',
      proofHash: '证明哈希',

      // On-chain
      onChainTitle: '链上记录',
      onChainSuccess: '已提交',
      onChainSkipped: '已跳过',
      onChainFailed: '失败',
      txHash: '交易哈希',
      blockNumber: '区块高度',
      viewOnExplorer: '在 Etherscan 查看',

      explanation: '说明',
      aiAnalysis: 'AI 分析',

      // Actions
      evaluateAnother: '再次评估',
      copyJson: '复制JSON',
      copied: '结果已复制到剪贴板',
      evaluatedAt: '评估时间',
    },

    // Footer
    footer: {
      text: 'OracleLens - 预言机数据可信度验证层',
    },
  },
};

export type Translations = typeof translations['en'];
