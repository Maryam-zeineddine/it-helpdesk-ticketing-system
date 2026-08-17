import {useAuth} from './AuthContext.jsx';
import {useNavigate, Link} from 'react-router-dom';
import {useState, useEffect} from 'react';
import api from './api.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Index(){

    const {user, token, logout} = useAuth();
    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [loading, setloading] = useState(true);
    const [error, setError] = useState('');

    const [reportRange, setReportRange] = useState('month');
    const [reportData, setReportData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState('');
 
    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    //Fetch the role-scoped ticket summary as soon as we have a token 
    useEffect(() => {
        if(!token) return;

        api.get('/dashboard/summary', {headers: {Authorization: `Bearer ${token}`}})
            .then((response) => setSummary(response.data))
            .catch((err) => {
                const message = err.response?.data?.error ?? 'Failed to load dashboard summary';
                setError(message);
            })
            .finally(() => setloading(false));
    }, [token]);

    //admin only can reports data
    useEffect(() => {
        if(!token || user?.role?.name !== 'Admin') return;

        setReportLoading(true);
        setReportError('');
        api.get(`/dashboard/report?range=${reportRange}`, {headers: {Authorization: `Bearer ${token}`}})
            .then((response) => setReportData(response.data))
            .catch(() => setReportError('Failed to load report'))
            .finally(() => setReportLoading(false));
    }, [token, reportRange, user]);

    return(
        <div>
            <h1>Dashboard</h1>
            {user? (
                <>
                <p>Welcome, {user.name}!</p>
                <p>Email: {user.email}</p>
                <p>Role: {user.role?.name ?? 'No role assigned'}</p>
                <p><Link to="/tickets">View Tickets</Link></p>
                {(user.role?.name === 'Employee' || user.role?.name === 'Admin') && (
                    <p><Link to="/tickets/new">+ Create New Ticket</Link></p>
                )}

                {loading && <p>Loading summary...</p>}
                {error && <p style={{color: 'red'}}>{error}</p>}

                {summary && (
                    <div style={{marginTop: '1.5rem'}}>
                        <h2>Ticket Summary (last 2 months)</h2>

                        {/*KPI card: total*/}
                        <div style={{
                            display: 'inline-block',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginRight: '1rem',
                            minWidth: '120px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold'}}>{summary.total}</div>
                            <div>Total</div>
                        </div>

                        {/*KPI card per status*/}
                        {Object.entries(summary.by_status).map(([statusName,count]) => (
                            <div  key={statusName} style={{
                                display: 'inline-block',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginRight: '1rem',
                                minWidth: '120px',
                                textAlign: 'center'
                            }}>
                                <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>{count}</div>
                                <div>{statusName}</div>
                            </div>
                        ))}

                        {summary.unassigned_tickets && summary.unassigned_tickets.length > 0 && (
                            <div style={{marginTop: '1.5rem'}}>
                                <h2>New Tickets Available to Take</h2>
                                <ul>
                                    {summary.unassigned_tickets.map((ticket) => (
                                        <li key={ticket.id} style={{marginBottom: '0.5rem'}}>
                                            <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                                            {' - '}{ticket.category?.name ?? 'Uncategorized'}
                                            {' - reported by '}{ticket.employee?.name ?? 'Unknown'}
                                            {' - '}{new Date(ticket.created_at).toLocaleDateString()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {summary.unassigned_tickets && summary.unassigned_tickets.length === 0 && (
                            <p style={{ marginTop: '1.5rem', color: '#666'}}>No new unassigned tickets right now </p>
                        )}
                    </div>
                )}

                {user.role?.name === 'Admin' && (
                    <div style={{ marginTop: '2rem' }}>
                        <h2>Admin Report</h2>

                        <button
                            onClick={() => setReportRange('month')}
                            style={{ fontWeight: reportRange === 'month' ? 'bold' : 'normal' }}
                        >
                            This Month
                        </button>
                        {' '}
                        <button
                            onClick={() => setReportRange('year')}
                            style={{ fontWeight: reportRange === 'year' ? 'bold' : 'normal' }}
                        >
                            This Year
                        </button>

                        {reportLoading && <p>Loading report...</p>}
                        {reportError && <p style={{ color: 'red' }}>{reportError}</p>}

                        {reportData && (
                            <div style={{ marginTop: '1rem' }}>
                                <p>
                                    <strong>Total tickets:</strong> {reportData.total}
                                    {' — '}
                                    <strong>Average time to resolve:</strong>{' '}
                                    {reportData.average_resolution_hours !== null
                                        ? `${reportData.average_resolution_hours} hours`
                                        : 'No resolved/closed tickets yet in this range'}
                                </p>

                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={Object.entries(reportData.by_status).map(([status, count]) => ({ status, count }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="status" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#4a90d9" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                <p style={{marginTop: '1.5rem'}}>
                    <button onClick={handleLogout}>Log Out</button>
                </p>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    )
}

export default Index;