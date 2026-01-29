import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'th';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggle: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      toggle: () => set((state) => ({ language: state.language === 'en' ? 'th' : 'en' })),
    }),
    {
      name: 'language-storage',
    }
  )
);

// Stage translations
export const stageTranslations = {
  all: {
    en: 'All',
    th: 'All',
  },
  to_convert: {
    en: 'Leads',
    th: 'Leads',
  },
  to_pay: {
    en: 'To Pay Premium',
    th: 'รอชำระเบี้ย',
  },
  to_report: {
    en: 'To Report Sale',
    th: 'รอแจ้งงานไปบ.ประกัน',
  },
  to_issue: {
    en: 'To Issue Policy',
    th: 'แจ้งงานแล้ว/รอออกกรม',
  },
  to_deliver: {
    en: 'To Deliver Policy',
    th: 'กรมออกแล้ว/รอจัดส่ง',
  },
  completed: {
    en: 'Completed',
    th: 'กรมออกแล้ว/จัดส่งแล้ว',
  },
  cancelled: {
    en: 'Cancellation',
    th: 'รอยกเลิก/ยกเลิกแล้ว',
  },
} as const;

export type StageKey = keyof typeof stageTranslations;
