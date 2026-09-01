import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Lock, LogIn, UserPlus, Clock, Ban, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export const AccessRestricted = () => {
  const { language } = useLanguage();
  const { user, platformUser, statusMessage } = useAuth();
  const navigate = useNavigate();

  const getIcon = () => {
    if (!user) return <LogIn size={48} />;
    if (!platformUser) return <UserPlus size={48} />;
    if (!platformUser.is_active) return <Ban size={48} />;
    if (platformUser.approval_status === 'pending') return <Clock size={48} />;
    if (platformUser.approval_status === 'rejected') return <ShieldAlert size={48} />;
    if (platformUser.approval_status === 'suspended') return <Ban size={48} />;
    return <Lock size={48} />;
  };

  const getTitle = () => {
    if (!user) return language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please Sign In';
    if (!platformUser) return language === 'ar' ? 'مطلوب إكمال البيانات' : 'Profile Required';
    if (!platformUser.is_active) return language === 'ar' ? 'تم تعليق الحساب' : 'Account Suspended';
    if (platformUser.approval_status === 'pending') return language === 'ar' ? 'الحساب قيد المراجعة' : 'Account Under Review';
    if (platformUser.approval_status === 'rejected') return language === 'ar' ? 'تم رفض طلب التسجيل' : 'Registration Request Rejected';
    if (platformUser.approval_status === 'suspended') return language === 'ar' ? 'تم تعليق الحساب' : 'Account Suspended';
    return language === 'ar' ? 'دخول مقيد' : 'Restricted Access';
  };

  const getMessage = () => {
    if (statusMessage) return language === 'ar' ? statusMessage.ar : statusMessage.en;
    if (!user) {
      return language === 'ar' 
        ? 'التحليلات والتقارير المتقدمة تتطلب حساباً معتمداً. يرجى تسجيل الدخول أو طلب حساب جديد.' 
        : 'Advanced analytics and reports require an approved account. Please sign in or request a new account.';
    }

    if (platformUser && platformUser.approval_status === 'pending') {
      return language === 'ar'
        ? 'طلب حسابك قيد المراجعة، يرجى انتظار موافقة الإدارة.'
        : 'Your account request is under review, please wait for admin approval.';
    }
    
    if (platformUser && platformUser.approval_status === 'rejected') {
      return language === 'ar'
        ? 'تم رفض طلب التسجيل.'
        : 'Registration request was rejected.';
    }

    if (platformUser && (!platformUser.is_active || platformUser.approval_status === 'suspended')) {
      return language === 'ar'
        ? 'تم تعليق الحساب، يرجى التواصل مع الإدارة.'
        : 'Your account is suspended, please contact the administration.';
    }

    return language === 'ar' 
      ? 'هذا القسم مخصص للمستخدمين المعتمدين فقط. سيتم مراجعة بياناتك وتفعيل الوصول قريباً.' 
      : 'This section is for approved users only. Your data will be reviewed and access granted soon.';
  };

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center container mx-auto px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-[#0A1128] border border-[#1C2E5A] rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 md:p-12 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
        
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#121E3D] border border-[#1C2E5A] rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-[#D4AF37] mx-auto mb-6 sm:mb-8 shadow-xl">
          {getIcon()}
        </div>
        
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-4 sm:mb-6 uppercase tracking-tight">{getTitle()}</h2>
        
        <p className="text-gray-400 text-sm sm:text-lg md:text-xl font-bold leading-relaxed mb-8 sm:mb-10 whitespace-pre-line">
          {getMessage()}
        </p>

        {!user && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto bg-[#D4AF37] text-[#0A1128] px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg uppercase tracking-widest hover:bg-[#E5C158] transition-all shadow-xl shadow-[#D4AF37]/10"
            >
              {language === 'ar' ? 'تسجيل الدخول / طلب حساب' : 'Sign In / Request Account'}
            </button>
          </div>
        )}

        {user && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button 
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/');
              }}
              className="w-full sm:w-auto bg-[#1C2E5A] text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg uppercase tracking-widest hover:bg-[#25396D] transition-all shadow-xl border border-[#2A4075]"
            >
              {language === 'ar' ? 'تسجيل الخروج والرجوع' : 'Logout and Go Back'}
            </button>
          </div>
        )}

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-12 border-t border-[#1C2E5A]">
           <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">
             {language === 'ar' ? 'منصة الأسعار العالمية GPP - قسم التحليل الفني' : 'Global Pricing Platform - Technical Analysis Division'}
           </p>
        </div>
      </motion.div>
    </div>
  );
};
