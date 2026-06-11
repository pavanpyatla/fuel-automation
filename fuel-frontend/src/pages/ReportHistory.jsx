import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, Eye, Calendar, RefreshCw, AlertTriangle, FileSpreadsheet } from 'lucide-react';

const ReportHistory = ({ setActiveTab, setSelectedReportDate }) => {
  const { getAuthHeader } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:8085/api/closings/history';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await axios.get(url, {
        headers: getAuthHeader()
      });
      setHistory(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching history', err);
      setError('Could not fetch transaction history. Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    // We delay fetching slightly to let states clear
    setTimeout(() => {
      setLoading(true);
      axios.get('http://localhost:8085/api/closings/history', {
        headers: getAuthHeader()
      }).then(res => {
        setHistory(res.data);
        setError('');
      }).catch(err => {
        setError('Connection failed');
      }).finally(() => {
        setLoading(false);
      });
    }, 50);
  };

  const handleViewDetails = (date) => {
    setSelectedReportDate(date);
    setActiveTab('report-details');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const getStatusBadge = (diff) => {
    const diffVal = parseFloat(diff);
    if (diffVal === 0) {
      return <span className="badge badge-success">Match</span>;
    } else if (diffVal < 0) {
      return <span className="badge badge-danger">Deficit ({formatCurrency(diffVal)})</span>;
    } else {
      return <span className="badge badge-warning">Surplus (+{formatCurrency(diffVal)})</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Closing History Logs</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Search and browse past closing calculations and verify cash balances.
        </p>
      </div>

      {/* Date Search Filters */}
      <div className="glass-card">
        <form onSubmit={handleSearch} style={filterFormStyle}>
          <div style={filterFieldsStyle}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div style={filterActionsStyle}>
            <button type="submit" className="btn btn-primary">
              <Search size={18} />
              <span>Search Logs</span>
            </button>
            <button type="button" className="btn btn-outline" onClick={handleReset}>
              <RefreshCw size={18} />
              <span>Reset Filters</span>
            </button>
          </div>
        </form>
      </div>

      {/* History List */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={centerStateStyle}>
            <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Retrieving logs from database...</div>
          </div>
        ) : error ? (
          <div style={centerStateStyle}>
            <AlertTriangle size={32} color="#f87171" style={{ marginBottom: '0.5rem' }} />
            <span style={{ color: '#f87171' }}>{error}</span>
          </div>
        ) : history.length === 0 ? (
          <div style={centerStateStyle}>
            <FileSpreadsheet size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.25rem' }}>No closing records found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try adjusting your date filters or submit a new closing report.</p>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th><Calendar size={12} style={{ marginRight: '0.25rem' }} /> Date</th>
                  <th>Total Sales</th>
                  <th>Expected Cash</th>
                  <th>Actual Cash</th>
                  <th>Verification Status</th>
                  <th>Reporter</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: '600' }}>{record.date}</td>
                    <td>{formatCurrency(record.totalSales)}</td>
                    <td>{formatCurrency(record.expectedCash)}</td>
                    <td style={{ color: '#10b981', fontWeight: '600' }}>{formatCurrency(record.actualCashCounted)}</td>
                    <td>{getStatusBadge(record.cashDifference)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{record.createdBy}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleViewDetails(record.date)}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.35rem' }}
                      >
                        <Eye size={14} />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline CSS for history layout
const filterFormStyle = {
  display: 'flex',
  gap: '1.5rem',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
};

const filterFieldsStyle = {
  display: 'flex',
  gap: '1rem',
  flex: 2,
  minWidth: '280px',
};

const filterActionsStyle = {
  display: 'flex',
  gap: '0.75rem',
  flex: 1,
  minWidth: '220px',
  justifyContent: 'flex-end',
};

const centerStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '250px',
  width: '100%',
};

export default ReportHistory;
