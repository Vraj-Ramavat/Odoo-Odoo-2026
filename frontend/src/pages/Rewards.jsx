import { useState, useEffect } from 'react';
import { gamificationAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Calendar, Gift, TreePine, Car, Utensils, Sparkles } from 'lucide-react';

export default function Rewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [myXP, setMyXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [r, lb] = await Promise.all([
        gamificationAPI.getRewards(),
        gamificationAPI.getLeaderboard(),
      ]);
      setRewards(r.data.results || r.data);
      const me = (lb.data.results || lb.data).find(e => e.employee === user?.id);
      setMyXP(me?.total_xp || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleRedeem = async (rewardId) => {
    setRedeeming(rewardId);
    try {
      const res = await gamificationAPI.redeemReward(rewardId);
      alert(`Redeemed! Remaining XP: ${res.data.remaining_xp}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Redemption failed');
    }
    setRedeeming(null);
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rewards</h1>
          <p className="page-subtitle">Redeem your sustainability points</p>
        </div>
      </div>

      {/* XP Balance Card */}
      <div style={{ background: 'linear-gradient(135deg, #1a73e8, #8b5cf6)', borderRadius: 16, padding: '24px 32px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#ffffffaa', fontSize: 13, marginBottom: 4 }}>Your XP Balance</div>
          <div style={{ color: '#fff', fontSize: 36, fontWeight: 700 }}>{myXP} XP</div>
        </div>
        <div style={{ color: '#ffffff', opacity: 0.3 }}>
          <Sparkles size={48} />
        </div>
      </div>

      {/* Reward Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {rewards.map(r => {
          const canAfford = myXP >= r.xp_cost;
          const inStock = r.stock > 0;
          const isLowStock = r.stock > 0 && r.stock <= 3;
          return (
            <div key={r.id} className="stat-card" style={{ position: 'relative', opacity: !inStock ? 0.5 : 1 }}>
              {isLowStock && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>Only {r.stock} left!</div>
              )}
              <div style={{ color: '#8b5cf6', marginBottom: 12, display: 'flex', alignItems: 'center', height: 36 }}>
                {r.icon === 'calendar' ? <Calendar size={36} /> :
                 r.icon === 'gift' ? <Gift size={36} /> :
                 r.icon === 'tree-pine' ? <TreePine size={36} /> :
                 r.icon === 'car' ? <Car size={36} /> :
                 r.icon === 'utensils' ? <Utensils size={36} /> :
                 <Gift size={36} />}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>{r.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px' }}>{r.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: 18 }}>{r.xp_cost} XP</span>
                <span style={{ color: isLowStock ? '#ef4444' : 'var(--text-muted)' }}>
                  {inStock ? `${r.stock} in stock` : 'Out of stock'}
                </span>
              </div>
              <button
                className={`btn ${canAfford && inStock ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', padding: '10px 0', opacity: (!canAfford || !inStock) ? 0.5 : 1, cursor: (!canAfford || !inStock) ? 'not-allowed' : 'pointer' }}
                disabled={!canAfford || !inStock || redeeming === r.id}
                onClick={() => handleRedeem(r.id)}
                title={!canAfford ? 'Insufficient XP' : !inStock ? 'Out of stock' : 'Click to redeem'}
              >
                {redeeming === r.id ? 'Redeeming...' : !inStock ? 'Out of Stock' : !canAfford ? `Need ${r.xp_cost - myXP} more XP` : 'Redeem'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
