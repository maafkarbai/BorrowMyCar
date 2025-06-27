// src/context/LanguageContext.jsx - Bilingual UI Support
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

// Language translations
const translations = {
  en: {
    // Navigation
    home: "Home",
    browseCars: "Browse Cars",
    howItWorks: "How It Works",
    myBookings: "My Bookings",
    listCar: "List Car",
    profile: "Profile",
    settings: "Settings",
    signIn: "Sign In",
    getStarted: "Get Started",
    logout: "Logout",

    // Common
    loading: "Loading...",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    price: "Price",
    location: "Location",
    available: "Available",
    unavailable: "Unavailable",
    verified: "Verified",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
    completed: "Completed",

    // Home page
    welcomeTitle: "Welcome to BorrowMyCar",
    welcomeSubtitle: "Your one-stop solution for car rentals. Explore our services and find the perfect car for your needs.",
    searchPlaceholder: "Search cars by make, model, or location...",

    // Car details
    perDay: "/day",
    bookNow: "Book Now",
    contactOwner: "Contact Owner",
    carFeatures: "Car Features",
    carSpecifications: "Specifications",
    availability: "Availability",
    reviews: "Reviews",

    // Booking
    selectDates: "Select Dates",
    pickupDate: "Pickup Date",
    returnDate: "Return Date",
    totalCost: "Total Cost",
    securityDeposit: "Security Deposit",
    deliveryFee: "Delivery Fee",
    confirm: "Confirm",
    cancel: "Cancel",

    // Messages
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Information",
  },
  ar: {
    // Navigation
    home: "الرئيسية",
    browseCars: "تصفح السيارات",
    howItWorks: "كيف يعمل",
    myBookings: "حجوزاتي",
    listCar: "أضف سيارة",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    signIn: "تسجيل الدخول",
    getStarted: "ابدأ الآن",
    logout: "تسجيل الخروج",

    // Common
    loading: "جاري التحميل...",
    search: "بحث",
    filter: "تصفية",
    sort: "ترتيب",
    price: "السعر",
    location: "الموقع",
    available: "متاح",
    unavailable: "غير متاح",
    verified: "محقق",
    pending: "قيد الانتظار",
    approved: "موافق عليه",
    rejected: "مرفوض",
    cancelled: "ملغى",
    completed: "مكتمل",

    // Home page
    welcomeTitle: "مرحباً بك في استعارة سيارتي",
    welcomeSubtitle: "حلك الشامل لتأجير السيارات. استكشف خدماتنا واعثر على السيارة المثالية لاحتياجاتك.",
    searchPlaceholder: "ابحث عن السيارات حسب الماركة أو الموديل أو الموقع...",

    // Car details
    perDay: "/يوم",
    bookNow: "احجز الآن",
    contactOwner: "تواصل مع المالك",
    carFeatures: "مميزات السيارة",
    carSpecifications: "المواصفات",
    availability: "التوفر",
    reviews: "التقييمات",

    // Booking
    selectDates: "اختر التواريخ",
    pickupDate: "تاريخ الاستلام",
    returnDate: "تاريخ الإرجاع",
    totalCost: "التكلفة الإجمالية",
    securityDeposit: "التأمين",
    deliveryFee: "رسوم التوصيل",
    confirm: "تأكيد",
    cancel: "إلغاء",

    // Messages
    success: "نجح",
    error: "خطأ",
    warning: "تحذير",
    info: "معلومات",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const [isRTL, setIsRTL] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "en";
    setLanguage(savedLanguage);
    setIsRTL(savedLanguage === "ar");
    
    // Update document direction
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = savedLanguage;
  }, []);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    setIsRTL(newLanguage === "ar");
    localStorage.setItem("language", newLanguage);
    
    // Update document direction
    document.documentElement.dir = newLanguage === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLanguage;
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const value = {
    language,
    isRTL,
    changeLanguage,
    t,
    availableLanguages: [
      { code: "en", name: "English", nativeName: "English" },
      { code: "ar", name: "Arabic", nativeName: "العربية" },
    ],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export default LanguageProvider;