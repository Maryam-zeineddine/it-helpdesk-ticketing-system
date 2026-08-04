import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from './api.js';
import { useAuth } from './AuthContext.jsx';
import TicketComments from './TicketComments.jsx';

function TicketDetails() {
    const { id } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const role = user?.role?.name;

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [saving, setSaving] = useState(false);

    const [categories, setCategories] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [agents, setAgents] = useState([]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [priorityId, setPriorityId] = useState('');

    const [statusId, setStatusId] = useState('');
    const [assignedTo, setAssignedTo] = useState('');

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const loadTicket = () => {
        setLoading(true);
        api.get(`/tickets/${id}`, authHeader)
            .then((response) => {
                const t = response.data;
                setTicket(t);
                setTitle(t.title);
                setDescription(t.description);
                setCategoryId(t.category_id);
                setPriorityId(t.priority_id);
                setStatusId(t.status_id);
                setAssignedTo(t.assigned_to ?? '');
            })
            .catch(() => setError('Failed to load ticket'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadTicket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, token]);

    useEffect(() => {
        if (role === 'Employee') {
            Promise.all([api.get('/categories', authHeader), api.get('/priorities', authHeader)])
                .then(([c, p]) => {
                    setCategories(c.data);
                    setPriorities(p.data);
                });
        }

        if (role === 'Agent' || role === 'IT Support Agent' || role === 'Admin') {
            api.get('/statuses', authHeader).then((res) => setStatuses(res.data));
        }

        if (role === 'Manager' || role === 'Admin') {
            api.get('/agents', authHeader).then((res) => setAgents(res.data));
        }

        if (role === 'Admin') {
            Promise.all([api.get('/categories', authHeader), api.get('/priorities', authHeader)])
                .then(([c, p]) => {
                    setCategories(c.data);
                    setPriorities(p.data);
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, token]);

    const isOwner = ticket && user && ticket.employee_id === user.id;
    const isOpen = ticket && ticket.status?.name === 'Open';

    const handleUpdate = async (payload) => {
        setActionError('');
        setSaving(true);
        try {
            const response = await api.put(`/tickets/${id}`, payload, authHeader);
            setTicket(response.data);
        } catch (err) {
            const data = err.response?.data;
            const message = data?.error
                || (data ? Object.values(data).flat().join(' ') : 'Failed to update ticket');
            setActionError(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) return;

        setActionError('');
        try {
            await api.delete(`/tickets/${id}`, authHeader);
            navigate('/tickets');
        } catch (err) {
            const data = err.response?.data;
            setActionError(data?.error ?? 'Failed to delete ticket');
        }
    };

    if (loading) return <p>Loading ticket...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!ticket) return null;

    return (
        <div>
            <h1>Ticket {ticket.reference_no}</h1>
            <p><Link to="/tickets">Back to Ticket List</Link></p>

            <ul>
                <li><strong>Title:</strong> {ticket.title}</li>
                <li><strong>Description:</strong> {ticket.description}</li>
                <li><strong>Category:</strong> {ticket.category?.name}</li>
                <li><strong>Priority:</strong> {ticket.priority?.name}</li>
                <li><strong>Status:</strong> {ticket.status?.name}</li>
                <li><strong>Submitted by:</strong> {ticket.employee?.name ?? '—'}</li>
                <li><strong>Assigned to:</strong> {ticket.assigned_agent?.name ?? 'Unassigned'}</li>
                <li><strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}</li>
            </ul>

            {actionError && <p style={{ color: 'red' }}>{actionError}</p>}

            {role === 'Employee' && isOwner && isOpen && (
                <div>
                    <h3>Edit Ticket</h3>
                    <div>
                        <label>Title</label><br />
                        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
                    </div>
                    <div>
                        <label>Description</label><br />
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                    </div>
                    <div>
                        <label>Category</label><br />
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Priority</label><br />
                        <select value={priorityId} onChange={(e) => setPriorityId(e.target.value)}>
                            {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button
                        disabled={saving}
                        onClick={() => handleUpdate({ title, description, category_id: categoryId, priority_id: priorityId })}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {' '}
                    <button onClick={handleDelete} style={{ color: 'red' }}>Delete Ticket</button>
                </div>
            )}

            {role === 'Employee' && isOwner && !isOpen && (
                <p><em>This ticket can no longer be edited or deleted because it is no longer Open.</em></p>
            )}

            {(role === 'Agent' || role === 'IT Support Agent') && (
                <div>
                    <h3>Manage Ticket</h3>
                    <div>
                        <label>Status</label><br />
                        <select value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {' '}
                        <button disabled={saving} onClick={() => handleUpdate({ status_id: statusId })}>
                            Update Status
                        </button>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                        {ticket.assigned_agent?.id === user.id ? (
                            <em>This ticket is assigned to you.</em>
                        ) : (
                            <button disabled={saving} onClick={() => handleUpdate({ assigned_to: user.id })}>
                                Assign to Me
                            </button>
                        )}
                    </div>
                </div>
            )}

            {role === 'Manager' && (
                <div>
                    <h3>Assign Ticket</h3>
                    <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                        <option value="">-- Select an agent --</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {' '}
                    <button disabled={saving} onClick={() => handleUpdate({ assigned_to: assignedTo })}>
                        Assign
                    </button>
                </div>
            )}

            {role === 'Admin' && (
                <div>
                    <h3>Admin: Full Edit</h3>
                    <div>
                        <label>Title</label><br />
                        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
                    </div>
                    <div>
                        <label>Description</label><br />
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                    </div>
                    <div>
                        <label>Category</label><br />
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Priority</label><br />
                        <select value={priorityId} onChange={(e) => setPriorityId(e.target.value)}>
                            {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Status</label><br />
                        <select value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Assigned To</label><br />
                        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                            <option value="">Unassigned</option>
                            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <button
                        disabled={saving}
                        onClick={() => handleUpdate({
                            title,
                            description,
                            category_id: categoryId,
                            priority_id: priorityId,
                            status_id: statusId,
                            assigned_to: assignedTo || null,
                        })}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {' '}
                    <button onClick={handleDelete} style={{ color: 'red' }}>Delete Ticket</button>
                </div>
            )}

            <TicketComments ticketId={id} />
        </div>
    );
}

export default TicketDetails;

/**
 * This is one page, but it behaves differently depending on who's viewing it — mirroring the exact permission matrix we built into the backend:
 * Everyone sees the same read-only summary at the top (title, description, category, status, who submitted it, who it's assigned to)
 * If you're the Employee who owns the ticket AND it's still "Open" → you see an edit form (title/description/category/priority) plus a Delete button
 * If you're an Agent → you see a status dropdown (freeform, any value) and an "Assign to Me" button
 * If you're a Manager → you see only an "assign to an agent" dropdown, nothing else
 * If you're an Admin → you see everything: full edit fields, status change, reassignment, and delete
 */