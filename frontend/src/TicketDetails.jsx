import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from './api.js';
import { useAuth } from './AuthContext.jsx';
import TicketComments from './TicketComments.jsx';

function statusClass(statusName){
    return 'pill-' + statusName.toLowerCase().replace(/\s+/g, '-');
}

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

    const [attachmentFile, setAttachmentFile] = useState(null);
    const [attachmentError, setAttachmentError] = useState('');
    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    const [cancellationReason, setCancellationReason] = useState('');
    const [requestingCancellation, setRequestingCancellation] = useState(false);

    const [resolveDecision, setResolveDecision] = useState('cancel');
    const [resolveAssignedTo, setResolveAssignedTo] = useState('');
    const [resolvingCancellation, setResolvingCancellation] = useState(false);
    const [cancellationReasonText, setCancellationReasonText] = useState('');

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

        if (role === 'Admin' || role === 'Manager') {
            api.get('/agents', authHeader).then((res) => setAgents(res.data));
        }

        if (role === 'Admin') {
            Promise.all([api.get('/categories', authHeader), api.get('/priorities', authHeader)])
                .then(([c, p]) => {
                    setCategories(c.data);
                    setPriorities(p.data);
                });
        }
    }, [role, token]);

    //when a cancellation is pending, pull the reason from activity log so the manager can see it
    useEffect(() => {
        if(!ticket || ticket.status?.name !== 'Cancellation Requested'){
            setCancellationReasonText('');
            return;
        }
        api.get(`/tickets/${id}/activity`, authHeader)
            .then((response) => {
                const requestLog = [...response.data].reverse() //activity() returns oldest so reverse to the newest
                    .find((entry) => entry.action === 'cancellation_requested');
                setCancellationReasonText(requestLog?.description ?? '');
            })
            .catch(() => setCancellationReasonText(''));
    }, [ticket?.status?.name, id, token]);

    const isOwner = ticket && user && ticket.employee_id === user.id;
    const isOpen = ticket && ticket.status?.name === 'Open';
    const isClosed = ticket  && ticket.status?.name === 'Closed';
    const isCancellationRequested = ticket && ticket.status?.name === 'Cancellation Requested';

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

    //this function calls the /assign endpoint (separate from the existing handleUpdate)
    const handleAssign = async (assignedToId) => {
        setActionError('');
        setSaving(true);
        try{
            const response = await api.post(`/tickets/${id}/assign`, {assigned_to: assignedToId}, authHeader);
            setTicket(response.data);
        } catch (err) {
            const data = err.response?.data;
            const message = data?.error
                || (data ? Object.values(data).flat().join(' '): 'Failed to assign ticket');
            setActionError(message);
        } finally {
            setSaving(false);
        }
    };

    //Agent requests cancellation of their assigned tickets wit reason
    const handleRequestCancellation = async () => {
        if(!cancellationReason.trim()) return;

        setActionError('');
        setRequestingCancellation(true);
        try{
            const response = await api.post(`/tickets/${id}/request-cancellation`, {reason: cancellationReason}, authHeader);
            setTicket(response.data);
            setCancellationReason('');
        } catch(err){
            const data = err.response?.data;
            const message = data?.error || (data ? Object.values(data).flat().join(' '): 'Failed to request cancellation');
            setActionError(message);
        } finally {
            setRequestingCancellation(false);
        }
    };

    //Manager resolves a pending cancellation: confirm or reassign
    const handleResolveCancellation = async () => {
        setActionError('');
        setResolvingCancellation(true);
        try{
            const payload = resolveDecision === 'reassign' ? {decision: 'reassign', assigned_to: resolveAssignedTo} : {decision: 'cancel'};
            const response = await api.post(`/tickets/${id}/resolve-cancellation`, payload, authHeader);
            setTicket(response.data);
            setResolveAssignedTo('');
        }catch(err){
            const data = err.response?.data;
            const message = data?.error || (data ? Object.values(data).flat().join(' ') : 'Failed to resolve cancellation');
            setActionError(message);
        }finally{
            setResolvingCancellation(false);
        }
    };
    //upload an attachment to ticket
    const handleUploadAttachment  = async () => {
        if (!attachmentFile) return;

        setAttachmentError('');
        setUploadingAttachment(true);

        const formData = new FormData();
        formData.append('file', attachmentFile);

        try{
            const response = await api.post(`/tickets/${id}/attachments`, formData, {
                headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data'},
            });

            setTicket((prev) => ({...prev, attachments: [...(prev.attachments ?? []), response.data] }));
            setAttachmentFile(null);
        } catch (err) {
            const data = err.response?.data;
            const message = data?.error || (data ? Object.values(data).flat().join(' '): 'Failed to upload attachment');
            setAttachmentError(message);
        } finally {
            setUploadingAttachment(false);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="mono" style={{ fontFamily: 'var(--font-heading)' }}>
                    Ticket <span className="mono">{ticket.reference_no}</span>
                </h1>
                {ticket.status?.name && (
                    <span className={`pill ${statusClass(ticket.status.name)}`} style={{ fontSize: '0.85rem' }}>
                        {ticket.status.name}
                    </span>
                )}
            </div>
            <p><Link to="/tickets">← Back to Ticket List</Link></p>

            <div className="card">
                <table>
                    <tbody>
                        <tr><td className="text-secondary" style={{ width: '160px', border: 'none' }}>Title</td><td style={{ border: 'none' }}>{ticket.title}</td></tr>
                        <tr><td className="text-secondary" style={{ border: 'none' }}>Description</td><td style={{ border: 'none' }}>{ticket.description}</td></tr>
                        <tr><td className="text-secondary" style={{ border: 'none' }}>Category</td><td style={{ border: 'none' }}>{ticket.category?.name}</td></tr>
                        <tr><td className="text-secondary" style={{ border: 'none' }}>Priority</td><td style={{ border: 'none' }}>{ticket.priority?.name}</td></tr>
                        <tr><td className="text-secondary" style={{ border: 'none' }}>Submitted by</td><td style={{ border: 'none' }}>{ticket.employee?.name ?? '—'}</td></tr>
                        <tr><td className="text-secondary" style={{ border: 'none' }}>Assigned to</td><td style={{ border: 'none' }}>{ticket.assigned_agent?.name ?? 'Unassigned'}</td></tr>
                        <tr><td className="text-secondary" style={{ border: 'none' }}>Created</td><td className="text-secondary" style={{ border: 'none' }}>{new Date(ticket.created_at).toLocaleString()}</td></tr>
                    </tbody>
                </table>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0 }}>Attachments</h3>
                {ticket.attachments && ticket.attachments.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        {ticket.attachments.map((a) => (
                            <li key={a.id} style={{ marginBottom: '0.3rem' }}>
                                <a href={`http://127.0.0.1:8000/storage/${a.file_path}`} target="_blank" rel="noreferrer">
                                    {a.file_name}
                                </a>
                                {' '}<span className="text-secondary">({(a.file_size / 1024).toFixed(0)} KB)</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="empty-state" style={{ padding: 0 }}>No attachments yet.</p>
                )}

                {((role === 'Employee' && isOwner) || role === 'Admin') && !isClosed && (
                    <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                            <input
                                type="file"
                                onChange={(e) => setAttachmentFile(e.target.files[0])}
                            />
                            <button className="btn btn-secondary" disabled={!attachmentFile || uploadingAttachment} onClick={handleUploadAttachment}>
                                {uploadingAttachment ? 'Uploading...' : 'Upload Attachment'}
                            </button>
                        </div>
                        <p className="text-secondary" style={{fontSize: '0.85rem', marginTop: '0.4rem'}}>
                            Allowed types: jpg, jpeg, png, gif, pdf, doc, docx, xls, xlsx, txt, zip. Size: 1-10MB.
                        </p>
                        {attachmentError && <p className="error-text">{attachmentError}</p>}
                    </div>
                )}
            </div>

            {actionError && <p className="error-text">{actionError}</p>}

            {role === 'Employee' && isOwner && isOpen && (
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Edit Ticket</h3>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select className="form-select" value={priorityId} onChange={(e) => setPriorityId(e.target.value)}>
                            {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        disabled={saving}
                        onClick={() => handleUpdate({ title, description, category_id: categoryId, priority_id: priorityId })}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {' '}
                    <button className="btn btn-secondary" onClick={handleDelete} style={{ color: 'var(--danger)' }}>Delete Ticket</button>
                </div>
            )}

            {role === 'Employee' && isOwner && !isOpen && (
                <p className="empty-state"><em>This ticket can no longer be edited or deleted because it is no longer Open.</em></p>
            )}

            {(role === 'Agent' || role === 'IT Support Agent') && (
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Manage Ticket</h3>
                    {isClosed && <p className="empty-state" style={{padding: 0}}><em>This ticket is closed and can no longer be modified or reassigned.</em></p>}
                    {!isClosed && (
                        <>
                            <div className="form-group" style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                                        {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <button className="btn btn-primary" disabled={saving} onClick={() => handleUpdate({ status_id: statusId })}>
                                     Update Status
                                </button>
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                {ticket.assigned_agent?.id === user.id ? (
                                    <em className="text-secondary">This ticket is assigned to you.</em>
                                ) : (
                                    <button className="btn btn-secondary" disabled={saving} onClick={() => handleAssign( user.id )}>
                                        Assign to Me
                                    </button>
                                    )}
                            </div>

                            {ticket.assigned_agent?.id === user.id && !isCancellationRequested && (
                                <div style={{ marginTop: '1rem' }}>
                                    <h4>Request Cancellation</h4>
                                    <textarea
                                        className="form-textarea"
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        rows={2}
                                        placeholder="Reason for cancellation..."
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        style={{ marginTop: '0.5rem' }}
                                        disabled={!cancellationReason.trim() || requestingCancellation}
                                        onClick={handleRequestCancellation}
                                    >
                                        {requestingCancellation ? 'Requesting...' : 'Request Cancellation'}
                                    </button>
                                </div>
                            )}
                            {isCancellationRequested && (
                                <p className="text-secondary" style={{ marginTop: '1rem' }}><em>A cancellation request is pending Manager review.</em></p>
                            )}

                        </>
                )}
                </div>
            )}

            {role === 'Admin' && (
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Admin: Full Edit</h3>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select className="form-select" value={priorityId} onChange={(e) => setPriorityId(e.target.value)}>
                            {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        disabled={saving}
                        onClick={() => handleUpdate({
                            title,
                            description,
                            category_id: categoryId,
                            priority_id: priorityId,
                            status_id: statusId,
                        })}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {' '}
                    <button className="btn btn-secondary" onClick={handleDelete} style={{ color: 'var(--danger)' }}>Delete Ticket</button>

                    <div style={{ marginTop: '1.25rem'}}>
                        <h4>Assign Ticket</h4>
                        {isClosed? (
                            <p className="empty-state" style={{padding: 0}}><em>This ticket is Closed and cannot be reassigned. Reopen it first by changing its status above.</em></p>
                        ):(
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <select className="form-select" style={{ width: 'auto' }} value ={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                                    <option value="">-- Select an agent --</option>
                                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                                <button className="btn btn-secondary" disabled={saving || !assignedTo} onClick={() => handleAssign(assignedTo)}>
                                    Assign
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {role === 'Manager' && isCancellationRequested && (
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Resolve Cancellation Request</h3>
                    {cancellationReasonText && (
                        <p style={{background: 'var(--accent-soft)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)'}}>
                            {cancellationReasonText}
                        </p>
                    )}
                    <div style={{ marginTop: '0.5rem' }}>
                        <label>
                            <input
                                type="radio"
                                name="resolveDecision"
                                value="cancel"
                                checked={resolveDecision === 'cancel'}
                                onChange={() => setResolveDecision('cancel')}
                            />
                            {' '}Confirm Cancellation
                        </label>
                        <br />
                        <label>
                            <input
                                type="radio"
                                name="resolveDecision"
                                value="reassign"
                                checked={resolveDecision === 'reassign'}
                                onChange={() => setResolveDecision('reassign')}
                            />
                            {' '}Reassign to a different Agent instead
                        </label>
                    </div>

                    {resolveDecision === 'reassign' && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <select className="form-select" style={{ width: 'auto' }} value={resolveAssignedTo} onChange={(e) => setResolveAssignedTo(e.target.value)}>
                                <option value="">-- Select an agent --</option>
                                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        style={{ marginTop: '0.75rem' }}
                        disabled={resolvingCancellation || (resolveDecision === 'reassign' && !resolveAssignedTo)}
                        onClick={handleResolveCancellation}
                    >
                        {resolvingCancellation ? 'Submitting...' : 'Submit Decision'}
                    </button>
                </div>
            )}

            {role === 'Manager' && !isCancellationRequested && (
                <p className="empty-state"><em>View-only. No pending cancellation requests on this ticket.</em></p>
            )}

            <div className="card">
                <TicketComments ticketId={id} />
            </div>
        </div>
    );
}

export default TicketDetails;

/**
 * This is one page, but it behaves differently depending on who's viewing it — mirroring the exact permission matrix we built into the backend:
 * Everyone sees the same read-only summary at the top (title, description, category, status, who submitted it, who it's assigned to)
 * If you're the Employee who owns the ticket AND it's still "Open" → you see an edit form (title/description/category/priority) plus a Delete button
 * If you're an Agent, and the ticket isn't Closed → you see a status dropdown (freeform, any value) and an "Assign to Me" button
 * If you're a Manager → you see only the read-only summary and comments; no edit, status, or assignment controls (view/monitor only)
 * If you're an Admin → you see full edit fields, status change, and delete always; the assign section is available unless the ticket is Closed (in which case status must be changed first to reopen it)
 */