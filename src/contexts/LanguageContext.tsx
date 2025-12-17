import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ja';

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  // --- GENERAL & NAVIGATION ---
  app_title: {
    en: 'Clarity Scan Aid',
    hi: 'क्लेरिटी स्कैन एड',
    kn: 'ಕ್ಲಾರಿಟಿ ಸ್ಕ್ಯಾನ್ ಏಡ್',
    ta: 'கிளாரிட்டி ஸ்கேன் எய்ட்',
    te: 'క్లారిటీ స్కాన్ ఎయిడ్',
    ja: 'クラリティスキャンエイド'
  },
  dashboard: {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    ta: 'முகப்பு',
    te: 'డాష్‌బోర్డ్',
    ja: 'ダッシュボード'
  },
  sign_in: {
    en: 'Sign In',
    hi: 'साइन इन करें',
    kn: 'ಸೈನ್ ಇನ್',
    ta: 'உள்நுழைக',
    te: 'సైన్ ఇన్',
    ja: 'サインイン'
  },
  sign_out: {
    en: 'Sign Out',
    hi: 'साइन आउट',
    kn: 'ಸೈನ್ ಔಟ್',
    ta: 'வெளியேறு',
    te: 'సైన్ అవుట్',
    ja: 'サインアウト'
  },
  access_restricted: {
    en: 'Access Restricted',
    hi: 'पहुँच प्रतिबंधित',
    kn: 'ಪ್ರವೇಶ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ',
    ta: 'அணுகல் மறுக்கப்பட்டது',
    te: 'యాక్సెస్ నిరోధించబడింది',
    ja: 'アクセス制限'
  },
  please_sign_in: {
    en: 'Please sign in to access diagnostic tools.',
    hi: 'नैदानिक उपकरणों का उपयोग करने के लिए कृपया साइन इन करें।',
    kn: 'ದಯವಿಟ್ಟು ಸೈನ್ ಇನ್ ಮಾಡಿ.',
    ta: 'தயவுசெய்து உள்நுழையவும்.',
    te: 'దయచేసి సైన్ ఇన్ చేయండి.',
    ja: '診断ツールにアクセスするにはサインインしてください。'
  },

  // --- UPLOAD PAGE ---
  upload_image: {
    en: 'Upload Image',
    hi: 'छवि अपलोड करें',
    kn: 'ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    ta: 'படத்தைப் பதிவேற்றவும்',
    te: 'చిత్రాన్ని అప్‌లోడ్ చేయండి',
    ja: '画像をアップロード'
  },
  upload_description: {
    en: 'Upload a retinal fundus image for AI-powered analysis.',
    hi: 'AI-संचालित विश्लेषण के लिए रेटिनल फंडस छवि अपलोड करें।',
    kn: 'AI ವಿಶ್ಲೇಷಣೆಗಾಗಿ ಕಣ್ಣಿನ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    ta: 'AI பகுப்பாய்விற்காக விழித்திரை படத்தை பதிவேற்றவும்.',
    te: 'AI విశ్లేషణ కోసం రెటీనా చిత్రాన్ని అప్‌లోడ్ చేయండి.',
    ja: 'AI分析のために眼底画像をアップロードしてください。'
  },
  analyze_btn: {
    en: 'Analyze Image',
    hi: 'छवि का विश्लेषण करें',
    kn: 'ಚಿತ್ರ ವಿಶ್ಲೇಷಿಸಿ',
    ta: 'படத்தை பகுப்பாய்வு செய்',
    te: 'చిత్రాన్ని విశ్లేషించండి',
    ja: '画像を分析'
  },
  analyzing: {
    en: 'Analyzing...',
    hi: 'विश्लेषण हो रहा है...',
    kn: 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
    ta: 'பகுப்பாய்வு செய்கிறது...',
    te: 'విశ్లేషించబడుతోంది...',
    ja: '分析中...'
  },
  analysis_complete: {
    en: 'Analysis Complete',
    hi: 'विश्लेषण पूर्ण',
    kn: 'ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ',
    ta: 'பகுப்பாய்வு முடிந்தது',
    te: 'విశ్లేషణ పూర్తయింది',
    ja: '分析完了'
  },
  upload_guidelines: {
    en: 'Upload Guidelines',
    hi: 'अपलोड दिशानिर्देश',
    kn: 'ಅಪ್‌ಲೋಡ್ ಮಾರ್ಗಸೂಚಿಗಳು',
    ta: 'பதிவேற்ற வழிகாட்டுதல்கள்',
    te: 'అప్‌లోడ్ మార్గదర్శకాలు',
    ja: 'アップロードガイドライン'
  },
  medical_disclaimer: {
    en: 'Medical Disclaimer: This AI analysis is for screening only.',
    hi: 'चिकित्सा अस्वीकरण: यह AI विश्लेषण केवल स्क्रीनिंग के लिए है।',
    kn: 'ವೈದ್ಯಕೀಯ ಹಕ್ಕು ನಿರಾಕರಣೆ: ಇದು ತಪಾಸಣೆಗಾಗಿ ಮಾತ್ರ.',
    ta: 'மருத்துவ மறுப்பு: இது திரையிடலுக்கு மட்டுமே.',
    te: 'వైద్య నిరాకరణ: ఇది స్క్రీనింగ్ కోసం మాత్రమే.',
    ja: '医療免責事項：このAI分析はスクリーニングのみを目的としています。'
  },

  // --- RESULTS PAGE ---
  results: {
    en: 'Analysis Results',
    hi: 'विश्लेषण परिणाम',
    kn: 'ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶಗಳು',
    ta: 'பகுப்பாய்வு முடிவுகள்',
    te: 'విశ్లేషణ ఫలితాలు',
    ja: '分析結果'
  },
  confidence: {
    en: 'Confidence',
    hi: 'आत्मविश्वास',
    kn: 'ವಿಶ್ವಾಸಾರ್ಹತೆ',
    ta: 'நம்பிக்கை',
    te: 'నమ్మకం',
    ja: '信頼度'
  },
  description: {
    en: 'Description',
    hi: 'विवरण',
    kn: 'ವಿವರಣೆ',
    ta: 'விளக்கம்',
    te: 'వివరణ',
    ja: '説明'
  },
  severity: {
    en: 'Severity Level',
    hi: 'गंभीरता स्तर',
    kn: 'ತೀವ್ರತೆಯ ಮಟ್ಟ',
    ta: 'தீவிரத்தன்மை',
    te: 'తీవ్రత స్థాయి',
    ja: '重症度'
  },
  urgency: {
    en: 'Urgency',
    hi: 'तात्कालिकता',
    kn: 'ತುರ್ತು',
    ta: 'அவசரம்',
    te: 'అత్యవసర',
    ja: '緊急度'
  },
  lesion_detection: {
    en: 'AI Lesion Detection',
    hi: 'AI घाव का पता लगाना',
    kn: 'AI ಗಾಯ ಪತ್ತೆ',
    ta: 'AI காயம் கண்டறிதல்',
    te: 'AI గాయం గుర్తింపు',
    ja: 'AI病変検出'
  },
  view_fullscreen: {
    en: 'View Fullscreen',
    hi: 'फुलस्क्रीन देखें',
    kn: 'ಪೂರ್ಣಪರದೆ ವೀಕ್ಷಿಸಿ',
    ta: 'முழுத்திரை',
    te: 'పూర్తి స్క్రీన్',
    ja: '全画面表示'
  },
  probability_dist: {
    en: 'Probability Distribution',
    hi: 'संभावना वितरण',
    kn: 'ಸಂಭವನೀಯತೆ ಹಂಚಿಕೆ',
    ta: 'நிகழ்தகவு',
    te: 'సంభావ్యత పంపిణీ',
    ja: '確率分布'
  },
  recommendations: {
    en: 'Recommendations',
    hi: 'सिफारिशें',
    kn: 'ಶಿಫಾರಸುಗಳು',
    ta: 'பரிந்துரைகள்',
    te: 'సిఫార్సులు',
    ja: '推奨事項'
  },
  find_specialists: {
    en: 'Find Specialists',
    hi: 'विशेषज्ञ खोजें',
    kn: 'ತಜ್ಞರನ್ನು ಹುಡುಕಿ',
    ta: 'நிபுணர்களைக் கண்டறியவும்',
    te: 'నిపుణులను కనుగొనండి',
    ja: '専門医を探す'
  },
  book_appointment: {
    en: 'Book Appointment',
    hi: 'अपॉइंटमेंट बुक करें',
    kn: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
    ta: 'நியமனம் பதிவு',
    te: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
    ja: '予約する'
  },
  share_results: {
    en: 'Share Results',
    hi: 'परिणाम साझा करें',
    kn: 'ಫಲಿತಾಂಶ ಹಂಚಿಕೊಳ್ಳಿ',
    ta: 'பகிர்',
    te: 'ఫలితాలను భాగస్వామ్యం చేయండి',
    ja: '結果を共有'
  },
  download_pdf: {
    en: 'Download PDF',
    hi: 'PDF डाउनलोड करें',
    kn: 'PDF ಡೌನ್‌ಲೋಡ್',
    ta: 'PDF பதிவிறக்கம்',
    te: 'PDF డౌన్‌లోడ్',
    ja: 'PDFをダウンロード'
  },

  // --- HISTORY PAGE ---
  history: {
    en: 'Scan History',
    hi: 'स्कैन इतिहास',
    kn: 'ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸ',
    ta: 'வரலாறு',
    te: 'స్కాన్ చరిత్ర',
    ja: 'スキャン履歴'
  },
  clear_history: {
    en: 'Clear All History',
    hi: 'सारा इतिहास मिटा दें',
    kn: 'ಇತಿಹಾಸ ಅಳಿಸಿ',
    ta: 'வரலாற்றை அழிக்கவும்',
    te: 'చరిత్రను తొలగించండి',
    ja: '履歴を消去'
  },
  total_scans: {
    en: 'Total Scans',
    hi: 'कुल स्कैन',
    kn: 'ಒಟ್ಟು ಸ್ಕ್ಯಾನ್‌ಗಳು',
    ta: 'மொத்த ஸ்கேன்',
    te: 'మొత్తం స్కాన్‌లు',
    ja: '総スキャン数'
  },
  normal_results: {
    en: 'Normal Results',
    hi: 'सामान्य परिणाम',
    kn: 'ಸಾಮಾನ್ಯ ಫಲಿತಾಂಶಗಳು',
    ta: 'சாதாரண முடிவுகள்',
    te: 'సాధారణ ఫలితాలు',
    ja: '正常な結果'
  },
  abnormal_results: {
    en: 'Issues Found',
    hi: 'समस्याएं मिलीं',
    kn: 'ಸಮಸ್ಯೆಗಳು',
    ta: 'கண்டறியப்பட்ட சிக்கல்கள்',
    te: 'గుర్తించిన సమస్యలు',
    ja: '異常あり'
  },
  search_placeholder: {
    en: 'Search date or disease...',
    hi: 'तारीख या बीमारी खोजें...',
    kn: 'ದಿನಾಂಕ ಅಥವಾ ರೋಗ ಹುಡುಕಿ...',
    ta: 'தேடு...',
    te: 'శోధించండి...',
    ja: '検索...'
  },
  no_scans: {
    en: 'No scans found.',
    hi: 'कोई स्कैन नहीं मिला।',
    kn: 'ಯಾವುದೇ ಸ್ಕ್ಯಾನ್‌ಗಳಿಲ್ಲ.',
    ta: 'ஸ்கேன் இல்லை.',
    te: 'స్కాన్‌లు లేవు.',
    ja: 'スキャンが見つかりません。'
  },

  // --- SETTINGS PAGE ---
  settings: {
    en: 'Settings',
    hi: 'सेटिंग्स',
    kn: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
    ta: 'அமைப்புகள்',
    te: 'సెట్టింగులు',
    ja: '設定'
  },
  appearance: {
    en: 'Appearance',
    hi: 'दिखावट',
    kn: 'ರೂಪ',
    ta: 'தோற்றம்',
    te: 'స్వరూపం',
    ja: '外観'
  },
  theme: {
    en: 'Theme',
    hi: 'थीम',
    kn: 'ಥೀಮ್',
    ta: 'தீம்',
    te: 'థీమ్',
    ja: 'テーマ'
  },
  language: {
    en: 'Language',
    hi: 'भाषा',
    kn: 'ಭಾಷೆ',
    ta: 'மொழி',
    te: 'భాష',
    ja: '言語'
  },
  personal_info: {
    en: 'Personal Information',
    hi: 'व्यक्तिगत जानकारी',
    kn: 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ',
    ta: 'தனிப்பட்ட தகவல்',
    te: 'వ్యక్తిగత సమాచారం',
    ja: '個人情報'
  },
  notifications: {
    en: 'Notifications',
    hi: 'सूचनाएं',
    kn: 'ಸೂಚನೆಗಳು',
    ta: 'அறிவிப்புகள்',
    te: 'నోటిఫికేషన్లు',
    ja: '通知'
  },
  data_privacy: {
    en: 'Data & Privacy',
    hi: 'डेटा और गोपनीयता',
    kn: 'ಡೇಟಾ ಗೌಪ್ಯತೆ',
    ta: 'தரவு தனியுரிமை',
    te: 'డేటా గోప్యత',
    ja: 'データとプライバシー'
  },
  share_data: {
    en: 'Share Anonymous Data',
    hi: 'गुमनाम डेटा साझा करें',
    kn: 'ಅನಾಮಧೇಯ ಡೇಟಾ ಹಂಚಿಕೊಳ್ಳಿ',
    ta: 'தரவைப் பகிரவும்',
    te: 'డేటాను భాగస్వామ్యం చేయండి',
    ja: '匿名データを共有'
  },
  export_data: {
    en: 'Export Data',
    hi: 'डेटा निर्यात करें',
    kn: 'ಡೇಟಾ ರಫ್ತು ಮಾಡಿ',
    ta: 'தரவை ஏற்றுமதி செய்',
    te: 'డేటా ఎగుమతి',
    ja: 'データのエクスポート'
  },
  delete_all: {
    en: 'Delete All Data',
    hi: 'सारा डेटा हटाएं',
    kn: 'ಎಲ್ಲಾ ಡೇಟಾ ಅಳಿಸಿ',
    ta: 'எல்லா தரவையும் நீக்கு',
    te: 'మొత్తం డేటాను తొలగించండి',
    ja: 'すべてのデータを削除'
  },

  // --- DISEASES ---
  normal: {
    en: 'Normal',
    hi: 'सामान्य',
    kn: 'ಸಾಮಾನ್ಯ',
    ta: 'சாதாரண',
    te: 'సాధారణ',
    ja: '正常'
  },
  cataract: {
    en: 'Cataract',
    hi: 'मोतियाबिंद',
    kn: 'ಕಣ್ಣಿನ ಪೊರೆ',
    ta: 'கண்புரை',
    te: 'కంటిశుక్లం',
    ja: '白内障'
  },
  glaucoma: {
    en: 'Glaucoma',
    hi: 'काला मोतिया',
    kn: 'ಗ್ಲುಕೋಮಾ',
    ta: 'கண்ணீர் அழுத்தம்',
    te: 'గ్లూకోమా',
    ja: '緑内障'
  },
  diabetic_retinopathy: {
    en: 'Diabetic Retinopathy',
    hi: 'मधुमेह रेटिनोपैथी',
    kn: 'ಮಧುಮೇಹದ ರೆಟಿನೋಪತಿ',
    ta: 'நீரிழிவு விழித்திரை நோய்',
    te: 'మధుమేహ రెటినోపతి',
    ja: '糖尿病網膜症'
  },
  unknown: {
    en: 'Unknown',
    hi: 'अज्ञात',
    kn: 'ಅಜ್ಞಾತ',
    ta: 'தெரியாத',
    te: 'తెలియదు',
    ja: '不明'
  }
};

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language') as Language;
    return saved || 'en';
  });

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    // Return translation if exists, else return default English or key as fallback
    return translations[key]?.[currentLanguage] || translations[key]?.['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const getLanguageOptions = () => [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'ja', label: '日本語' }
];
