'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'np';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    employees: 'Employees',
    leaves: 'Leaves',
    projects: 'Projects',
    travel: 'Travel',
    assets: 'Assets',
    fleet: 'Fleet',
    attendance: 'Attendance',
    wfh: 'WFH',
    timesheets: 'Timesheets',
    appraisals: 'Appraisals',
    notifications: 'Notifications',
    reports: 'Reports',
    'ngo settings': 'NGO Settings',
    logout: 'Logout',
    welcome: 'Welcome to the NGO Office Automation System.',
  },
  np: {
    dashboard: 'ड्यासबोर्ड',
    employees: 'कर्मचारीहरू',
    leaves: 'बिदा',
    projects: 'आयोजनाहरू',
    travel: 'यात्रा',
    assets: 'सम्पत्ति',
    fleet: 'सवारी साधन',
    attendance: 'हाजिरी',
    wfh: 'घरबाट काम',
    timesheets: 'समय पत्र',
    appraisals: 'मूल्यांकन',
    notifications: 'सूचनाहरू',
    reports: 'रिपोर्टहरू',
    'ngo settings': 'संस्था सेटिङहरू',
    logout: 'लगआउट',
    welcome: 'एनजीओ अफिस स्वचालन प्रणालीमा स्वागत छ।',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang) setLanguage(storedLang);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
