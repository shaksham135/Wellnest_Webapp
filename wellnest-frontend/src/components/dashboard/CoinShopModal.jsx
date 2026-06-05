import React, { useState } from 'react';
import { purchaseShopItem } from '../../api/userApi';
import toast from 'react-hot-toast';

const SHOP_ITEMS = [
  {
    id: 'streak_shield',
    icon: '🛡️',
    name: 'Streak Shield',
    desc: 'Protect your streak for 1 day — even if you miss a log.',
    cost: 30,
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.2)',
    tag: 'PROTECTION',
  },
  {
    id: 'xp_booster',
    icon: '⚡',
    name: 'XP Booster',
    desc: 'Earn 2× XP on everything for the next 24 hours.',
    cost: 75,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.2)',
    tag: 'POWER-UP',
  },
  {
    id: 'theme_default',
    icon: '🎨',
    name: 'Default Theme',
    desc: 'Revert back to the classic Wellnest vivid mint styling.',
    cost: 0,
    color: '#5eead4',
    glow: 'rgba(94,234,212,0.2)',
    tag: 'CLASSIC',
  },
  {
    id: 'theme_emerald',
    icon: '🌿',
    name: 'Emerald Theme',
    desc: 'Unlock a beautiful fresh mint & emerald neon accent color.',
    cost: 50,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.2)',
    tag: 'COSMETIC',
  },
  {
    id: 'theme_gold',
    icon: '✨',
    name: 'Gold Theme',
    desc: 'Unlock a legendary gold and amber neon accent color.',
    cost: 50,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.2)',
    tag: 'COSMETIC',
  },
  {
    id: 'premium_badge',
    icon: '👑',
    name: 'Elite Badge',
    desc: 'Equip a permanent golden crown next to your name.',
    cost: 75,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.2)',
    tag: 'ELITE',
  },
];

const CoinShopModal = ({ isOpen, onClose, userCoins = 0, user, onPurchaseSuccess }) => {
  const [purchasing, setPurchasing] = useState(null);

  if (!isOpen) return null;

  const checkOwnership = (itemId) => {
    if (!user) return { owned: false, active: false };

    if (itemId === 'theme_default') {
      return { owned: true, active: user.activeTheme === 'default' || !user.activeTheme };
    }
    if (itemId === 'theme_gold') {
      return { owned: user.hasGoldTheme, active: user.activeTheme === 'gold' };
    }
    if (itemId === 'theme_emerald') {
      return { owned: user.hasEmeraldTheme, active: user.activeTheme === 'emerald' };
    }
    if (itemId === 'premium_badge') {
      return { owned: user.hasPremiumBadge, active: user.hasPremiumBadge };
    }
    if (itemId === 'xp_booster') {
      return { owned: user.xpBoosterActive, active: user.xpBoosterActive };
    }
    return { owned: false, active: false };
  };

  const handlePurchase = async (item) => {
    const { owned } = checkOwnership(item.id);
    const costToCharge = owned ? 0 : item.cost;

    if (userCoins < costToCharge) {
      toast.error(`Not enough coins! You need ${costToCharge} 🪙 (you have ${userCoins}).`);
      return;
    }

    setPurchasing(item.id);
    try {
      const res = await purchaseShopItem(item.id);
      const data = res.data;
      if (data.success) {
        toast.success(data.message, { duration: 4000 });
        if (onPurchaseSuccess) onPurchaseSuccess();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="coin-shop-overlay" onClick={onClose}>
      <div className="coin-shop-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="coin-shop-header">
          <div className="coin-shop-title-row">
            <div>
              <h2 className="coin-shop-title">🏪 Coin Shop</h2>
              <p className="coin-shop-subtitle">Spend your coins on powerful upgrades</p>
            </div>
            <div className="coin-shop-balance">
              <span className="coin-shop-balance-amount">🪙 {userCoins}</span>
              <span className="coin-shop-balance-label">Your Balance</span>
            </div>
          </div>
          <button className="coin-shop-close" onClick={onClose} aria-label="Close shop">✕</button>
        </div>

        {/* Items Grid */}
        <div className="coin-shop-items">
          {SHOP_ITEMS.map((item) => {
            const { owned, active } = checkOwnership(item.id);
            const canAfford = userCoins >= item.cost || owned;
            const isLoading = purchasing === item.id;

            let buttonText = 'Buy';
            if (active) {
              buttonText = item.id === 'premium_badge' || item.id === 'xp_booster' ? 'Active' : 'Equipped';
            } else if (owned) {
              buttonText = 'Equip';
            } else if (!canAfford) {
              buttonText = 'Need 🪙';
            }

            return (
              <div
                key={item.id}
                className={`coin-shop-item ${!canAfford && !owned ? 'coin-shop-item--locked' : ''} ${active ? 'coin-shop-item--active' : ''}`}
                style={{ '--item-color': item.color, '--item-glow': item.glow }}
              >
                <div className="coin-shop-item-tag" style={{ color: item.color }}>
                  {active ? 'ACTIVE' : owned ? 'OWNED' : item.tag}
                </div>
                <div className="coin-shop-item-icon">{item.icon}</div>
                <div className="coin-shop-item-name">{item.name}</div>
                <div className="coin-shop-item-desc">{item.desc}</div>
                <div className="coin-shop-item-footer">
                  <div className="coin-shop-item-cost" style={{ color: canAfford ? item.color : 'var(--text-muted)' }}>
                    {owned ? 'Free' : `🪙 ${item.cost}`}
                  </div>
                  <button
                    className="coin-shop-buy-btn"
                    style={{
                      background: active 
                        ? 'rgba(255,255,255,0.06)' 
                        : canAfford 
                          ? `linear-gradient(135deg, ${item.color}22, ${item.color}44)` 
                          : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? 'rgba(255,255,255,0.1)' : canAfford ? item.color : 'rgba(255,255,255,0.1)'}`,
                      color: active ? 'var(--text-muted)' : canAfford ? item.color : 'var(--text-muted)',
                      cursor: active ? 'default' : canAfford ? 'pointer' : 'not-allowed',
                      opacity: active ? 0.7 : canAfford ? 1 : 0.5,
                    }}
                    onClick={() => !active && canAfford && handlePurchase(item)}
                    disabled={active || !canAfford || isLoading}
                  >
                    {isLoading ? (
                      <span className="coin-shop-spinner" />
                    ) : buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="coin-shop-footer-hint">
          💡 Earn coins by logging habits daily. Hit targets for bonus rewards!
        </div>
      </div>
    </div>
  );
};

export default CoinShopModal;
