'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';

export function Navigation() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/LeftTopLogo.png"
              alt="OracleLens"
              width={160}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* Nav Links & Language Switcher */}
          <div className="flex items-center gap-8">
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/"
                className="text-gray-700 hover:text-[#4A90D9] transition font-medium"
              >
                {t.nav.home}
              </Link>
              <Link
                href="/submit"
                className="text-gray-700 hover:text-[#4A90D9] transition font-medium"
              >
                {t.nav.evaluate}
              </Link>
            </div>

            {/* Language Switcher */}
            <div className="tab-container">
              <button
                onClick={() => setLanguage('en')}
                className={`tab-button ${language === 'en' ? 'active' : ''}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={`tab-button ${language === 'zh' ? 'active' : ''}`}
              >
                中文
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
