import React, { useState } from 'react';
import { Mail, MessageSquare, Send, User, CheckCircle, AlertCircle, Phone, MapPin, Globe, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export const Contact = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');
    
    console.log('Sending contact message...');

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          subject: formData.subject,
          message: formData.message,
          status: 'new',
          is_read: false
        });

      if (error) {
        console.error('Insert failed:', error);
        console.error('Contact message submit error:', error);
        throw error;
      }
      
      console.log('Insert success');
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Insert failed:', error);
      console.error('Error sending message:', error);
      setErrorMessage(error.message || 'Unknown error occurred');
      setStatus('error');
    }
  };

  return (
    <div className="pt-16 sm:pt-24 pb-12 sm:pb-20 min-h-screen bg-[#050A18]">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#D4AF37]/10 mb-4 sm:mb-6 transform rotate-3">
            <Mail size={32} className="text-[#D4AF37] -rotate-3" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 tracking-tight">
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">
            {language === 'ar' 
              ? 'نحن هنا للإجابة على استفساراتكم وتقديم الدعم الفني اللازم. لا تتردد في مراسلتنا.' 
              : 'We are here to answer your inquiries and provide the necessary technical support. Do not hesitate to contact us.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 sm:p-6 hover:border-[#D4AF37]/50 transition-all group">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1C2E5A] flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold mb-0.5 sm:mb-1 text-sm sm:text-base">{language === 'ar' ? 'العنوان' : 'Address'}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                    {language === 'ar' ? settings.contactAddressAr : settings.contactAddressEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 sm:p-6 hover:border-[#D4AF37]/50 transition-all group">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1C2E5A] flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shrink-0">
                  <Phone size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold mb-0.5 sm:mb-1 text-sm sm:text-base">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm font-mono" dir="ltr">
                    {settings.contactPhone}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 sm:p-6 hover:border-[#D4AF37]/50 transition-all group">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1C2E5A] flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shrink-0">
                  <Mail size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold mb-0.5 sm:mb-1 text-sm sm:text-base">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm truncate">
                    {settings.contactEmail}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 sm:p-6 hover:border-[#D4AF37]/50 transition-all group">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1C2E5A] flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shrink-0">
                  <Globe size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold mb-0.5 sm:mb-1 text-sm sm:text-base">{language === 'ar' ? 'ساعات العمل' : 'Working Hours'}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {language === 'ar' ? 'الأحد - الخميس: 9:00 ص - 5:00 م' : 'Sun - Thu: 9:00 AM - 5:00 PM'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              {status === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 sm:py-12"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500/10 mb-6 sm:mb-8 border border-green-500/20">
                    <CheckCircle size={44} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                    {language === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Message Sent Successfully!'}
                  </h2>
                  <p className="text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                    {language === 'ar' 
                      ? 'شكراً لتواصلك معنا. سيقوم فريقنا بمراجعة رسالتك والرد عليك في أقرب وقت ممكن.' 
                      : 'Thank you for contacting us. Our team will review your message and get back to you as soon as possible.'}
                  </p>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="px-6 sm:px-8 py-3 bg-[#1C2E5A] hover:bg-[#2A4075] text-white font-bold rounded-xl transition-all text-sm sm:text-base"
                  >
                    {language === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-bold text-gray-400 flex items-center gap-2">
                        <User size={15} className="text-[#D4AF37]" />
                        {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-3.5 sm:px-4 py-3 sm:py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all placeholder-gray-600 text-base"
                        placeholder={language === 'ar' ? 'أدخل اسمك هنا' : 'Enter your name'}
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-bold text-gray-400 flex items-center gap-2">
                        <Mail size={15} className="text-[#D4AF37]" />
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                      </label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-3.5 sm:px-4 py-3 sm:py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all placeholder-gray-600 text-base"
                        placeholder="example@mail.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-bold text-gray-400 flex items-center gap-2">
                        <Phone size={15} className="text-[#D4AF37]" />
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-3.5 sm:px-4 py-3 sm:py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all placeholder-gray-600 font-mono text-left text-base"
                        dir="ltr"
                        placeholder="+218 9X XXX XXXX"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-bold text-gray-400 flex items-center gap-2">
                        <MessageSquare size={15} className="text-[#D4AF37]" />
                        {language === 'ar' ? 'موضوع الرسالة' : 'Subject'}
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-3.5 sm:px-4 py-3 sm:py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all placeholder-gray-600 text-base"
                        placeholder={language === 'ar' ? 'ما هو موضوع استفسارك؟' : 'What is your inquiry about?'}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-400 flex items-center gap-2">
                      <MessageSquare size={15} className="text-[#D4AF37]" />
                      {language === 'ar' ? 'الرسالة' : 'Message'}
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl px-3.5 sm:px-4 py-3 sm:py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all resize-none placeholder-gray-600 text-base"
                      placeholder={language === 'ar' ? 'اكتب تفاصيل رسالتك هنا...' : 'Write your message details here...'}
                    ></textarea>
                  </div>

                  {status === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3.5 sm:p-4 rounded-xl border border-red-500/20"
                    >
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{errorMessage || (language === 'ar' ? 'حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.' : 'An error occurred while sending, please try again later.')}</span>
                    </motion.div>
                  )}

                  <button
                    disabled={status === 'sending'}
                    type="submit"
                    className="w-full py-4 sm:py-5 bg-gradient-to-r from-[#D4AF37] to-[#B5952F] hover:from-[#E5C158] hover:to-[#D4AF37] text-[#0A1128] font-black rounded-xl transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:scale-95"
                  >
                    {status === 'sending' ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        <span>{language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</span>
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        <span>{language === 'ar' ? 'إرسال الرسالة الآن' : 'Send Message Now'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
