import React from 'react';
import { Domain } from '../types';
import { getDynamicStatus } from '../utils';

interface StatsGridProps {
  domains: Domain[];
  warningDays: number;
}

const StatsGrid: React.FC<StatsGridProps> = ({ domains, warningDays }) => {
  const total = domains.length;
  const active = domains.filter((d: Domain) => getDynamicStatus(d.expire_date, warningDays) === 'active').length;
  const expired = domains.filter((d: Domain) => getDynamicStatus(d.expire_date, warningDays) === 'expired').length;
  // 已过期：expire_date 已经过去（daysLeft <= -1）
  const pending = domains.filter((d: Domain) => getDynamicStatus(d.expire_date, warningDays) === 'pending').length;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>总域名数</h3>
        <p style={{ fontSize: '2.6rem', color: '#007bff', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{total}</p>
      </div>
      <div className="stat-card">
        <h3>正常域名</h3>
        <p style={{ fontSize: '2.6rem', color: '#007bff', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{active}</p>
      </div>
      <div className="stat-card">
        <h3>即将到期域名</h3>
        <p style={{ fontSize: '2.6rem', color: '#007bff', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{expired}</p>
      </div>
      <div className="stat-card">
        <h3>已过期域名</h3>
        <p style={{ fontSize: '2.6rem', color: '#dc3545', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{pending}</p>
      </div>
    </div>
  );
};

export default StatsGrid; 
