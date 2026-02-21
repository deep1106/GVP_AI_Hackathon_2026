import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import hi from './hi.json';
import gu from './gu.json';
import mr from './mr.json';
import ta from './ta.json';
import te from './te.json';
import kn from './kn.json';
import bn from './bn.json';
import ml from './ml.json';
import pa from './pa.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            hi: { translation: hi },
            gu: { translation: gu },
            mr: { translation: mr },
            ta: { translation: ta },
            te: { translation: te },
            kn: { translation: kn },
            bn: { translation: bn },
            ml: { translation: ml },
            pa: { translation: pa },
        },
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'fleetflow_lang',
        },
    });

export const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
];

export default i18n;
