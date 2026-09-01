import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Loader2, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, LockKeyhole, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

type AuthState = 'login' | 'register';

export const Auth = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  
  const [authState, setAuthState] = useState<AuthState>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const generateInternalEmail = async (name: string, phone: string) => {
    // Deterministic internal email derivation from name and phone
    const normalized = `${name.trim().toLowerCase()}_${phone.trim()}`;
    const msgUint8 = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hashHex}@platform.local`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const rawName = formData.fullName.trim();
      const rawPhone = formData.phone || '';
      const cleanedPhone = rawPhone.replace(/[\s\-()]/g, '');

      if (!rawName || !cleanedPhone || !formData.password) {
        throw new Error(language === 'ar' ? 'يرجى إدخال جميع الحقول المطلوبة.' : 'Please enter all required fields.');
      }

      // Strict international phone format check:
      // Must start with '00', contain only digits, no '+', no local 09, min 8 digits total (e.g. 00218912345678)
      if (!/^00\d{6,15}$/.test(cleanedPhone) || cleanedPhone.includes('+') || /^09/.test(cleanedPhone)) {
        throw new Error(language === 'ar' 
          ? 'يرجى إدخال رقم الهاتف بالصيغة الدولية التي تبدأ بـ 00، مثال: 00218912345678'
          : 'Please enter the phone number in international format starting with 00, e.g. 00218912345678.'
        );
      }

      const email = await generateInternalEmail(rawName, cleanedPhone);

      if (authState === 'login') {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password
        });
        
        if (authError || !authData.user) {
          throw new Error(language === 'ar' ? 'بيانات الدخول غير صحيحة.' : 'Invalid sign-in credentials.');
        }
        
        navigate('/');
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error(language === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
        }

        const passwordValid = formData.password.length >= 8 && /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) && /\d/.test(formData.password);
        if (!passwordValid) {
          throw new Error(language === 'ar' 
            ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل وتحتوي على حروف وأرقام.' 
            : 'Password must be at least 8 characters long and contain letters and numbers.'
          );
        }

        const { error: authError } = await supabase.auth.signUp({
          email,
          password: formData.password,
          options: {
            data: {
              full_name: rawName,
              phone: cleanedPhone
            }
          }
        });

        if (authError) {
          throw new Error(language === 'ar' 
            ? 'تعذر إنشاء الحساب بهذه البيانات. يرجى التواصل مع الإدارة.' 
            : 'Unable to create an account with these details. Please contact the administrator.'
          );
        }

        setSuccess(language === 'ar' 
          ? 'تم إرسال طلب التسجيل بنجاح. طلب حسابك قيد المراجعة، يرجى انتظار موافقة الإدارة.' 
          : 'Your registration request has been submitted successfully. Your account is currently under review. Please wait for administrator approval.'
        );
        
        setFormData({ fullName: '', phone: '', password: '', confirmPassword: '' });
        setAuthState('login');
        
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || (language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'));
    } finally {
      setLoading(false);
    }
  };

  // If settings or auth are still loading, show clean loading spinner to prevent flicker
  if (settingsLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#050A18] py-20 px-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1C2E5A] border-t-[#D4AF37] rounded-full animate-spin"></div>
      </div>
    );
  }

  // If auth UI is disabled and user is not logged in, show unavailable view
  if (!settings.authUiEnabled && !user) {
    return (
      <div className="min-h-screen bg-[#050A18] py-20 px-4 flex items-center justify-center">
        <div className="w-full max-w-md relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A1128] border border-[#1C2E5A] rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
            
            <div className="w-16 h-16 bg-[#121E3D] border border-[#1C2E5A] rounded-2xl flex items-center justify-center text-[#D4AF37] mx-auto mb-8 shadow-xl">
              <LockKeyhole size={32} />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-4">
              {language === 'ar' ? 'تسجيل الدخول غير متاح حاليًا' : 'Sign in is currently unavailable'}
            </h1>
            
            <p className="text-sm md:text-base font-bold text-gray-400 mb-8 leading-relaxed">
              {language === 'ar' 
                ? 'تم تعطيل واجهة تسجيل الدخول وطلب الحسابات مؤقتًا. يرجى المتابعة لاحقًا أو العودة للصفحة الرئيسية.' 
                : 'Login and account registration are temporarily disabled. Please check back later or return to home.'}
            </p>

            <Link
              to="/"
              className="w-full bg-[#D4AF37] text-[#0A1128] py-4 px-6 rounded-2xl font-black text-sm md:text-base uppercase tracking-widest hover:bg-[#E5C158] transition-all shadow-xl shadow-[#D4AF37]/10 flex items-center justify-center gap-2"
            >
              <Home size={18} />
              <span>{language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home Page'}</span>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050A18] py-10 sm:py-20 px-3.5 sm:px-4 flex items-center justify-center">
      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A1128] border border-[#1C2E5A] rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
          
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#121E3D] border border-[#1C2E5A] rounded-2xl flex items-center justify-center text-[#D4AF37] mx-auto mb-6 sm:mb-8 shadow-xl">
            {authState === 'login' ? <ShieldCheck size={26} /> : <User size={26} />}
          </div>

          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2">
              {authState === 'login' 
                ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
                : (language === 'ar' ? 'طلب حساب جديد' : 'Request New Account')}
            </h1>
            <p className="text-xs sm:text-base font-bold text-gray-400">
              {language === 'ar' ? 'الوصول إلى لوحة المعلومات' : 'Access the dashboard'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-6 flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-500/10 border border-green-500/30 text-green-500 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-6 flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <p>{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest px-1">
                {language === 'ar' ? 'الاسم' : 'Name'}
              </label>
              <div className="relative">
                <User className={`absolute ${language === 'ar' ? 'right-3.5 sm:right-4' : 'left-3.5 sm:left-4'} top-1/2 -translate-y-1/2 text-gray-500`} size={18} />
                <input
                  type="text"
                  required
                  placeholder={language === 'ar' ? 'أدخل الاسم' : 'Enter name'}
                  className={`w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl sm:rounded-2xl py-3.5 sm:py-4 ${language === 'ar' ? 'pr-11 sm:pr-12 pl-4' : 'pl-11 sm:pl-12 pr-4'} text-white focus:border-[#D4AF37] outline-none transition-all font-bold text-base placeholder:text-gray-600 placeholder:font-normal`}
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest px-1">
                {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className={`absolute ${language === 'ar' ? 'right-3.5 sm:right-4' : 'left-3.5 sm:left-4'} top-1/2 -translate-y-1/2 text-gray-500`} size={18} />
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  placeholder="00218912345678"
                  pattern="^00[0-9]+$"
                  title={language === 'ar' 
                    ? 'يرجى إدخال رقم الهاتف بالصيغة الدولية التي تبدأ بـ 00، مثال: 00218912345678'
                    : 'Please enter the phone number in international format starting with 00, e.g. 00218912345678.'}
                  className={`w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl sm:rounded-2xl py-3.5 sm:py-4 ${language === 'ar' ? 'pr-11 sm:pr-12 pl-4' : 'pl-11 sm:pl-12 pr-4'} text-white focus:border-[#D4AF37] outline-none transition-all font-bold text-base placeholder:text-gray-600 placeholder:font-normal`}
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-bold px-1">
                {language === 'ar' 
                  ? 'مثال: 00218912345678 (يبدأ بـ 00 بدون علامة + وبدون مسافات)' 
                  : 'Example: 00218912345678 (starts with 00 without + or spaces)'}
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest px-1">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className={`absolute ${language === 'ar' ? 'right-3.5 sm:right-4' : 'left-3.5 sm:left-4'} top-1/2 -translate-y-1/2 text-gray-500`} size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-11 sm:px-12 text-white focus:border-[#D4AF37] outline-none transition-all font-bold text-base"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${language === 'ar' ? 'left-3.5 sm:left-4' : 'right-3.5 sm:right-4'} top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1`}
                  aria-label={language === 'ar' ? (showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showPassword ? 'Hide password' : 'Show password')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {authState === 'register' && (
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest px-1">
                  {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${language === 'ar' ? 'right-3.5 sm:right-4' : 'left-3.5 sm:left-4'} top-1/2 -translate-y-1/2 text-gray-500`} size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-[#121E3D] border border-[#1C2E5A] rounded-xl sm:rounded-2xl py-3.5 sm:py-4 px-11 sm:px-12 text-white focus:border-[#D4AF37] outline-none transition-all font-bold text-base"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute ${language === 'ar' ? 'left-3.5 sm:left-4' : 'right-3.5 sm:right-4'} top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1`}
                    aria-label={language === 'ar' ? (showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showConfirmPassword ? 'Hide password' : 'Show password')}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-[#0A1128] py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base uppercase tracking-widest hover:bg-[#E5C158] transition-all shadow-xl shadow-[#D4AF37]/10 flex items-center justify-center gap-2.5 sm:gap-3 disabled:opacity-50 mt-6 sm:mt-8"
            >
              {loading ? (
               <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {authState === 'login' && <ShieldCheck size={20} />}
                  {authState === 'register' && <User size={20} />}
                  <span>
                    {authState === 'login' 
                       ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In') 
                       : (language === 'ar' ? 'إرسال طلب التسجيل' : 'Send Registration Request')}
                  </span>
                </>
              )}
            </button>

            <div className="pt-4 sm:pt-6 border-t border-[#1C2E5A] text-center flex flex-col gap-3">
              {authState !== 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthState('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest hover:text-[#D4AF37] transition-all flex items-center justify-center gap-2 mx-auto py-1"
                >
                  <span>{language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}</span>
                  {language === 'ar' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                </button>
              )}
              
              {authState === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthState('register');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest hover:text-[#D4AF37] transition-all flex items-center justify-center gap-2 mx-auto py-1"
                >
                  <span>{language === 'ar' ? 'طلب حساب جديد' : "Request New Account"}</span>
                  {language === 'ar' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
