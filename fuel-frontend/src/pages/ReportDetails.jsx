import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Printer, Edit, ArrowLeft, Fuel, Calendar, User, Clock, CheckCircle, AlertOctagon } from 'lucide-react';

const ReportDetails = ({ activeTab, setActiveTab, selectedReportDate, setSelectedDateForEdit }) => {
  const { getAuthHeader } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8085/api/closings/by-date?date=${selectedReportDate}`, {
        headers: getAuthHeader()
      });
      setReport(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching report', err);
      setError(`No closing report found for ${selectedReportDate} or server is offline.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReportDate) {
      fetchReport();
    }
  }, [selectedReportDate]);

  if (loading) {
    return (
      <div style={centerStateStyle}>
        <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Retrieving daily report details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={centerStateStyle}>
        <AlertOctagon size={48} color="#f87171" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: '#f87171', marginBottom: '0.5rem' }}>Report Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => setActiveTab('history')} className="btn btn-primary">Back to History</button>
      </div>
    );
  }

  // Format currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    setSelectedDateForEdit(report.date);
    setActiveTab('entry');
  };

  // Safe nozzle sold calculations
  const getNozzleSold = (closing, opening) => {
    return (parseFloat(closing) - parseFloat(opening)).toFixed(2);
  };

  const cashDiff = parseFloat(report.cashDifference);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Action Bar (hidden during print) */}
      <div style={actionBarHiddenStyle} className="no-print">
        <button onClick={() => setActiveTab('history')} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Logs</span>
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleEdit} className="btn btn-outline" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}>
            <Edit size={16} />
            <span>Modify Entry</span>
          </button>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Printable Bill/Report */}
      <div style={printContainerStyle} className="glass-card print-report-layout">
        
        {/* Printable Header */}
        <div style={reportHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={reportLogoStyle}>
              <Fuel size={32} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: 1.1 }}>HP FUEL STATION</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Daily Closing Report
              </span>
            </div>
          </div>

          <div style={headerMetaStyle}>
            <div style={metaItemStyle}>
              <Calendar size={14} color="#9ca3af" />
              <span>Date: <strong>{report.date}</strong></span>
            </div>
            <div style={metaItemStyle}>
              <User size={14} color="#9ca3af" />
              <span>Entered By: <strong>{report.createdBy}</strong></span>
            </div>
            <div style={metaItemStyle}>
              <Clock size={14} color="#9ca3af" />
              <span>Timestamp: <span style={{ fontSize: '0.85rem' }}>{report.createdAt.replace('T', ' ').substring(0, 19)}</span></span>
            </div>
          </div>
        </div>

        {/* Verification Status Box */}
        <div
          style={{
            ...statusBoxStyle,
            background: cashDiff === 0 ? 'rgba(52, 211, 153, 0.05)' : cashDiff < 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(251, 191, 36, 0.05)',
            borderColor: cashDiff === 0 ? 'rgba(52, 211, 153, 0.15)' : cashDiff < 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)',
            color: cashDiff === 0 ? '#34d399' : cashDiff < 0 ? '#f87171' : '#fbbf24',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '1.05rem' }}>
            {cashDiff === 0 ? (
              <>
                <CheckCircle size={20} />
                <span>CASH VERIFIED: MATCHED PERFECTLY</span>
              </>
            ) : (
              <>
                <AlertOctagon size={20} />
                <span>CASH DISCREPANCY DETECTED: {cashDiff < 0 ? 'SHORTAGE' : 'SURPLUS'}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.25rem' }}>
            {cashDiff > 0 ? '+' : ''}{formatCurrency(cashDiff)}
          </div>
        </div>

        {/* Section 1: Nozzle-wise Readings */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>1. Nozzle-wise Fuel Sales</h3>
          <div className="custom-table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table className="custom-table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <th>Fuel Nozzle</th>
                  <th>Opening Reading</th>
                  <th>Closing Reading</th>
                  <th style={{ textAlign: 'right' }}>Sold Litres</th>
                </tr>
              </thead>
              <tbody>
                {/* Petrol Nozzles */}
                <tr>
                  <td>Petrol Nozzle 1 (MS1)</td>
                  <td>{report.openingMs1.toFixed(2)}</td>
                  <td>{report.closingMs1.toFixed(2)}</td>
                  <td style={soldColumnStyle}>{getNozzleSold(report.closingMs1, report.openingMs1)} L</td>
                </tr>
                <tr>
                  <td>Petrol Nozzle 2 (MS2)</td>
                  <td>{report.openingMs2.toFixed(2)}</td>
                  <td>{report.closingMs2.toFixed(2)}</td>
                  <td style={soldColumnStyle}>{getNozzleSold(report.closingMs2, report.openingMs2)} L</td>
                </tr>
                <tr>
                  <td>Petrol Nozzle 3 (MS3)</td>
                  <td>{report.openingMs3.toFixed(2)}</td>
                  <td>{report.closingMs3.toFixed(2)}</td>
                  <td style={soldColumnStyle}>{getNozzleSold(report.closingMs3, report.openingMs3)} L</td>
                </tr>
                
                {/* Diesel Nozzles */}
                <tr>
                  <td>Diesel Nozzle 1 (HSD1)</td>
                  <td>{report.openingHsd1.toFixed(2)}</td>
                  <td>{report.closingHsd1.toFixed(2)}</td>
                  <td style={soldColumnStyle}>{getNozzleSold(report.closingHsd1, report.openingHsd1)} L</td>
                </tr>
                <tr>
                  <td>Diesel Nozzle 2 (HSD2)</td>
                  <td>{report.openingHsd2.toFixed(2)}</td>
                  <td>{report.closingHsd2.toFixed(2)}</td>
                  <td style={soldColumnStyle}>{getNozzleSold(report.closingHsd2, report.openingHsd2)} L</td>
                </tr>
                <tr>
                  <td>Diesel Nozzle 3 (HSD3)</td>
                  <td>{report.openingHsd3.toFixed(2)}</td>
                  <td>{report.closingHsd3.toFixed(2)}</td>
                  <td style={soldColumnStyle}>{getNozzleSold(report.closingHsd3, report.openingHsd3)} L</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Volume & Amount Calculations */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>2. Fuel Volume & Sales Revenue</h3>
          <div style={revenueGridStyle}>
            {/* MS Petrol */}
            <div style={fuelRevenueCardStyle}>
              <div style={fuelCardHeaderStyle('#10b981')}>Petrol (MS) Calculations</div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="info-row"><span className="info-label">Gross Litres Sold</span><span className="info-value">{(parseFloat(report.closingMs1) + parseFloat(report.closingMs2) + parseFloat(report.closingMs3) - parseFloat(report.openingMs1) - parseFloat(report.openingMs2) - parseFloat(report.openingMs3)).toFixed(2)} L</span></div>
                <div className="info-row"><span className="info-label">(-) Testing Litres</span><span className="info-value">{report.msTestLitres.toFixed(2)} L</span></div>
                <div className="info-row"><span className="info-label">Net Sales Litres</span><span className="info-value" style={{ color: '#10b981' }}>{report.netMsLitres.toFixed(2)} L</span></div>
                <div className="info-row"><span className="info-label">Fuel Rate (₹/L)</span><span className="info-value">{formatCurrency(report.msRate)}</span></div>
                <div className="info-row" style={{ borderBottom: 'none', paddingTop: '0.75rem' }}><span className="info-label" style={{ fontWeight: '700' }}>MS Subtotal Amount</span><span className="info-value" style={{ fontSize: '1.1rem', color: '#10b981' }}>{formatCurrency(report.msAmount)}</span></div>
              </div>
            </div>

            {/* HSD Diesel */}
            <div style={fuelRevenueCardStyle}>
              <div style={fuelCardHeaderStyle('#6366f1')}>Diesel (HSD) Calculations</div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="info-row"><span className="info-label">Gross Litres Sold</span><span className="info-value">{(parseFloat(report.closingHsd1) + parseFloat(report.closingHsd2) + parseFloat(report.closingHsd3) - parseFloat(report.openingHsd1) - parseFloat(report.openingHsd2) - parseFloat(report.openingHsd3)).toFixed(2)} L</span></div>
                <div className="info-row"><span className="info-label">(-) Testing Litres</span><span className="info-value">{report.hsdTestLitres.toFixed(2)} L</span></div>
                <div className="info-row"><span className="info-label">Net Sales Litres</span><span className="info-value" style={{ color: '#6366f1' }}>{report.netHsdLitres.toFixed(2)} L</span></div>
                <div className="info-row"><span className="info-label">Fuel Rate (₹/L)</span><span className="info-value">{formatCurrency(report.hsdRate)}</span></div>
                <div className="info-row" style={{ borderBottom: 'none', paddingTop: '0.75rem' }}><span className="info-label" style={{ fontWeight: '700' }}>HSD Subtotal Amount</span><span className="info-value" style={{ fontSize: '1.1rem', color: '#6366f1' }}>{formatCurrency(report.hsdAmount)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Revenue, Transactions and Cash Audit */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>3. Transaction Reconciliation</h3>
          
          <div style={reconciliationLayoutGridStyle}>
            {/* Left Column: Transaction details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="info-row"><span className="info-label">Gross Revenue Sales (Petrol + Diesel)</span><span className="info-value">{formatCurrency(report.totalSales)}</span></div>
              <div className="info-row"><span className="info-label">(-) PhonePe UPI Collection</span><span className="info-value" style={{ color: '#f87171' }}>-{formatCurrency(report.phonePeAmount)}</span></div>
              <div className="info-row"><span className="info-label">(-) HP Pay Collection</span><span className="info-value" style={{ color: '#f87171' }}>-{formatCurrency(report.hpPayAmount)}</span></div>
              <div className="info-row"><span className="info-label">(-) Swipe/POS Card Collection</span><span className="info-value" style={{ color: '#f87171' }}>-{formatCurrency(report.swipeAmount)}</span></div>
              <div className="info-row"><span className="info-label">(-) Due Given (New Dues Outstanding)</span><span className="info-value" style={{ color: '#f87171' }}>-{formatCurrency(report.dueGiven)}</span></div>
              <div className="info-row"><span className="info-label">(+) Due Paid (CASH ONLY)</span><span className="info-value" style={{ color: '#34d399' }}>+{formatCurrency(report.duePaidCash)}</span></div>
              <div className="info-row" style={{ borderBottom: 'none' }}><span className="info-label">(-) Jump Amount (Adjustment)</span><span className="info-value">-{formatCurrency(report.jumpAmount)}</span></div>
            </div>

            {/* Right Column: Expected Cash generated today */}
            <div style={finalAuditSummaryBoxStyle}>
              <div style={finalAuditTitleStyle}>Expected Cash Generated Today</div>
              <div style={finalAuditRowStyle}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Today's Net Cash Formed:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#60a5fa' }}>{formatCurrency(report.expectedCash)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 & 5: Running Ledgers */}
        <div style={revenueGridStyle}>
            {/* Section 4: Cash Ledger */}
            <div style={fuelRevenueCardStyle}>
              <h3 style={{...sectionTitleStyle, margin: '1rem'}}>4. Cash Ledger</h3>
              <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="info-row"><span className="info-label">Opening Cash</span><span className="info-value">{formatCurrency(report.openingCash)}</span></div>
                <div className="info-row"><span className="info-label">(+) Expected Cash (Today)</span><span className="info-value" style={{ color: '#60a5fa' }}>+{formatCurrency(report.expectedCash)}</span></div>
                <div className="info-row"><span className="info-label" style={{ fontWeight: '700' }}>Total Cash Available</span><span className="info-value" style={{ fontWeight: '700' }}>{formatCurrency((report.openingCash || 0) + report.expectedCash)}</span></div>
                <div className="info-row"><span className="info-label">(-) Bank Deposit</span><span className="info-value" style={{ color: '#f87171' }}>-{formatCurrency(report.bankDepositAmount)}</span></div>
                <div className="info-row" style={{ borderBottom: 'none', paddingTop: '0.75rem' }}>
                    <span className="info-label" style={{ fontWeight: '700' }}>Closing Cash (With Manager)</span>
                    <span className="info-value" style={{ fontSize: '1.1rem', color: '#10b981' }}>{formatCurrency(report.closingCash)}</span>
                </div>
              </div>
            </div>

            {/* Section 5: Due Ledger */}
            <div style={fuelRevenueCardStyle}>
              <h3 style={{...sectionTitleStyle, margin: '1rem'}}>5. Due Ledger</h3>
              <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="info-row"><span className="info-label">Opening Due Balance</span><span className="info-value">{formatCurrency(report.openingDueBalance)}</span></div>
                <div className="info-row"><span className="info-label">(+) Due Given Today</span><span className="info-value" style={{ color: '#f87171' }}>+{formatCurrency(report.dueGiven)}</span></div>
                <div className="info-row" style={{ borderBottom: 'none' }}>
                  <span className="info-label">(-) Total Due Paid</span>
                  <span className="info-value" style={{ color: '#34d399' }}>-{formatCurrency(report.totalDuePaid)}</span>
                </div>
                
                {/* Breakdown of Due Paid */}
                <div style={subGroupStyle}>
                  <div className="info-row" style={subRowStyle}><span className="info-label">↳ Cash</span><span className="info-value">{formatCurrency(report.duePaidCash)}</span></div>
                  <div className="info-row" style={subRowStyle}><span className="info-label">↳ PhonePe</span><span className="info-value">{formatCurrency(report.duePaidPhonePe)}</span></div>
                  <div className="info-row" style={subRowStyle}><span className="info-label">↳ HP Pay</span><span className="info-value">{formatCurrency(report.duePaidHpPay)}</span></div>
                  <div className="info-row" style={{...subRowStyle, borderBottom: 'none'}}><span className="info-label">↳ Swipe</span><span className="info-value">{formatCurrency(report.duePaidSwipe)}</span></div>
                </div>

                <div className="info-row" style={{ borderBottom: 'none', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="info-label" style={{ fontWeight: '700' }}>Closing Due Balance</span>
                    <span className="info-value" style={{ fontSize: '1.1rem', color: '#fbbf24' }}>{formatCurrency(report.closingDueBalance)}</span>
                </div>
              </div>
            </div>
        </div>

        {/* Section 6: Final Cash Verification */}
        <div style={{ ...sectionStyle, marginTop: '2rem' }}>
           <h3 style={sectionTitleStyle}>6. Cash Verification Summary</h3>
           <div style={finalAuditSummaryBoxStyle}>
              <div style={finalAuditRowStyle}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Closing Cash (With Manager):</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>{formatCurrency(report.closingCash)}</span>
              </div>
              <div style={finalAuditRowStyle}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Actual Cash Counted:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>{formatCurrency(report.actualCashCounted)}</span>
              </div>
              <div
                style={{
                  ...finalDiffBoxStyle,
                  background: cashDiff === 0 ? 'rgba(52, 211, 153, 0.1)' : cashDiff < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                  color: cashDiff === 0 ? '#34d399' : cashDiff < 0 ? '#f87171' : '#fbbf24',
                }}
              >
                <div>Difference:</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900' }}>
                  {cashDiff > 0 ? '+' : ''}{formatCurrency(cashDiff)}
                </div>
              </div>
            </div>
        </div>

        {/* Print Signature Line */}
        <div style={printSignaturesRowStyle} className="print-only">
          <div style={signBlockStyle}>
            <div style={signLineStyle}></div>
            <div>Manager Signature</div>
          </div>
          <div style={signBlockStyle}>
            <div style={signLineStyle}></div>
            <div>Owner Signature</div>
          </div>
        </div>

      </div>

      {/* Embedded CSS style overrides for print capability */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .sidebar, .no-print, .nav-btn, .sidebar-width, button {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .print-report-layout {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            backdrop-filter: none !important;
            color: black !important;
          }
          .print-only {
            display: flex !important;
          }
          .custom-table th {
            color: #333 !important;
            border-bottom: 2px solid #333 !important;
          }
          .custom-table td {
            color: #111 !important;
            border-bottom: 1px solid #ccc !important;
          }
          .info-label {
            color: #333 !important;
          }
          .info-value {
            color: #000 !important;
          }
        }
      `}</style>

    </div>
  );
};

// Inline CSS styles for details page
const centerStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  width: '100%',
};

const actionBarHiddenStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const printContainerStyle = {
  padding: '2.5rem',
  background: 'rgba(15, 23, 42, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

const reportHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '1.5rem',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const reportLogoStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '14px',
  background: 'rgba(16, 185, 129, 0.08)',
  border: '1px solid rgba(16, 185, 129, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const headerMetaStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  fontSize: '0.9rem',
  color: 'var(--text-muted)',
};

const metaItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const statusBoxStyle = {
  padding: '1.25rem',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
};

const sectionStyle = {
  marginBottom: '2rem',
};

const sectionTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: '700',
  marginBottom: '1rem',
  color: 'var(--text-main)',
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
};

const soldColumnStyle = {
  textAlign: 'right',
  fontWeight: '700',
  color: 'var(--success)',
};

const revenueGridStyle = {
  display: 'flex',
  gap: '1.5rem',
  flexWrap: 'wrap',
};

const fuelRevenueCardStyle = {
  flex: 1,
  minWidth: '280px',
  background: 'rgba(0,0,0,0.15)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
};

const fuelCardHeaderStyle = (color) => ({
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  fontWeight: '700',
  color: '#fff',
  background: color,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

const reconciliationLayoutGridStyle = {
  display: 'flex',
  gap: '2rem',
  flexWrap: 'wrap',
};

const finalAuditSummaryBoxStyle = {
  flex: 1,
  minWidth: '280px',
  background: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: 'var(--radius-md)',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const finalAuditTitleStyle = {
  fontSize: '0.85rem',
  fontWeight: '700',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.05em',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  paddingBottom: '0.5rem',
};

const finalAuditRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const finalDiffBoxStyle = {
  padding: '0.85rem',
  borderRadius: 'var(--radius-sm)',
  textAlign: 'center',
  marginTop: '0.5rem',
  fontWeight: '700',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
};

const printSignaturesRowStyle = {
  display: 'none', // hidden by default on screen
  justifyContent: 'space-between',
  marginTop: '4rem',
  paddingTop: '2rem',
};

const signBlockStyle = {
  width: '200px',
  textAlign: 'center',
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#333',
};

const signLineStyle = {
  borderTop: '1px solid #333',
  marginBottom: '0.5rem',
};

const subGroupStyle = {
  background: 'rgba(0,0,0,0.2)',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  marginLeft: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const subRowStyle = {
  paddingBottom: '0.25rem',
  paddingTop: '0.25rem',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
};

export default ReportDetails;
