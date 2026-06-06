import { NavLink, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Camera, Droplets, Settings } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/growth', icon: TrendingUp, label: '成长' },
  { to: '/diaper', icon: Droplets, label: '尿布' },
  { to: '/photos', icon: Camera, label: '照片' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const active = location.pathname === tab.to;
        return (
          <NavLink key={tab.to} to={tab.to} className={`nav-item ${active ? 'active' : ''}`}>
            <tab.icon size={22} />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
