import {useAuth} from './AuthContext.jsx';
import { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';
import api from './api.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

//turns an object from api to the array that charts need
function toChartData(obj){
    return Object.entries(obj).map(([label, count]) => ({label, count}));
}

function Reports(){
    const {user, token} = useAuth();
    const [range, setRange] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    //fetch the report when the range changes
    //for custom we wait until both dates are filled before calling api
    useEffect(() => {
        if(!token) return;
        if(range === 'custom' && (!startDate || !endDate)) return;

        setLoading(true);
        setError('');

        let url = `/dashboard/report?range=${range}`;
        if(range === 'custom'){
            url += `&start_date=${startDate}&end_date=${endDate}`;
        }

        api.get(url, {headers: {Authorization: `Bearer ${token}`}})
            .then((response) => setReportData(response.data))
            .catch(() => setError('Failed to load report'))
            .finally(() => setLoading(false));
    }, [token, range, startDate, endDate]);

        //Downloads the export in the given format (pdf or excel), for whatever
    //range is currently selected on screen
    const handleExport = async (format) => {
        let url = `/dashboard/report/export/${format}?range=${range}`;
        if (range === 'custom') {
            url += `&start_date=${startDate}&end_date=${endDate}`;
        }

        try {
            const response = await api.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `it-helpdesk-report.${format === 'pdf' ? 'pdf' : 'csv'}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            setError('Failed to export report');
        }
    };  

    //only admins should see the age of reports
    if(user && user.role?.name !== 'Admin'){
        return(
            <div>
                <p>You don't have access to this page</p>
                <Link to="/">Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Reports</h1>
                    <p className="text-secondary" style={{ margin: 0 }}>Ticket counts, resolution time, and status breakdowns.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>Export PDF</button>
                    <button className="btn btn-primary" onClick={() => handleExport('excel')}>Export CSV</button>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                    <button
                        className={`btn btn-secondary${range === 'month' ? ' active' : ''}`}
                        onClick={() => setRange('month')}
                    >
                        This Month
                    </button>
                    <button
                        className={`btn btn-secondary${range === 'year' ? ' active' : ''}`}
                        onClick={() => setRange('year')}
                    >
                        This Year
                    </button>
                    <button
                        className={`btn btn-secondary${range === 'custom' ? ' active' : ''}`}
                        onClick={() => setRange('custom')}
                    >
                        Custom Range
                    </button>
                </div>

                {range === 'custom' && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <label>
                            From:{' '}
                            <input
                                className="form-input"
                                style={{ width: 'auto', display: 'inline-block' }}
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </label>
                        <label>
                            To:{' '}
                            <input
                                className="form-input"
                                style={{ width: 'auto', display: 'inline-block' }}
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </label>
                    </div>
                )}
            </div>

            {loading && <p className="text-secondary">Loading report...</p>}
            {error && <p className="error-text">{error}</p>}

            {reportData && (
                <div>
                    <div className="kpi-row">
                        <div className="kpi-card">
                            <div className="kpi-value">{reportData.total}</div>
                            <div className="kpi-label">Total Tickets</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-value">
                                {reportData.average_resolution_hours !== null ? reportData.average_resolution_hours : '—'}
                            </div>
                            <div className="kpi-label">Avg. Resolution (hrs)</div>
                        </div>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '-0.5rem' }}>
                        {reportData.start_date} to {reportData.end_date}
                    </p>

                    <div className="card">
                        <h2 style={{ marginTop: 0 }}>Tickets by Status</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={toChartData(reportData.by_status)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#D9A62E" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card">
                        <h2 style={{ marginTop: 0 }}>Tickets by Category</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={toChartData(reportData.by_category)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card">
                        <h2 style={{ marginTop: 0 }}>Tickets by Priority</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={toChartData(reportData.by_priority)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#22C55E" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );

}

export default Reports;