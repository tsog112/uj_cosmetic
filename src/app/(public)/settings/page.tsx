'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  reauthenticateWithCredential,
  unlink,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/ui/AuthGuard';
import { useToast } from '@/components/ui/Toast';
import { COUNTRIES, formatPhoneNumber, validatePhoneNumber } from '@/lib/phoneUtils';
import { getPasswordStrength, PASSWORD_RULES } from '@/lib/passwordUtils';

// Shared save button with spinner → success states
function SaveButton({
  onClick,
  saving,
  saved,
  label = 'Хадгалах',
  disabled = false,
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={saving || disabled}
      className="mt-4 flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white disabled:opacity-60 transition-all"
      style={{
        background: saved
          ? 'linear-gradient(135deg, #2D7040, #3B9A54)'
          : 'linear-gradient(135deg, #E91E8C, #C2185B)',
        boxShadow: saved
          ? '0 4px 16px rgba(45,112,64,0.28)'
          : '0 4px 16px rgba(233,30,140,0.28)',
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <AnimatePresence mode="wait">
        {saving ? (
          <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <Loader2 size={15} className="animate-spin" /> Хадгалж байна...
          </motion.span>
        ) : saved ? (
          <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <CheckCircle2 size={15} /> Хадгалагдлаа
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // which section is saving
  const [saved, setSaved] = useState<string | null>(null);   // which section just saved
  const [name, setName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+976');
  const [phoneInput, setPhoneInput] = useState('');
  const [address, setAddress] = useState('');
  const [language, setLanguage] = useState('mn');
  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const hasPassword = Boolean(profile?.password_hash) || user?.providerData.some((provider) => provider.providerId === 'password');
  const hasGoogle = Boolean(profile?.google_id) || user?.providerData.some((provider) => provider.providerId === 'google.com');

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data() || {};
      setProfile(data);
      setName(data.displayName || user.displayName || '');
      setNewEmail(data.email || user.email || '');
      setAddress(data.address || '');
      setLanguage(data.language || 'mn');
      if (data.phone?.countryCode) {
        setPhoneCountry(data.phone.countryCode);
        setPhoneInput(formatPhoneNumber(data.phone.countryCode, data.phone.localNumber || ''));
      }
      setLoading(false);
    }
    void load();
  }, [user]);

  if (!user) return null;

  const markSaved = (section: string) => {
    setSaved(section);
    setTimeout(() => setSaved(null), 2500);
  };

  const reauth = async () => {
    if (!hasPassword) return;
    if (!currentPassword || !user.email) throw new Error('Одоогийн нууц үгээ оруулна уу.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  };

  const saveName = async () => {
    setSaving('name');
    try {
      await reauth();
      await updateProfile(user, { displayName: name.trim() });
      await setDoc(doc(db, 'users', user.uid), { displayName: name.trim(), updatedAt: serverTimestamp() }, { merge: true });
      markSaved('name');
      toast('Хэрэглэгчийн нэр шинэчлэгдлээ.', 'success');
    } catch (err: any) {
      toast(err.message || 'Нэр шинэчлэхэд алдаа гарлаа.', 'error');
    } finally {
      setSaving(null);
      setCurrentPassword('');
    }
  };

  const requestEmailChange = async () => {
    setSaving('email');
    try {
      await reauth();
      await setDoc(doc(db, 'users', user.uid), {
        pending_email: newEmail.trim().toLowerCase(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      const res = await fetch('/api/auth/request-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: newEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'И-мэйл илгээхэд алдаа гарлаа.');
      markSaved('email');
      toast('Шинэ и-мэйл рүү баталгаажуулах линк илгээгдлээ.', 'success');
    } catch (err: any) {
      toast(err.message || 'И-мэйл солиход алдаа гарлаа.', 'error');
    } finally {
      setSaving(null);
      setCurrentPassword('');
    }
  };

  const savePassword = async () => {
    if (!strength.isValid) {
      toast('Нууц үгийн шаардлагыг бүрэн хангана уу.', 'error');
      return;
    }
    setSaving('password');
    try {
      await reauth();
      await updatePassword(user, newPassword);
      await setDoc(doc(db, 'users', user.uid), {
        password_hash: 'firebase-auth-managed',
        passwordLastChanged: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      markSaved('password');
      toast(hasPassword ? 'Нууц үг солигдлоо.' : 'Нууц үг тохируулагдлаа.', 'success');
      setNewPassword('');
    } catch (err: any) {
      toast(err.message || 'Нууц үг шинэчлэхэд алдаа гарлаа.', 'error');
    } finally {
      setSaving(null);
      setCurrentPassword('');
    }
  };

  const savePhone = async () => {
    const clean = phoneInput.replace(/\D/g, '');
    if (clean) {
      const validation = validatePhoneNumber(phoneCountry, clean);
      if (!validation.isValid) {
        toast(validation.error || 'Утасны дугаар буруу байна.', 'error');
        return;
      }
    }
    setSaving('phone');
    try {
      await setDoc(doc(db, 'users', user.uid), {
        phone: clean ? { countryCode: phoneCountry, localNumber: clean, purpose: 'delivery_only' } : null,
        phoneString: clean ? `${phoneCountry}${clean}` : null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      markSaved('phone');
      toast('Утасны дугаар хадгалагдлаа.', 'success');
    } finally {
      setSaving(null);
    }
  };

  const saveGeneral = async () => {
    setSaving('general');
    try {
      await setDoc(doc(db, 'users', user.uid), { address, language, updatedAt: serverTimestamp() }, { merge: true });
      markSaved('general');
      toast('Тохиргоо хадгалагдлаа.', 'success');
    } finally {
      setSaving(null);
    }
  };

  const connectGoogle = async () => {
    setSaving('google');
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('openid');
      provider.addScope('email');
      provider.addScope('profile');
      const result = await linkWithPopup(user, provider);
      const google = result.user.providerData.find((item) => item.providerId === 'google.com');
      await setDoc(doc(db, 'users', user.uid), {
        google_id: google?.uid || null,
        google_email: google?.email || result.user.email,
        google_avatar_url: google?.photoURL || result.user.photoURL,
        email_verified: true,
        email_verified_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      markSaved('google');
      toast('Google холболт амжилттай.', 'success');
    } catch (err: any) {
      toast(err.message || 'Google холбох үед алдаа гарлаа.', 'error');
    } finally {
      setSaving(null);
    }
  };

  const disconnectGoogle = async () => {
    if (!hasPassword) {
      toast('Google салгахын өмнө нууц үг тохируулна уу.', 'error');
      return;
    }
    setSaving('google');
    try {
      await unlink(user, 'google.com');
      await setDoc(doc(db, 'users', user.uid), {
        google_id: null,
        google_email: null,
        google_avatar_url: null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast('Google холболт салгагдлаа.', 'success');
    } catch (err: any) {
      toast(err.message || 'Google салгахад алдаа гарлаа.', 'error');
    } finally {
      setSaving(null);
    }
  };

  const inputClass = "w-full rounded-[16px] border border-[#F4C0D1] bg-[var(--color-brand-bg)] px-5 py-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-primary)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12)]";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8FB] p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF8FB] px-4 py-8 pb-[104px]">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#993556] transition-all hover:-translate-x-1"
        >
          <ArrowLeft size={16} /> Буцах
        </button>
        <h1 className="text-2xl font-extrabold text-[var(--color-text-dark)]">Тохиргоо</h1>

        <div className="mt-6 grid gap-5">
          {/* Name */}
          <section className="rounded-2xl border border-[#F4C0D1]/60 bg-white p-5 shadow-[var(--shadow-mobile-card)]">
            <h2 className="font-extrabold text-[var(--color-text-dark)]">Хэрэглэгчийн нэр солих</h2>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-4 ${inputClass}`} />
            {hasPassword && (
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Одоогийн нууц үг" className={`mt-3 ${inputClass}`} />
            )}
            <SaveButton onClick={saveName} saving={saving === 'name'} saved={saved === 'name'} />
          </section>

          {/* Email */}
          <section className="rounded-2xl border border-[#F4C0D1]/60 bg-white p-5 shadow-[var(--shadow-mobile-card)]">
            <h2 className="font-extrabold text-[var(--color-text-dark)]">И-мэйл солих</h2>
            <p className="mt-1 text-sm text-gray-500">Шинэ и-мэйл баталгаажсаны дараа солигдоно.</p>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={`mt-4 ${inputClass}`} />
            {hasPassword && (
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Одоогийн нууц үг" className={`mt-3 ${inputClass}`} />
            )}
            <SaveButton onClick={requestEmailChange} saving={saving === 'email'} saved={saved === 'email'} label="Баталгаажуулах линк илгээх" />
          </section>

          {/* Password */}
          <section className="rounded-2xl border border-[#F4C0D1]/60 bg-white p-5 shadow-[var(--shadow-mobile-card)]">
            <h2 className="font-extrabold text-[var(--color-text-dark)]">{hasPassword ? 'Нууц үг солих' : 'Нууц үг тохируулах'}</h2>
            {hasPassword && (
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Одоогийн нууц үг" className={`mt-4 ${inputClass}`} />
            )}
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Шинэ нууц үг" className={`mt-3 ${inputClass}`} />
            <div className="mt-3 space-y-1.5 text-xs text-gray-600">
              {PASSWORD_RULES.map((rule) => (
                <div key={rule.key} className={`flex items-center gap-1.5 transition-colors ${rule.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                  <Check size={12} strokeWidth={3} className={rule.test(newPassword) ? 'opacity-100' : 'opacity-30'} />
                  {rule.label}
                </div>
              ))}
            </div>
            <SaveButton onClick={savePassword} saving={saving === 'password'} saved={saved === 'password'} disabled={!strength.isValid} />
          </section>

          {/* Phone */}
          <section className="rounded-2xl border border-[#F4C0D1]/60 bg-white p-5 shadow-[var(--shadow-mobile-card)]">
            <h2 className="font-extrabold text-[var(--color-text-dark)]">Утасны дугаар</h2>
            <p className="mt-1 text-sm text-gray-500">Хүргэлтийн зорилгоор ашиглана.</p>
            <div className="mt-4 flex gap-2">
              <select
                value={phoneCountry}
                onChange={(e) => { setPhoneCountry(e.target.value); setPhoneInput(''); }}
                className="w-28 rounded-[16px] border border-[#F4C0D1] bg-[var(--color-brand-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
              >
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(formatPhoneNumber(phoneCountry, e.target.value))}
                className={`min-w-0 flex-1 ${inputClass}`}
              />
            </div>
            <SaveButton onClick={savePhone} saving={saving === 'phone'} saved={saved === 'phone'} />
          </section>

          {/* Google */}
          <section className="rounded-2xl border border-[#F4C0D1]/60 bg-white p-5 shadow-[var(--shadow-mobile-card)]">
            <h2 className="font-extrabold text-[var(--color-text-dark)]">Google холболт</h2>
            <p className="mt-1 text-sm text-gray-500">
              {hasGoogle ? (profile?.google_email || user.email) : 'Google бүртгэл холбоогүй байна.'}
            </p>
            <motion.button
              onClick={hasGoogle ? disconnectGoogle : connectGoogle}
              disabled={saving === 'google'}
              className="mt-4 flex h-11 items-center gap-2 rounded-full border border-[#ddd] bg-white px-5 text-sm font-semibold text-[#3c4043] disabled:opacity-60 transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {saving === 'google' ? (
                <><Loader2 size={15} className="animate-spin" /> Уншиж байна...</>
              ) : (
                hasGoogle ? 'Салгах' : 'Google холбох'
              )}
            </motion.button>
          </section>

          {/* Address & Language */}
          <section className="rounded-2xl border border-[#F4C0D1]/60 bg-white p-5 shadow-[var(--shadow-mobile-card)]">
            <h2 className="font-extrabold text-[var(--color-text-dark)]">Хаяг, хэл</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Хүргэлтийн хаяг"
              className={`mt-4 min-h-24 resize-none ${inputClass}`}
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`mt-3 ${inputClass}`}
            >
              <option value="mn">Монгол</option>
              <option value="en">English</option>
            </select>
            <SaveButton onClick={saveGeneral} saving={saving === 'general'} saved={saved === 'general'} />
          </section>
        </div>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
