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
            <p><Link to="/">← Back to Dashboard</Link></p>
            <h1>Reports</h1>

            {/*Range selector*/}
            <div style={{ marginBottom: '1rem' }}>
                <button
                    onClick={() => setRange('month')}
                    style={{ fontWeight: range === 'month' ? 'bold' : 'normal' }}
                >
                    This Month
                </button>
                {' '}
                <button
                    onClick={() => setRange('year')}
                    style={{ fontWeight: range === 'year' ? 'bold' : 'normal' }}
                >
                    This Year
                </button>
                {' '}
                <button
                    onClick={() => setRange('custom')}
                    style={{ fontWeight: range === 'custom' ? 'bold' : 'normal' }}
                >
                    Custom Range
                </button>

                {range === 'custom' && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <label>
                            From:{' '}
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </label>
                        {' '}
                        <label>
                            To:{' '}
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </label>
                    </div>
                )}
                    <div style={{ marginTop: '0.5rem' }}>
                    <button onClick={() => handleExport('pdf')}>Export PDF</button>
                    {' '}
                    <button onClick={() => handleExport('excel')}>Export CSV (Excel)</button>
                </div>
            </div>

            {loading && <p>Loading report...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {reportData && (
                <div>
                    <p>
                        <strong>Date range:</strong> {reportData.start_date} to {reportData.end_date}
                        {' — '}
                        <strong>Total tickets:</strong> {reportData.total}
                        {' — '}
                        <strong>Average time to resolve:</strong>{' '}
                        {reportData.average_resolution_hours !== null
                            ? `${reportData.average_resolution_hours} hours`
                            : 'No resolved/closed tickets yet in this range'}
                    </p>

                    <h2>Tickets by Status</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={toChartData(reportData.by_status)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#4a90d9" />
                        </BarChart>
                    </ResponsiveContainer>

                    <h2>Tickets by Category</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={toChartData(reportData.by_category)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#57a773" />
                        </BarChart>
                    </ResponsiveContainer>

                    <h2>Tickets by Priority</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={toChartData(reportData.by_priority)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#d9974a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );

}

export default Reports;