import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, CreditCard, Landmark, Mail, Save, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface CommissionSettings {
  type: 'opay' | 'bank' | 'paypal' | 'crypto';
  account_number?: string;
  account_name?: string;
  email?: string;
}

export default function Settings({ user }: { user: any }) {
  const [settings, setSettings] = useState<CommissionSettings>({ type: 'opay' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.is_admin !== 1) return;

    fetch('/api/settings/commission')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/settings/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings', error);
    } finally {
      setSaving(false);
    }
  };

  if (user?.is_admin !== 1) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <SettingsIcon size={32} />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Access Denied</h2>
        <p className="text-neutral-500">Omo, you no get permission to see this page. Only app builder fit enter here.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="p-4 space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <SettingsIcon size={24} className="text-emerald-600" />
          Admin Settings
        </h2>
        <p className="text-neutral-500">Configure how the platform receives its 10% commission.</p>
      </header>

      <div className="space-y-4">
        <section className="glass p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-neutral-900 flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-600" />
            Commission Reception Method
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'opay', label: 'OPay', icon: <CreditCard size={16} /> },
              { id: 'bank', label: 'Bank Transfer', icon: <Landmark size={16} /> },
              { id: 'paypal', label: 'PayPal', icon: <Mail size={16} /> },
              { id: 'crypto', label: 'Crypto', icon: <Landmark size={16} /> },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setSettings({ ...settings, type: method.id as any })}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  settings.type === method.id 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'bg-white/50 border-white/20 text-neutral-600 hover:bg-white/80'
                }`}
              >
                {method.icon}
                <span className="text-sm font-medium">{method.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            {settings.type === 'opay' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">OPay Account Number</label>
                  <input
                    type="text"
                    value={settings.account_number || ''}
                    onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
                    placeholder="e.g. 8144990299"
                    className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Account Name</label>
                  <input
                    type="text"
                    value={settings.account_name || ''}
                    onChange={(e) => setSettings({ ...settings, account_name: e.target.value })}
                    placeholder="e.g. Gigflow Admin"
                    className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </>
            )}

            {settings.type === 'bank' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Bank Name</label>
                  <input
                    type="text"
                    value={settings.type === 'bank' ? (settings as any).bank_name || '' : ''}
                    onChange={(e) => setSettings({ ...settings, bank_name: e.target.value } as any)}
                    placeholder="e.g. Zenith Bank"
                    className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Account Number</label>
                  <input
                    type="text"
                    value={settings.account_number || ''}
                    onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
                    placeholder="e.g. 1234567890"
                    className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </>
            )}

            {(settings.type === 'paypal' || settings.type === 'crypto') && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {settings.type === 'paypal' ? 'PayPal Email' : 'Wallet Address'}
                </label>
                <input
                  type="text"
                  value={settings.email || settings.account_number || ''}
                  onChange={(e) => setSettings({ ...settings, [settings.type === 'paypal' ? 'email' : 'account_number']: e.target.value })}
                  placeholder={settings.type === 'paypal' ? 'admin@gigflow.com' : '0x...'}
                  className="w-full bg-white/50 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <>
              <CheckCircle2 size={20} />
              Settings Saved!
            </>
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
