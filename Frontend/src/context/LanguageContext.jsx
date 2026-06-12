import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(null)

// Language translations
const translations = {
  en: {
    // Common
    welcome: 'Welcome',
    login: 'Login',
    signup: 'Signup',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    phone: 'Phone',
    role: 'Role',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    loading: 'Loading...',
    
    // Roles
    admin: 'Administrator',
    auditor: 'Auditor',
    user: 'User',
    
    // Dashboard
    dashboard: 'Dashboard',
    overview: 'Overview',
    totalStock: 'Total Stock',
    verifiedItems: 'Verified Items',
    pendingVerification: 'Pending Verification',
    totalUsers: 'Total Users',
    activeAuditors: 'Active Auditors',
    overdueVerifications: 'Overdue Verifications',
    recentActivities: 'Recent Activities',
    
    // Stock Management
    addStock: 'Add Stock',
    viewStock: 'View Stock',
    stockManagement: 'Stock Management',
    productName: 'Product Name',
    category: 'Category',
    quantity: 'Quantity',
    unit: 'Unit',
    description: 'Description',
    uploadImage: 'Upload Image',
    assignAuditor: 'Assign Auditor',
    verificationDeadline: 'Verification Deadline',
    saveStock: 'Save Stock',
    
    // Auditor
    verifyNow: 'Verify Now',
    assignedItems: 'Assigned Items',
    verifyStock: 'Verify Stock',
    uploadPhotos: 'Upload Photos',
    takePhoto: 'Take Photo',
    physicalCount: 'Physical Count',
    totalCounted: 'Total Counted',
    conditionBreakdown: 'Condition Breakdown',
    used: 'Used',
    good: 'Good',
    faulty: 'Faulty',
    remarks: 'Remarks',
    submitVerification: 'Submit Verification',
    daysLeft: 'days left',
    
    // User Dashboard
    myItems: 'My Items',
    issuedOn: 'Issued on',
    viewAllHistory: 'View All History',
    
    // Messages
    stockAddedSuccess: 'Stock added successfully!',
    verificationSubmitted: 'Verification submitted successfully!',
    loginSuccess: 'Login successful!',
    logoutSuccess: 'Logged out successfully!',
    invalidCredentials: 'Invalid email or password',
    pleaseUploadPhoto: 'Please upload at least 1 photo',
    breakdownMustMatch: 'Breakdown must match total count',
    discrepancyFound: 'Discrepancy found!',
    systemCount: 'System Count',
    yourCount: 'Your Count',
    difference: 'Difference',
    warning: 'Warning',
    
    // Navigation
    userManagement: 'User Management',
    requests: 'Requests',
    reports: 'Reports',
    auditAssignments: 'Audit Assignments',
    requestStock: 'Request Stock',
    reportIssues: 'Issued Stock',
    myRequests: 'My Requests',
    pendingAudits: 'Pending Audits',
    verificationQueue: 'Verification Queue',
    auditHistory: 'Audit History',
  },
  
  hi: {
    // Common
    welcome: 'स्वागत',
    login: 'लॉगिन',
    signup: 'साइन अप',
    logout: 'लॉगआउट',
    email: 'ईमेल',
    password: 'पासवर्ड',
    fullName: 'पूरा नाम',
    phone: 'फ़ोन',
    role: 'भूमिका',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    search: 'खोजें',
    loading: 'लोड हो रहा है...',
    
    // Roles
    admin: 'प्रशासक',
    auditor: 'ऑडिटर',
    user: 'उपयोगकर्ता',
    
    // Dashboard
    dashboard: 'डैशबोर्ड',
    overview: 'अवलोकन',
    totalStock: 'कुल स्टॉक',
    verifiedItems: 'सत्यापित वस्तुएं',
    pendingVerification: 'लंबित सत्यापन',
    totalUsers: 'कुल उपयोगकर्ता',
    activeAuditors: 'सक्रिय ऑडिटर',
    overdueVerifications: 'विलंबित सत्यापन',
    recentActivities: 'हाल की गतिविधियां',
    
    // Stock Management
    addStock: 'स्टॉक जोड़ें',
    viewStock: 'स्टॉक देखें',
    stockManagement: 'स्टॉक प्रबंधन',
    productName: 'उत्पाद का नाम',
    category: 'श्रेणी',
    quantity: 'मात्रा',
    unit: 'इकाई',
    description: 'विवरण',
    uploadImage: 'फोटो अपलोड करें',
    assignAuditor: 'ऑडिटर नियुक्त करें',
    verificationDeadline: 'सत्यापन की समय सीमा',
    saveStock: 'स्टॉक सेव करें',
    
    // Auditor
    verifyNow: 'अभी जांचें',
    assignedItems: 'सौंपी गई वस्तुएं',
    verifyStock: 'स्टॉक जांचें',
    uploadPhotos: 'फोटो अपलोड करें',
    takePhoto: 'फोटो लें',
    physicalCount: 'वास्तविक गणना',
    totalCounted: 'कुल गिना गया',
    conditionBreakdown: 'स्थिति विवरण',
    used: 'उपयोग में',
    good: 'अच्छा',
    faulty: 'खराब',
    remarks: 'टिप्पणी',
    submitVerification: 'सत्यापन जमा करें',
    daysLeft: 'दिन बाकी',
    
    // User Dashboard
    myItems: 'मेरा सामान',
    issuedOn: 'जारी किया गया',
    viewAllHistory: 'सभी इतिहास देखें',
    
    // Messages
    stockAddedSuccess: 'स्टॉक सफलतापूर्वक जोड़ा गया!',
    verificationSubmitted: 'सत्यापन सफलतापूर्वक जमा किया गया!',
    loginSuccess: 'लॉगिन सफल रहा!',
    logoutSuccess: 'लॉगआउट सफल रहा!',
    invalidCredentials: 'अमान्य ईमेल या पासवर्ड',
    pleaseUploadPhoto: 'कृपया कम से कम 1 फोटो अपलोड करें',
    breakdownMustMatch: 'विवरण कुल गणना से मेल खाना चाहिए',
    discrepancyFound: 'विसंगति मिली!',
    systemCount: 'सिस्टम गणना',
    yourCount: 'आपकी गणना',
    difference: 'अंतर',
    warning: 'चेतावनी',
    
    // Navigation
    userManagement: 'उपयोगकर्ता प्रबंधन',
    requests: 'अनुरोध',
    reports: 'रिपोर्ट',
    auditAssignments: 'ऑडिट असाइनमेंट',
    requestStock: 'स्टॉक का अनुरोध करें',
    reportIssues: 'जारी किया गया स्टॉक',
    myRequests: 'मेरे अनुरोध',
    pendingAudits: 'लंबित ऑडिट',
    verificationQueue: 'सत्यापन कतार',
    auditHistory: 'ऑडिट इतिहास',
  },
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'hi' // Default to Hindi
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en')
  }

  const t = (key) => {
    return translations[language][key] || key
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isHindi: language === 'hi',
    isEnglish: language === 'en',
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
