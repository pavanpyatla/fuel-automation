import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Save, Calendar, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

const DailyEntry = ({ setActiveTab, selectedDateForEdit }) => {
  const { getAuthHeader } = useAuth();
  
  // Form input states
  const [date, setDate] = useState(() => {
    if (selectedDateForEdit) return selectedDateForEdit;
    return new Date().toISOString().split('T')[0];
  });

  // Nozzles readings
  const [opening, setOpening] = useState({
    ms1: 0, ms2: 0, ms3: 0,
    hsd1: 0, hsd2: 0, hsd3: 0
  });
  
  const [closing, setClosing] = useState({
    ms1: '', ms2: '', ms3: '',
    hsd1: '', hsd2: '', hsd3: ''
  });

  const [hasPrevRecord, setHasPrevRecord] = useState(false);
  const [rates, setRates] = useState({ ms: '', hsd: '' });
  const [tests, setTests] = useState({ ms: '15.00', hsd: '15.00' });
  const [payments, setPayments] = useState({ phonePe: '', hpPay: '', swipe: '' });
  const [credit, setCredit] = useState({ dueGiven: '', duePaidCash: '', duePaidPhonePe: '', duePaidHpPay: '', duePaidSwipe: '' });
  const [jump, setJump] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [bankDeposit, setBankDeposit] = useState('');

  // Running balance states (auto-populated from previous day)
  const [openingCash, setOpeningCash] = useState(0);
  const [openingDueBalance, setOpeningDueBalance] = useState(0);

  // Status and feedback states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchOpeningReadings = async (targetDate) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8085/api/closings/previous?date=${targetDate}`, {
        headers: getAuthHeader()
      });
      const data = response.data;
      
      if (data.id) {
        setOpening({
          ms1: data.closingMs1, ms2: data.closingMs2, ms3: data.closingMs3,
          hsd1: data.closingHsd1, hsd2: data.closingHsd2, hsd3: data.closingHsd3
        });
        setHasPrevRecord(true);
        setRates({ ms: data.msRate.toString(), hsd: data.hsdRate.toString() });
        setOpeningCash(data.closingCash != null ? parseFloat(data.closingCash) : 0);
        setOpeningDueBalance(data.closingDueBalance != null ? parseFloat(data.closingDueBalance) : 0);
      } else {
        setOpening({ ms1: 0, ms2: 0, ms3: 0, hsd1: 0, hsd2: 0, hsd3: 0 });
        setHasPrevRecord(false);
        setOpeningCash(0);
        setOpeningDueBalance(0);
      }
      
      const existingResponse = await axios.get(`http://localhost:8085/api/closings/by-date?date=${targetDate}`, {
        headers: getAuthHeader()
      }).catch(() => null);
      
      if (existingResponse && existingResponse.data) {
        const ext = existingResponse.data;
        setClosing({
          ms1: ext.closingMs1.toString(), ms2: ext.closingMs2.toString(), ms3: ext.closingMs3.toString(),
          hsd1: ext.closingHsd1.toString(), hsd2: ext.closingHsd2.toString(), hsd3: ext.closingHsd3.toString()
        });
        setOpening({
          ms1: ext.openingMs1, ms2: ext.openingMs2, ms3: ext.openingMs3,
          hsd1: ext.openingHsd1, hsd2: ext.openingHsd2, hsd3: ext.openingHsd3
        });
        setRates({ ms: ext.msRate.toString(), hsd: ext.hsdRate.toString() });
        setTests({ ms: ext.msTestLitres.toString(), hsd: ext.hsdTestLitres.toString() });
        setPayments({
          phonePe: ext.phonePeAmount.toString(),
          hpPay: ext.hpPayAmount != null ? ext.hpPayAmount.toString() : '',
          swipe: ext.swipeAmount.toString()
        });
        setCredit({
          dueGiven: ext.dueGiven.toString(),
          duePaidCash: ext.duePaidCash != null ? ext.duePaidCash.toString() : '',
          duePaidPhonePe: ext.duePaidPhonePe != null ? ext.duePaidPhonePe.toString() : '',
          duePaidHpPay: ext.duePaidHpPay != null ? ext.duePaidHpPay.toString() : '',
          duePaidSwipe: ext.duePaidSwipe != null ? ext.duePaidSwipe.toString() : ''
        });
        setJump(ext.jumpAmount.toString());
        setActualCash(ext.actualCashCounted.toString());
        setBankDeposit(ext.bankDepositAmount != null ? ext.bankDepositAmount.toString() : '');
        setOpeningCash(ext.openingCash != null ? parseFloat(ext.openingCash) : 0);
        setOpeningDueBalance(ext.openingDueBalance != null ? parseFloat(ext.openingDueBalance) : 0);
        
        setMessage({ type: 'info', text: `An entry for ${targetDate} already exists. Submitting will update it.` });
      } else {
        setClosing({ ms1: '', ms2: '', ms3: '', hsd1: '', hsd2: '', hsd3: '' });
        setPayments({ phonePe: '', hpPay: '', swipe: '' });
        setCredit({ dueGiven: '', duePaidCash: '', duePaidPhonePe: '', duePaidHpPay: '', duePaidSwipe: '' });
        setJump('');
        setActualCash('');
        setBankDeposit('');
        setMessage({ type: '', text: '' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Error fetching previous readings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpeningReadings(date);
  }, [date]);

  const handleClosingChange = (nozzle, value) => setClosing(prev => ({ ...prev, [nozzle]: value }));
  const handleOpeningChange = (nozzle, value) => setOpening(prev => ({ ...prev, [nozzle]: parseFloat(value) || 0 }));
  const getVal = (val) => parseFloat(val) || 0;

  const ms1Sold = Math.max(0, getVal(closing.ms1) - getVal(opening.ms1));
  const ms2Sold = Math.max(0, getVal(closing.ms2) - getVal(opening.ms2));
  const ms3Sold = Math.max(0, getVal(closing.ms3) - getVal(opening.ms3));
  const msTotalLitres = ms1Sold + ms2Sold + ms3Sold;
  
  const hsd1Sold = Math.max(0, getVal(closing.hsd1) - getVal(opening.hsd1));
  const hsd2Sold = Math.max(0, getVal(closing.hsd2) - getVal(opening.hsd2));
  const hsd3Sold = Math.max(0, getVal(closing.hsd3) - getVal(opening.hsd3));
  const hsdTotalLitres = hsd1Sold + hsd2Sold + hsd3Sold;

  const netMsLitres = Math.max(0, msTotalLitres - getVal(tests.ms));
  const netHsdLitres = Math.max(0, hsdTotalLitres - getVal(tests.hsd));
  const msAmount = netMsLitres * getVal(rates.ms);
  const hsdAmount = netHsdLitres * getVal(rates.hsd);
  const totalSales = msAmount + hsdAmount;

  const expectedCash = totalSales - getVal(payments.phonePe) - getVal(payments.hpPay) - getVal(payments.swipe) - getVal(credit.dueGiven) + getVal(credit.duePaidCash) - getVal(jump);
  const totalCashAvailable = openingCash + expectedCash;
  const closingCash = totalCashAvailable - getVal(bankDeposit);
  const cashDiff = getVal(actualCash) - closingCash;

  const totalDuePaid = getVal(credit.duePaidCash) + getVal(credit.duePaidPhonePe) + getVal(credit.duePaidHpPay) + getVal(credit.duePaidSwipe);
  const closingDueBalance = openingDueBalance + getVal(credit.dueGiven) - totalDuePaid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rates.ms || !rates.hsd) return setMessage({ type: 'danger', text: 'Please enter fuel rates.' });
    if (Object.values(closing).some(val => val === '')) return setMessage({ type: 'danger', text: 'Please enter all closing readings.' });
    if (actualCash === '' || actualCash === null) return setMessage({ type: 'danger', text: 'Please enter Actual Cash Counted.' });

    const isInvalidReading = Object.keys(closing).some(key => getVal(closing[key]) < getVal(opening[key]));
    if (isInvalidReading) return setMessage({ type: 'danger', text: 'A closing reading cannot be less than its opening reading.' });

    const confirmSubmit = window.confirm(`Are you sure you want to submit the Daily Closing for ${date}?`);
    if (!confirmSubmit) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        date,
        openingMs1: getVal(opening.ms1), openingMs2: getVal(opening.ms2), openingMs3: getVal(opening.ms3),
        openingHsd1: getVal(opening.hsd1), openingHsd2: getVal(opening.hsd2), openingHsd3: getVal(opening.hsd3),
        closingMs1: getVal(closing.ms1), closingMs2: getVal(closing.ms2), closingMs3: getVal(closing.ms3),
        closingHsd1: getVal(closing.hsd1), closingHsd2: getVal(closing.hsd2), closingHsd3: getVal(closing.hsd3),
        msRate: getVal(rates.ms), hsdRate: getVal(rates.hsd),
        msTestLitres: getVal(tests.ms), hsdTestLitres: getVal(tests.hsd),
        phonePeAmount: getVal(payments.phonePe), hpPayAmount: getVal(payments.hpPay), swipeAmount: getVal(payments.swipe),
        dueGiven: getVal(credit.dueGiven), duePaidCash: getVal(credit.duePaidCash), duePaidPhonePe: getVal(credit.duePaidPhonePe),
        duePaidHpPay: getVal(credit.duePaidHpPay), duePaidSwipe: getVal(credit.duePaidSwipe),
        jumpAmount: getVal(jump), actualCashCounted: getVal(actualCash), bankDepositAmount: getVal(bankDeposit),
        openingCash, openingDueBalance
      };

      await axios.post('http://localhost:8085/api/closings', payload, { headers: getAuthHeader() });
      setMessage({ type: 'success', text: `Daily closing for ${date} saved successfully!` });
      setTimeout(() => setActiveTab('dashboard'), 1500);
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data || 'An error occurred while saving.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatLiveVal = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

  const renderNozzles = (title, type, keys, prefix) => (
    <div className="glass-card mb-6">
      <div className="card-header flex justify-between items-center">
        <h3 className="card-title">{title}</h3>
        {type === 'ms' && !hasPrevRecord && <span className="text-[0.65rem] font-bold px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded uppercase tracking-wider">First Entry - Set Openings</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {keys.map((key, i) => {
          const sold = Math.max(0, getVal(closing[key]) - getVal(opening[key]));
          return (
            <div key={key} className="flex flex-col gap-3 bg-black/10 p-4 rounded-md border border-white/5">
              <h4 className="text-sm font-semibold text-slate-400 uppercase border-b border-white/5 pb-2">
                {prefix}{i + 1} ({type === 'ms' ? 'Petrol' : 'Diesel'})
              </h4>
              <div className="form-group mb-0">
                <label className="form-label text-xs">Opening</label>
                <input type="number" step="0.01" className="form-input text-sm" value={opening[key]} onChange={e => handleOpeningChange(key, e.target.value)} readOnly={hasPrevRecord} disabled={submitting} />
              </div>
              <div className="form-group mb-0">
                <label className="form-label text-xs">Closing</label>
                <input type="number" step="0.01" className="form-input text-sm" placeholder="Closing" value={closing[key]} onChange={e => handleClosingChange(key, e.target.value)} disabled={submitting} required />
              </div>
              <div className="text-xs font-semibold text-emerald-400 text-right mt-1">Sold: {sold.toFixed(2)} L</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Daily Closing Entry</h1>
        <p className="text-slate-400 mt-2">Record end-of-day nozzle readings and collections.</p>
      </div>

      {message.text && (
        <div className={`flex items-center gap-3 p-4 border rounded-md shadow-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : message.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        <form onSubmit={handleSubmit} className="flex flex-col w-full xl:w-2/3 gap-6 relative z-10">
          
          <div className="glass-card">
            <div className="card-header"><h3 className="card-title flex items-center gap-2"><Calendar size={18} className="text-emerald-500" /> Date & Fuel Rates</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="form-group mb-0"><label className="form-label">Closing Date</label><input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} disabled={submitting} /></div>
              <div className="form-group mb-0"><label className="form-label">Petrol (MS) Rate</label><input type="number" step="0.01" className="form-input" value={rates.ms} onChange={e => setRates(prev => ({...prev, ms: e.target.value}))} disabled={submitting} required /></div>
              <div className="form-group mb-0"><label className="form-label">Diesel (HSD) Rate</label><input type="number" step="0.01" className="form-input" value={rates.hsd} onChange={e => setRates(prev => ({...prev, hsd: e.target.value}))} disabled={submitting} required /></div>
            </div>
          </div>

          {renderNozzles('Petrol Nozzles (MS Readings)', 'ms', ['ms1', 'ms2', 'ms3'], 'MS')}
          {renderNozzles('Diesel Nozzles (HSD Readings)', 'hsd', ['hsd1', 'hsd2', 'hsd3'], 'HSD')}

          <div className="glass-card">
            <div className="card-header"><h3 className="card-title">Transactions & Adjustments</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-6">
              <div className="form-group mb-0"><label className="form-label">MS Testing (Litres)</label><input type="number" step="0.01" className="form-input" value={tests.ms} onChange={e => setTests(prev => ({...prev, ms: e.target.value}))} disabled={submitting} /></div>
              <div className="form-group mb-0"><label className="form-label">HSD Testing (Litres)</label><input type="number" step="0.01" className="form-input" value={tests.hsd} onChange={e => setTests(prev => ({...prev, hsd: e.target.value}))} disabled={submitting} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="form-group mb-0"><label className="form-label">PhonePe (UPI)</label><input type="number" step="0.01" className="form-input" placeholder="₹ 0.00" value={payments.phonePe} onChange={e => setPayments(prev => ({...prev, phonePe: e.target.value}))} disabled={submitting} /></div>
              <div className="form-group mb-0"><label className="form-label">HP Pay</label><input type="number" step="0.01" className="form-input" placeholder="₹ 0.00" value={payments.hpPay} onChange={e => setPayments(prev => ({...prev, hpPay: e.target.value}))} disabled={submitting} /></div>
              <div className="form-group mb-0"><label className="form-label">Swipe Card</label><input type="number" step="0.01" className="form-input" placeholder="₹ 0.00" value={payments.swipe} onChange={e => setPayments(prev => ({...prev, swipe: e.target.value}))} disabled={submitting} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group mb-0"><label className="form-label">Due Given (New Credit)</label><input type="number" step="0.01" className="form-input" placeholder="₹ 0.00" value={credit.dueGiven} onChange={e => setCredit(prev => ({...prev, dueGiven: e.target.value}))} disabled={submitting} /></div>
              <div className="form-group mb-0"><label className="form-label">Jump Amount</label><input type="number" step="0.01" className="form-input" placeholder="₹ 0.00" value={jump} onChange={e => setJump(e.target.value)} disabled={submitting} /></div>
            </div>
          </div>

          <div className="glass-card">
            <div className="card-header"><h3 className="card-title">Due Paid (Credit Collection)</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              <div className="form-group mb-0"><label className="form-label text-emerald-400">By Cash</label><input type="number" step="0.01" className="form-input" placeholder="₹ 0.00" value={credit.duePaidCash} onChange={e => setCredit(prev => ({...prev, duePaidCash: e.target.value}))} disabled={submitting} /></div>
              <div className="form-group mb-0"><label className="form-label text-blue-400">By PhonePe</label><input type="number" step="0.01" className="form-input" placeholder="₹ 0.00" value={credit.duePaidPhonePe} onChange={e => setCredit(prev => ({...prev, duePaidPhonePe: e.target.value}))} disabled={submitting} /></div>
              <div className="form-group mb-0"><label className="form-label text-amber-400">By HP Pay</label><input type="number" step="0.01" className="form-input" placeholder="₹ 0.00" value={credit.duePaidHpPay} onChange={e => setCredit(prev => ({...prev, duePaidHpPay: e.target.value}))} disabled={submitting} /></div>
              <div className="form-group mb-0"><label className="form-label text-purple-400">By Swipe</label><input type="number" step="0.01" className="form-input" placeholder="₹ 0.00" value={credit.duePaidSwipe} onChange={e => setCredit(prev => ({...prev, duePaidSwipe: e.target.value}))} disabled={submitting} /></div>
            </div>
          </div>

          <div className="glass-card">
            <div className="card-header"><h3 className="card-title">Cash & Bank Ledger</h3></div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-md p-4 mb-6 flex justify-between items-center mt-4">
              <div><div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Opening Cash</div><div className="text-xl font-bold text-emerald-400 mt-1">{formatLiveVal(openingCash)}</div></div>
              {!hasPrevRecord && <div className="form-group mb-0 max-w-[150px]"><label className="form-label text-xs">Set Opening (First Entry)</label><input type="number" step="0.01" className="form-input" value={openingCash||''} onChange={e => setOpeningCash(parseFloat(e.target.value)||0)} disabled={submitting} /></div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group mb-0"><label className="form-label">Actual Cash Counted</label><input type="number" step="0.01" className="form-input text-lg font-bold text-emerald-400" placeholder="Physical hand cash" value={actualCash} onChange={e => setActualCash(e.target.value)} disabled={submitting} required /></div>
              <div className="form-group mb-0"><label className="form-label">Bank Deposit Amount</label><input type="number" step="0.01" className="form-input text-lg font-bold text-blue-400" placeholder="₹ 0.00" value={bankDeposit} onChange={e => setBankDeposit(e.target.value)} disabled={submitting} /></div>
            </div>
          </div>

          <div className="glass-card">
            <div className="card-header"><h3 className="card-title">Due Ledger Balance</h3></div>
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-md p-4 mt-4 flex justify-between items-center">
              <div><div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Opening Due Balance</div><div className="text-xl font-bold text-amber-400 mt-1">{formatLiveVal(openingDueBalance)}</div></div>
              {!hasPrevRecord && <div className="form-group mb-0 max-w-[150px]"><label className="form-label text-xs">Set Opening (First Entry)</label><input type="number" step="0.01" className="form-input" value={openingDueBalance||''} onChange={e => setOpeningDueBalance(parseFloat(e.target.value)||0)} disabled={submitting} /></div>}
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <button type="submit" className="btn btn-primary px-8 py-3 text-base" disabled={submitting}><Save size={18} /><span>{submitting ? 'Saving...' : 'Submit Report'}</span></button>
            <button type="button" className="btn btn-outline px-6" onClick={() => fetchOpeningReadings(date)} disabled={submitting}><RefreshCw size={18} /><span>Reset</span></button>
          </div>
        </form>

        <div className="w-full xl:w-1/3 xl:sticky xl:top-10 z-10">
          <div className="glass-card border-l-2 border-l-emerald-500 shadow-xl">
            <div className="card-header mb-4"><h3 className="card-title text-emerald-500 text-lg flex items-center gap-2"><Sparkles size={18} /> Live Verification</h3></div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col border-b border-white/5 pb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Sales Summary</div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300">Petrol (MS)</span><span className="font-medium text-white">{msTotalLitres.toFixed(2)} L (Net: {netMsLitres.toFixed(2)})</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300">Diesel (HSD)</span><span className="font-medium text-white">{hsdTotalLitres.toFixed(2)} L (Net: {netHsdLitres.toFixed(2)})</span></div>
                <div className="flex justify-between py-2 text-sm mt-1"><span className="font-bold text-white">Total Revenue</span><span className="font-bold text-emerald-400">{formatLiveVal(totalSales)}</span></div>
              </div>
              <div className="flex flex-col border-b border-white/5 pb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Adjustments</div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300">(-) UPI / Digital</span><span className="text-red-400">-{formatLiveVal(getVal(payments.phonePe)+getVal(payments.hpPay)+getVal(payments.swipe))}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300">(-) Due Given</span><span className="text-red-400">-{formatLiveVal(getVal(credit.dueGiven))}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300">(+) Due Paid (CASH)</span><span className="text-emerald-400">+{formatLiveVal(getVal(credit.duePaidCash))}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300">(-/+) Jump</span><span className="text-white">{formatLiveVal(getVal(jump))}</span></div>
              </div>
              <div className="flex flex-col bg-black/20 p-4 rounded-lg">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Cash Ledger</div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300">Opening</span><span className="text-white">{formatLiveVal(openingCash)}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300">Expected</span><span className="text-white">{formatLiveVal(expectedCash)}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300 font-medium">Total Available</span><span className="font-bold text-emerald-400">{formatLiveVal(totalCashAvailable)}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="text-slate-300">(-) Deposit</span><span className="text-blue-400">-{formatLiveVal(getVal(bankDeposit))}</span></div>
                <div className="flex justify-between py-2 text-sm mt-1"><span className="font-bold text-white">Closing Cash</span><span className="font-bold text-amber-400 text-base">{formatLiveVal(closingCash)}</span></div>
              </div>
              <div className="flex flex-col bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg">
                <div className="flex justify-between py-1 text-sm"><span className="font-bold text-white">Closing Due Balance</span><span className="font-bold text-amber-400 text-base">{formatLiveVal(closingDueBalance)}</span></div>
              </div>
              <div className="flex flex-col bg-black/20 p-4 rounded-lg">
                <div className="flex justify-between py-1 text-sm"><span className="font-medium text-slate-300">Closing Cash</span><span className="text-amber-400">{formatLiveVal(closingCash)}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="font-medium text-slate-300">Actual Counted</span><span className="text-emerald-400">{formatLiveVal(getVal(actualCash))}</span></div>
                <div className={`mt-3 p-3 rounded text-center border ${cashDiff === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : cashDiff < 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  <div className="text-[0.7rem] uppercase tracking-wider font-bold">{cashDiff === 0 ? 'Matches Perfectly' : cashDiff < 0 ? 'Shortage' : 'Surplus'}</div>
                  <div className="text-xl font-extrabold mt-1">{cashDiff > 0 ? '+' : ''}{formatLiveVal(cashDiff)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyEntry;
