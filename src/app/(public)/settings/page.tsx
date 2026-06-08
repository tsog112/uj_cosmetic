'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  reauthenticateWithCredential,
  unlink,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { authFetch } from '@/lib/auth/clientFetch';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import AuthGuard from '@/components/ui/AuthGuard';
import { useToast } from '@/components/ui/Toast';
import AddressSelector, { type AddressSnapshot } from '@/components/ui/AddressSelector';
import { getPasswordStrength, PASSWORD_RULES } from '@/lib/passwordUtils';

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
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-6 text-[13px] font-bold text-white disabled:opacity-60 uj-pressable"
    >
      {saving ? <><Loader2 size={15} className="animate-spin" /> Хадгалж байна...</> : saved ? <><CheckCircle2 size={15} /> Хадгалагдлаа</> : label}
    </button>
  );
}

function SettingsCard({ title, children, danger = false }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className={`luxury-card p-5 ${danger ? 'border-[var(--color-status-cancel-bg)]' : ''}`}>
      <p className="luxury-eyebrow">{danger ? 'Account' : 'Settings'}</p>
      <h2 className="luxury-title mt-1 text-[22px]" style={{ color: danger ? 'var(--color-status-cancel-text)' : 'var(--color-text-primary)' }}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setLocale } = useLocale();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState('mn');
  const [address, setAddress] = useState('');
  const [addressSnapshot, setAddressSnapshot] = useState<AddressSnapshot | null>(null);
  const [addressInitialValue, setAddressInitialValue] = useState<any>(null);
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
      setLanguage(data.language || 'mn');
      setAddress(data.full_address || data.address || '');
      setAddressInitialValue({
        regionId: data.region_id || data.regionId,
        districtId: data.district_id || data.districtId,
        khorooId: data.khoroo_id || data.khorooId,
        detail: data.address_detail || data.detail || '',
        label: data.address_label || '',
      });
      setLoading(false);
    }
    void load();
  }, [user]);

  if (!user) return null;

  const inputClass = 'mt-3 w-full rounded-full border border-[var(--color-border)] bg-white px-4 py-3.5 text-[13px] font-medium outline-none focus:border-[var(--color-brand)]';

  const markSaved = (section: string) => {
    setSaved(section);
    window.setTimeout(() => setSaved(null), 2200);
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
      toast('Нэр амжилттай шинэчлэгдлээ.', 'success');
    } catch (error: any) {
      toast(error.message || 'Нэр шинэчлэхэд алдаа гарлаа.', 'error');
    } finally {
      setSaving(null);
      setCurrentPassword('');
    }
  };

  const requestEmailChange = async () => {
    setSaving('email');
    try {
      await reauth();
      const email = newEmail.trim().toLowerCase();
      await setDoc(doc(db, 'users', user.uid), { pending_email: email, updatedAt: serverTimestamp() }, { merge: true });
      const res = await fetch('/api/auth/request-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email }),
      });
      if (!res.ok) throw new Error('Баталгаажуулах линк илгээхэд алдаа гарлаа.');
      markSaved('email');
      toast('Шинэ и-мэйл рүү баталгаажуулах линк илгээгдлээ.', 'success');
    } catch (error: any) {
      toast(error.message || 'И-мэйл солиход алдаа гарлаа.', 'error');
    } finally {
      setSaving(null);
      setCurrentPassword('');
    }
  };

  const savePassword = async () => {
    if (!strength.isValid || newPassword !== confirmPassword) {
      toast('Нууц үгийн шаардлага болон давталтаа шалгана уу.', 'error');
      return;
    }
    setSaving('password');
    try {
      await reauth();
      await updatePassword(user, newPassword);
      await setDoc(doc(db, 'users', user.uid), { password_hash: 'firebase-auth-managed', updatedAt: serverTimestamp() }, { merge: true });
      setNewPassword('');
      setConfirmPassword('');
      markSaved('password');
      toast('Нууц үг амжилттай шинэчлэгдлээ.', 'success');
    } catch (error: any) {
      toast(error.message || 'Нууц үг шинэчлэхэд алдаа гарлаа.', 'error');
    } finally {
      setSaving(null);
      setCurrentPassword('');
    }
  };

  const saveAddress = async () => {
    if (!addressSnapshot) {
      toast('Хүргэлтийн хаягаа бүрэн сонгоно уу.', 'error');
      return;
    }
    setSaving('address');
    try {
      await setDoc(doc(db, 'users', user.uid), {
        address: addressSnapshot.full,
        full_address: addressSnapshot.full,
        region_id: addressSnapshot.region_id,
        district_id: addressSnapshot.district_id,
        khoroo_id: addressSnapshot.khoroo_id,
        address_detail: addressSnapshot.detail,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setAddress(addressSnapshot.full);
      markSaved('address');
      toast('Хүргэлтийн хаяг хадгалагдлаа.', 'success');
    } finally {
      setSaving(null);
    }
  };

  const saveLanguage = async () => {
    setSaving('language');
    try {
      await setDoc(doc(db, 'users', user.uid), { language, updatedAt: serverTimestamp() }, { merge: true });
      setLocale(language === 'en' ? 'en' : 'mn');
      markSaved('language');
      toast('Хэлний тохиргоо хадгалагдлаа.', 'success');
    } finally {
      setSaving(null);
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm('Та бүртгэлээ бүр мөсөн устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.');
    if (!confirmed) return;
    setSaving('delete');
    try {
      await reauth();
      await authFetch('/api/auth/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      }).catch(() => null);
      await setDoc(doc(db, 'users', user.uid), { deletedAt: serverTimestamp(), status: 'deleted' }, { merge: true });
      await deleteUser(user);
      toast('Бүртгэл устгагдлаа.', 'success');
      router.push('/');
    } catch (error: any) {
      toast(error.message || 'Бүртгэл устгахад алдаа гарлаа. Дахин нэвтэрч оролдоно уу.', 'error');
    } finally {
      setSaving(null);
      setCurrentPassword('');
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
    } catch (error: any) {
      toast(error.message || 'Google холболт хийхэд алдаа гарлаа.', 'error');
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
      await unlink(auth.currentUser || user, 'google.com');
      await setDoc(doc(db, 'users', user.uid), { google_id: null, google_email: null, google_avatar_url: null, updatedAt: serverTimestamp() }, { merge: true });
      markSaved('google');
      toast('Google холболт салгагдлаа.', 'success');
    } catch (error: any) {
      toast(error.message || 'Google холболт салгахад алдаа гарлаа.', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <main className="luxury-shell mx-auto w-full max-w-xl space-y-4 px-4 pb-[104px] pt-4">
        {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-32 rounded-[24px] uj-shimmer" />)}
      </main>
    );
  }

  return (
    <main className="luxury-shell uj-page mx-auto w-full max-w-xl px-4 pb-[104px] pt-2">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="luxury-eyebrow">Settings</p>
          <h1 className="luxury-title mt-1 text-[32px] text-[var(--color-text-primary)]">Тохиргоо</h1>
          <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">Профайл, нууц үг, хаяг, хэлний тохиргоо.</p>
        </div>
        <button onClick={() => router.push('/profile')} className="h-11 shrink-0 rounded-full border border-[var(--color-border)] bg-white px-4 text-[12px] font-bold text-[var(--color-brand)]">Профайл</button>
      </div>

      <div className="space-y-4">
        <SettingsCard title="Хэрэглэгчийн нэр солих">
          <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} inputMode="text" />
          {hasPassword && <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Одоогийн нууц үг" className={inputClass} />}
          <SaveButton onClick={saveName} saving={saving === 'name'} saved={saved === 'name'} />
        </SettingsCard>

        <SettingsCard title="И-мэйл солих">
          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">Одоогийн и-мэйл: {user.email}</p>
          <input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className={inputClass} inputMode="email" />
          <p className="mt-2 text-[12px] text-[var(--color-text-muted)]">Шинэ и-мэйл баталгаажсаны дараа солигдоно.</p>
          <SaveButton onClick={requestEmailChange} saving={saving === 'email'} saved={saved === 'email'} label="Баталгаажуулах линк илгээх" />
        </SettingsCard>

        <SettingsCard title={hasPassword ? 'Нууц үг солих' : 'Нууц үг тохируулах'}>
          {hasPassword && <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Одоогийн нууц үг" className={inputClass} />}
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Шинэ нууц үг" className={inputClass} />
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Шинэ нууц үг давтах" className={inputClass} />
          <div className="mt-3 space-y-1.5 text-[12px] text-[var(--color-text-muted)]">
            {PASSWORD_RULES.map((rule) => (
              <div key={rule.key} className={`flex items-center gap-2 ${rule.test(newPassword) ? 'text-[var(--color-status-done-text)]' : ''}`}>
                <Check size={13} strokeWidth={3} className={rule.test(newPassword) ? 'opacity-100' : 'opacity-30'} />
                {rule.label}
              </div>
            ))}
          </div>
          <SaveButton onClick={savePassword} saving={saving === 'password'} saved={saved === 'password'} disabled={!strength.isValid || newPassword !== confirmPassword} />
        </SettingsCard>

        <SettingsCard title="Хүргэлтийн хаяг">
          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">Аймаг/Хот, Дүүрэг/Сум, Хороо/Баг, дэлгэрэнгүй хаягаа сонгоно.</p>
          <div className="mt-4">
            <AddressSelector
              initialValue={addressInitialValue}
              onAddressChange={(snapshot) => {
                setAddressSnapshot(snapshot);
                setAddress(snapshot?.full || '');
              }}
            />
          </div>
          {address && <p className="mt-3 rounded-[12px] bg-[var(--color-brand-light)] px-4 py-3 text-[12px] font-semibold text-[var(--color-brand-dark)]">{address}</p>}
          <SaveButton onClick={saveAddress} saving={saving === 'address'} saved={saved === 'address'} />
        </SettingsCard>

        <SettingsCard title="Google холболт">
          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{hasGoogle ? (profile?.google_email || user.email) : 'Google бүртгэл холбогдоогүй байна.'}</p>
          <button onClick={hasGoogle ? disconnectGoogle : connectGoogle} disabled={saving === 'google'} className="mt-4 min-h-12 rounded-full border px-6 text-[13px] font-bold uj-pressable" style={{ borderColor: 'var(--color-border)' }}>
            {saving === 'google' ? 'Уншиж байна...' : hasGoogle ? 'Салгах' : 'Google холбох'}
          </button>
        </SettingsCard>

        <SettingsCard title="Хэл">
          <select value={language} onChange={(event) => setLanguage(event.target.value)} className={inputClass}>
            <option value="mn">Монгол</option>
            <option value="en">English</option>
          </select>
          <SaveButton onClick={saveLanguage} saving={saving === 'language'} saved={saved === 'language'} />
        </SettingsCard>

        <SettingsCard title="Бүртгэл устгах" danger>
          <p className="mt-2 text-[12px] leading-6 text-[var(--color-status-cancel-text)]">Энэ үйлдэл буцаах боломжгүй. Хэрэв и-мэйл/нууц үгтэй бүртгэл бол баталгаажуулалт хийнэ.</p>
          {hasPassword && <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Одоогийн нууц үг (баталгаажуулалт)" className={inputClass} />}
          <button onClick={deleteAccount} disabled={saving === 'delete'} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--color-status-cancel-bg)] px-6 text-[13px] font-bold text-[var(--color-status-cancel-text)] disabled:opacity-60" type="button">
            <Trash2 size={16} /> Бүртгэл устгах
          </button>
        </SettingsCard>
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
