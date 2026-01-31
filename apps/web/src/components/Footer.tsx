'use client';

import { useLanguage } from '@/lib/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-200 mt-auto bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-600 text-sm">
            {t.footer.text}
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4A90D9]"></span>
              Powered by zkTLS
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5B4BC4]"></span>
              AI-Assisted
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
