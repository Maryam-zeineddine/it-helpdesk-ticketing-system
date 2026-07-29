import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api.js';
import { useAuth } from './AuthContext.jsx';

function TicketList() {
    const { token } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [categories, setCategories] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const [categoryId, setCategoryId] = useState('');
    const [priorityId, setPriorityId] = useState('');
    const [statusId, setStatusId] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        Promise.all([
            api.get('/categories', authHeader),
            api.get('/priorities', authHeader),
            api.get('/statuses', authHeader),
        ])
            .then(([categoriesRes, prioritiesRes, statusesRes]) => {
                setCategories(categoriesRes.data);
                setPriorities(prioritiesRes.data);
                setStatuses(statusesRes.data);
            })
            .catch(() => setError('Failed to load filter options'));
    }, [token]);

    useEffect(() => {
        setLoading(true);
        setError('');

        const params = {};
        if (categoryId) params.category_id = categoryId;
        if (priorityId) params.priority_id = priorityId;
        if (statusId) params.status_id = statusId;
        if (search) params.search = search;

        api.get('/tickets', {
            headers: { Authorization: `Bearer ${token}` },
            params,
        })
            .then((response) => setTickets(response.data))
            .catch(() => setError('Failed to load tickets'))
            .finally(() => setLoading(false));
    }, [token, categoryId, priorityId, statusId, search]);

    return (
        <div>
            <h1>Tickets</h1>

            <p>
                <Link to="/">Back to Dashboard</Link>
                {' | '}
                <Link to="/tickets/new">+ New Ticket</Link>
            </p>

            <div>
                <input
                    type="text"
                    placeholder="Search title or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                <select value={priorityId} onChange={(e) => setPriorityId(e.target.value)}>
                    <option value="">All Priorities</option>
                    {priorities.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <select value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                    <option value="">All Statuses</option>
                    {statuses.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {loading ? (
                <p>Loading tickets...</p>
            ) : tickets.length === 0 ? (
                <p>No tickets found.</p>
            ) : (
                <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr>
                            <th>Reference</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Created</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((ticket) => (
                            <tr key={ticket.id}>
                                <td>{ticket.reference_no}</td>
                                <td>{ticket.title}</td>
                                <td>{ticket.category?.name}</td>
                                <td>{ticket.priority?.name}</td>
                                <td>{ticket.status?.name}</td>
                                <td>{ticket.assigned_agent?.name ?? '—'}</td>
                                <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                                <td><Link to={`/tickets/${ticket.id}`}>View</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default TicketList;

/**
 * This is what shows up when we click "View Tickets." 
 * It does two things:
 * On page load, it fetches the dropdown options (categories, priorities, statuses) from the new /categories, /priorities, /statuses endpoints, so the filter dropdowns aren't hardcoded / they always match what's actually in the database.
 * Whenever a filter changes (we pick a category, type a search term, etc.), it re-fetches /tickets with those filters attached as query parameters.
 * The result renders as a table, and each row's ticket data (ticket.category.name, ticket.status.name, etc.) comes straight from the same JSON structure the backend already returns (no transformation needed).
 */