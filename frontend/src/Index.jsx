import {useAuth} from './AuthContext.jsx';
import {Link} from 'react-router-dom';
import {useState, useEffect} from 'react';
import api from './api.js';

function statusClass(statusName){
    return 'pill-' + statusName.toLowerCase().replace(/\s+/g, '-');
}

function Index(){

    const {user, token} = useAuth();

    const [summary, setSummary] = useState(null);
    const [loading, setloading] = useState(true);
    const [error, setError] = useState('');

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

    

    return(
        <div>
            <h1>Dashboard</h1>
            {user? (
                <>
                <p className="text-secondary">Welcome back, {user.name} — {user.role?.name ?? 'No role assigned'}</p>

                <div style={{ display: 'flex', gap: '0.75rem', margin: '1rem 0 1.5rem' }}>
                    <Link to="/tickets" className="btn btn-secondary">View Tickets</Link>
                    {(user.role?.name === 'Employee' || user.role?.name === 'Admin') && (
                        <Link to="/tickets/new" className="btn btn-primary">+ Create New Ticket</Link>
                    )}
                    {user.role?.name === 'Admin' && (
                        <Link to="/reports" className="btn btn-secondary">📊 View Reports</Link>
                    )}
                </div>

                {loading && <p className="text-secondary">Loading summary...</p>}
                {error && <p className="error-text">{error}</p>}

                {summary && (
                    <div>
                        <h2>Ticket Summary (last 2 months)</h2>

                        <div className="kpi-row">
                            <div className="kpi-card">
                                <div className="kpi-value">{summary.total}</div>
                                <div className="kpi-label">Total</div>
                            </div>

                            {Object.entries(summary.by_status).map(([statusName, count]) => (
                                <div className="kpi-card" key={statusName}>
                                    <div className="kpi-value">{count}</div>
                                    <div className="kpi-label">{statusName}</div>
                                </div>
                            ))}
                        </div>

                        {summary.unassigned_tickets && summary.unassigned_tickets.length > 0 && (
                            <div className="card">
                                <h2 style={{ marginTop: 0 }}>New Tickets Available to Take</h2>
                                {summary.unassigned_tickets.map((ticket) => (
                                    <div key={ticket.id} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                                        <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>
                                            {ticket.category?.name ?? 'Uncategorized'}
                                            {' · reported by '}{ticket.employee?.name ?? 'Unknown'}
                                            {' · '}{new Date(ticket.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {summary.unassigned_tickets && summary.unassigned_tickets.length === 0 && (
                            <p className="empty-state">No new unassigned tickets right now</p>
                        )}
                    </div>
                )}
                </>
            ) : (
                <p className="text-secondary">Loading...</p>
            )}
        </div>
    )
}

export default Index;