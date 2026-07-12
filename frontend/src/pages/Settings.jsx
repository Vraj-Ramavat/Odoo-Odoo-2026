import { useState, useEffect } from 'react';
import { coreAPI } from '../api/client';
import { Settings as SettingsIcon, Save, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

export default function Settings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await coreAPI.getConfig();
      setConfig(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await coreAPI.updateConfig(config);
      setConfig(res.data);
      showToast('Configuration saved successfully');
    } catch (err) {
      const data = err.response?.data;
      showToast(typeof data === 'string' ? data : JSON.stringify(data), 'error');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ value, onChange, label, description }) => (
    <div className="flex items-center justify-between p-4 rounded-xl"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <button onClick={() => onChange(!value)} className="transition-colors">
        {value ? (
          <ToggleRight size={36} style={{ color: 'var(--accent)' }} />
        ) : (
          <ToggleLeft size={36} style={{ color: 'var(--text-muted)' }} />
        )}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: 'var(--text-muted)' }}>
        <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-500 rounded-full animate-spin mr-3" />
        Loading configuration...
      </div>
    );
  }

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <SettingsIcon size={28} style={{ color: 'var(--accent)' }} />
            ESG Configuration
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Scoring weights, feature toggles, and notification settings
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={fetchConfig}>
            <RefreshCw size={16} /> Reset
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Weights */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Scoring Weights</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Must sum to 100%</p>

          <div className="space-y-5">
            {[
              { key: 'environmental_weight', label: 'Environmental', color: '#10b981' },
              { key: 'social_weight', label: 'Social', color: '#3b82f6' },
              { key: 'governance_weight', label: 'Governance', color: '#8b5cf6' },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold" style={{ color }}>{label}</label>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {config?.[key]}%
                  </span>
                </div>
                <input
                  type="range" min="0" max="100" step="5"
                  value={config?.[key] || 0}
                  onChange={(e) => setConfig({ ...config, [key]: parseFloat(e.target.value) })}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${config?.[key]}%, var(--bg-secondary) ${config?.[key]}%, var(--bg-secondary) 100%)`,
                  }}
                />
              </div>
            ))}

            <div className="p-3 rounded-lg text-sm font-medium"
              style={{
                background: (parseFloat(config?.environmental_weight || 0) + parseFloat(config?.social_weight || 0) + parseFloat(config?.governance_weight || 0)) === 100
                  ? 'var(--badge-active-bg)' : 'var(--badge-danger-bg)',
                color: (parseFloat(config?.environmental_weight || 0) + parseFloat(config?.social_weight || 0) + parseFloat(config?.governance_weight || 0)) === 100
                  ? 'var(--badge-active-text)' : 'var(--badge-danger-text)',
              }}>
              Total: {parseFloat(config?.environmental_weight || 0) + parseFloat(config?.social_weight || 0) + parseFloat(config?.governance_weight || 0)}%
              {(parseFloat(config?.environmental_weight || 0) + parseFloat(config?.social_weight || 0) + parseFloat(config?.governance_weight || 0)) !== 100 && ' (must be 100%)'}
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Feature Toggles</h2>
            <div className="space-y-3">
              <Toggle
                value={config?.auto_emission_calculation}
                onChange={(v) => setConfig({ ...config, auto_emission_calculation: v })}
                label="Auto Emission Calculation"
                description="Auto-calculate carbon transactions from ERP records"
              />
              <Toggle
                value={config?.evidence_required_for_csr}
                onChange={(v) => setConfig({ ...config, evidence_required_for_csr: v })}
                label="Evidence Required for CSR"
                description="Require proof file for CSR participation approval"
              />
              <Toggle
                value={config?.badge_auto_award}
                onChange={(v) => setConfig({ ...config, badge_auto_award: v })}
                label="Badge Auto-Award"
                description="Automatically award badges when rules are satisfied"
              />
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Notification Settings</h2>
            <div className="space-y-3">
              <Toggle
                value={config?.notify_compliance_issue}
                onChange={(v) => setConfig({ ...config, notify_compliance_issue: v })}
                label="Compliance Issues"
                description="Notify when new compliance issues are raised"
              />
              <Toggle
                value={config?.notify_approval_decisions}
                onChange={(v) => setConfig({ ...config, notify_approval_decisions: v })}
                label="Approval Decisions"
                description="Notify on CSR/Challenge approval decisions"
              />
              <Toggle
                value={config?.notify_policy_reminders}
                onChange={(v) => setConfig({ ...config, notify_policy_reminders: v })}
                label="Policy Reminders"
                description="Send policy acknowledgement reminders"
              />
              <Toggle
                value={config?.notify_badge_unlocks}
                onChange={(v) => setConfig({ ...config, notify_badge_unlocks: v })}
                label="Badge Unlocks"
                description="Notify employees when they unlock badges"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
