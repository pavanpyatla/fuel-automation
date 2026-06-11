import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  IndianRupee,
  Droplet,
  Wallet,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Bell,
  Settings,
  Wifi,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const WaveSVG = ({ color = '#00E676' }) => (
  <svg
    className="fuel-perf-wave absolute bottom-0 left-0 w-full"
    viewBox="0 0 400 50"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ height: '40px' }}
  >
    <path
      d="M0 25 Q50 10 100 25 T200 25 T300 25 T400 25 L400 50 L0 50 Z"
      fill={color}
    />
    <path
      d="M0 32 Q60 18 120 32 T240 32 T360 32 T400 32 L400 50 L0 50 Z"
      fill={color}
      opacity="0.5"
    />
  </svg>
);

const Dashboard = ({ setActiveTab }) => {
  const { getAuthHeader, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartDays, setChartDays] = useState(7);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8085/api/closings/dashboard?days=${chartDays}`, {
        headers: getAuthHeader(),
      });
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
      const fallback = 'Could not connect to backend at http://localhost:8085.';
      const message = err?.response?.data ?? fallback;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [getAuthHeader, chartDays]);

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace(/\.00$/, '');
  };

  const formatLargeCurrency = (value) => {
    const number = Number(value ?? 0);
    if (Number.isNaN(number)) return '₹0';
    const abs = Math.abs(number);
    if (abs >= 100000) {
      return `₹${(number / 100000).toFixed(2).replace(/\.([0-9]*[1-9])0+$|\.0+$/, '.$1')} Lakh`;
    }
    if (abs >= 1000) {
      return `₹${(number / 1000).toFixed(1).replace(/\.0+$/, '')}K`;
    }
    return formatCurrency(number);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-slate-300">
        <div className="text-lg font-semibold animate-pulse">Loading dashboard insights…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center text-slate-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
          <AlertTriangle size={40} className="text-rose-400" />
        </div>
        <div className="text-3xl font-bold text-white">Connection Failed</div>
        <p className="max-w-md text-slate-400">{error}</p>
        <button
          type="button"
          className="rounded-2xl bg-emerald-500 px-8 py-4 font-semibold text-white transition hover:bg-emerald-600"
          onClick={fetchStats}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const cashDifference = Number(stats?.cashDifference ?? 0);
  const petrolLitres = Number(stats?.todayMsLitres ?? 0);
  const dieselLitres = Number(stats?.todayHsdLitres ?? 0);
  const totalLitres = petrolLitres + dieselLitres;
  const petrolPercent = totalLitres > 0 ? (petrolLitres / totalLitres) * 100 : 50;
  const dieselPercent = totalLitres > 0 ? (dieselLitres / totalLitres) * 100 : 50;

  const todayString = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  let cashStatus = 'Balanced';
  let cashStatusColor = '#00E676';
  let cashStatusBg = 'rgba(0, 230, 118, 0.12)';
  let cashStatusBorder = 'rgba(0, 230, 118, 0.25)';
  if (cashDifference < 0) {
    cashStatus = 'SHORTAGE';
    cashStatusColor = '#FF5A5F';
    cashStatusBg = 'rgba(255, 90, 95, 0.12)';
    cashStatusBorder = 'rgba(255, 90, 95, 0.25)';
  } else if (cashDifference > 0) {
    cashStatus = 'EXCESS';
    cashStatusColor = '#FBBF24';
    cashStatusBg = 'rgba(251, 191, 36, 0.12)';
    cashStatusBorder = 'rgba(251, 191, 36, 0.25)';
  }

  const outstandingCount = stats?.recentEntries?.length || 0;

  return (
    <div className="relative flex flex-col gap-6 w-full max-w-full overflow-hidden">
      
      {/* ───── HEADER BAR ───── */}
      <header className="flex justify-between items-center w-full relative z-10 mb-2">
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">HP Fuel Station Manager</h1>
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar size={14} />
              {todayString}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[#00E676]">Active Shift: Morning</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition">
            <Bell size={18} />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition">
            <Settings size={18} />
          </button>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-1.5 px-2 pr-4 ml-2 cursor-pointer hover:bg-white/10 transition">
            <div className="w-8 h-8 rounded-full bg-[#00E676] flex items-center justify-center text-black font-bold text-sm">
              {getInitials(user?.fullName)}
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-semibold leading-tight">{user?.fullName || 'HP Fuel Station Manager'}</span>
              <span className="text-[#00E676] text-[10px] font-bold tracking-wider">{user?.role || 'MANAGER'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ───── KPI CARDS ───── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="glass-card flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#00E676]/10 border border-[#00E676]/20 flex items-center justify-center">
              <IndianRupee size={20} className="text-[#00E676]" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20 flex items-center gap-1">
              <ArrowUpRight size={12} /> +12%
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Today's Total Sales</p>
            <p className="text-3xl font-extrabold text-white">{formatLargeCurrency(stats.todaySales)}</p>
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 flex items-center justify-center">
              <Wallet size={20} className="text-[#4F8CFF]" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#4F8CFF]/10 text-[#4F8CFF] border border-[#4F8CFF]/20">
              In Hand
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cash With Manager</p>
            <p className="text-3xl font-extrabold text-white">{formatLargeCurrency(stats.closingCash)}</p>
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cashStatusBg, borderColor: cashStatusBorder, borderWidth: 1 }}>
              {cashDifference === 0 ? (
                <CheckCircle2 size={20} color={cashStatusColor} />
              ) : (
                <AlertTriangle size={20} color={cashStatusColor} />
              )}
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md border" style={{ backgroundColor: cashStatusBg, color: cashStatusColor, borderColor: cashStatusBorder }}>
              {cashStatus}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cash Difference</p>
            <p className="text-3xl font-extrabold" style={{ color: cashStatusColor }}>
              {cashDifference > 0 ? '+' : ''}{formatCurrency(cashDifference)}
            </p>
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center">
              <Receipt size={20} className="text-[#FBBF24]" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
              {outstandingCount} Records
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Outstanding Due</p>
            <p className="text-3xl font-extrabold text-white">{formatLargeCurrency(stats.outstandingDueBalance)}</p>
          </div>
        </div>
      </section>

      {/* ───── FUEL PERFORMANCE + SALES SHARE ───── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        <div className="glass-card relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#00E676]/10 border border-[#00E676]/20 flex items-center justify-center">
              <Droplet size={20} className="text-[#00E676]" />
            </div>
            <div>
              <div className="text-lg font-bold text-white leading-tight">Petrol Sales</div>
              <div className="text-xs text-slate-400">Power Fuel Premium</div>
            </div>
          </div>
          <div className="flex flex-col gap-4 relative z-10">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Revenue</div>
              <div className="text-2xl font-bold text-white">{formatLargeCurrency(stats.todayMsSales)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Volume</div>
              <div className="text-xl font-bold text-[#00E676]">
                {petrolLitres.toFixed(1)} <span className="text-sm font-medium text-slate-500">Litres sold</span>
              </div>
            </div>
          </div>
          <WaveSVG color="rgba(0, 230, 118, 0.15)" />
        </div>

        <div className="glass-card relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 flex items-center justify-center">
              <Droplet size={20} className="text-[#4F8CFF]" />
            </div>
            <div>
              <div className="text-lg font-bold text-white leading-tight">Diesel Sales</div>
              <div className="text-xs text-slate-400">High Speed Diesel</div>
            </div>
          </div>
          <div className="flex flex-col gap-4 relative z-10">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Revenue</div>
              <div className="text-2xl font-bold text-white">{formatLargeCurrency(stats.todayHsdSales)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Volume</div>
              <div className="text-xl font-bold text-[#4F8CFF]">
                {dieselLitres.toFixed(1)} <span className="text-sm font-medium text-slate-500">Litres sold</span>
              </div>
            </div>
          </div>
          <WaveSVG color="rgba(79, 140, 255, 0.15)" />
        </div>

        <div className="glass-card flex flex-col justify-center">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 text-center">Fuel Sales Share</h4>
          
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-sm font-bold text-[#00E676]">PETROL {petrolPercent.toFixed(0)}%</span>
            <span className="text-sm font-bold text-[#4F8CFF]">DIESEL {dieselPercent.toFixed(0)}%</span>
          </div>
          
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex mb-6">
            <div className="h-full bg-[#00E676] transition-all duration-500" style={{ width: `${petrolPercent}%` }} />
            <div className="h-full bg-[#4F8CFF] transition-all duration-500" style={{ width: `${dieselPercent}%` }} />
          </div>
          
          <p className="text-center text-sm font-medium text-slate-400 mb-6">
            Total Litres Sold Today: <span className="text-white">{totalLitres.toFixed(1)} L</span>
          </p>
          
          <div className="flex justify-center items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
              PETROL
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-[#4F8CFF]" />
              DIESEL
            </div>
          </div>
        </div>
      </section>

      {/* ───── DAILY SALES TREND ───── */}
      <section className="relative z-10">
        <div className="glass-card flex flex-col w-full h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00E676]/10 border border-[#00E676]/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-[#00E676]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">Daily Sales Trend</h3>
                <p className="text-sm text-slate-400 mt-1">Last {chartDays} Days Performance</p>
              </div>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-2 min-w-[140px] text-sm text-slate-300 bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:bg-white/10 transition outline-none focus:border-[#00E676]/50"              >
                <Calendar size={14} />
                Last {chartDays} Days
                <span className="ml-1 text-[10px] transition-transform duration-200" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-[#0A0F1A] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in">
                  {[7, 15, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => {
                        setChartDays(days);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        chartDays === days 
                          ? 'bg-[#00E676]/10 text-[#00E676] font-semibold' 
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      Last {days} Days
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.recentEntries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E676" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00E676" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  dy={10}
                  tickFormatter={(val) => {
                    if (!val) return '';
                    const d = new Date(val);
                    return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('en-US', {month: 'short'})}`;
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(val) => `₹${(val/100000).toFixed(1)} Lakh`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0F1A', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00E676', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value) => [`₹${(value/100000).toFixed(2)} Lakh`, 'Sales']}
                  labelFormatter={(label) => {
                    const d = new Date(label);
                    return isNaN(d.getTime()) ? label : d.toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#00E676" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ───── FOOTER STATUS BAR ───── */}
      <footer className="flex justify-between items-center pt-2 pb-4 text-sm relative z-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-[#00E676] font-semibold bg-[#00E676]/10 px-3 py-1 rounded-full border border-[#00E676]/20">
            <Wifi size={12} className="animate-pulse" />
            Connected
          </span>
          <span className="text-slate-500">© 2026 HPCL Automation - v4.2.1-luminous</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-slate-500">Server Status: <strong className="text-[#00E676]">Stable</strong></span>
          <span className="text-slate-500 flex items-center gap-1"><Wifi size={12} className="rotate-45 opacity-50" /> Last Sync: <strong className="text-white">2m ago</strong></span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
