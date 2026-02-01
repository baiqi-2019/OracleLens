'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function Home() {
  const { t } = useLanguage();

  // Expose oracle-data API endpoint for Primus zkTLS template discovery
  useEffect(() => {
    // Make a sample request to oracle-data endpoint so Primus can discover it
    const sampleRequestId = 'sample_zktls_template';
    fetch(`/api/oracle-data/${sampleRequestId}`)
      .then(res => res.json())
      .catch(() => {
        // Expected to fail with 404, but the request URL will be captured by Primus
      });
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-16 -mx-4 px-4 -mt-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t.home.subtitle}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.home.description}
          </p>

          <Link href="/submit" className="btn-primary inline-block text-lg px-8 py-4">
            {t.home.cta}
          </Link>
        </div>
      </section>

      {/* What OracleLens Is NOT */}
      <section className="warning-box">
        <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {t.home.notTitle}
        </h2>
        <ul className="text-amber-900 space-y-2">
          {t.home.notItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-amber-600 mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#4A90D9] to-[#5B4BC4]"></div>
          {t.home.howTitle}
        </h2>
        <div className="grid md:grid-cols-4 gap-5">
          {t.home.steps.map((step, i) => (
            <div key={i} className="card-gradient p-6 shadow-sm border border-gray-200">
              <div className="text-3xl font-bold gradient-text mb-3">
                {step.num}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring Factors */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#5B4BC4] to-[#4A90D9]"></div>
          {t.home.stapTitle}
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {Object.entries(t.home.stap).map(([key, item]) => (
            <div key={key} className="card p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white ${
                    key === 's' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                    key === 't' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                    key === 'a' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                    'bg-gradient-to-br from-purple-400 to-purple-600'
                  }`}
                >
                  {key.toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12">
        <div className="card inline-block p-10">
          <p className="text-gray-700 mb-6 text-lg">Ready to verify oracle data credibility?</p>
          <Link href="/submit" className="btn-primary inline-block text-lg px-10 py-4">
            {t.home.ctaBottom}
          </Link>
        </div>
      </section>
    </div>
  );
}
