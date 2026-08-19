import { useState, useEffect } from "react";
import {useAuth} from "./AuthContext.jsx";
import {Navigate} from "react-router-dom";
import api from "./api.js";

function ManageUsers(){
    const {token, user} = useAuth();
    const isAdmin = user?.role?.name === 'Admin';

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingRoleByUser, setPendingRoleByUser] = useState({});
    const [savingUserId, setSavingUserId]  =useState(null);

    const authHeader = {headers: {Authorization: `Bearer ${token}`}};

    const loadUsers = () => {
        setLoading(true);
        api.get('/users', authHeader)
            .then((response)=>setUsers(response.data))
            .catch(()=>setError('Failed to load users'))
            .finally(()=>setLoading(false));
    };

    useEffect(() => {
        if(!isAdmin) return;
        loadUsers();
        api.get('/roles', authHeader).then((response) => setRoles(response.data));
    }, [token]);

    const handleAssign = async (userId) => {
        const roleId = pendingRoleByUser[userId];
        if(!roleId) return;

        setSavingUserId(userId);
        setError('');
        try{
            await api.post(`/users/${userId}/assign-role`, {role_id: roleId}, authHeader);
            loadUsers();
        } catch(err){
            setError('Failed to assign role');
        } finally{
            setSavingUserId(null);
        }
    };

    const handleDelete = async (userId, userName) => {
        if(!window.confirm(`Delete ${userName}? This cannot be undone`)) return;

        setError('');
        try{
            await api.delete(`/users/${userId}`, authHeader);
            loadUsers();
        } catch(err){
            const message = err.response?.data?.error ?? 'Failed to delete user';
            setError(message);
        }
    };

    if(!isAdmin){
        return <Navigate to="/" />;
    }

    return (
        <div>
            <h1>Manage Users</h1>
            <p className="text-secondary">Assign roles to new users, or change an existing user's role.</p>

            {error && <p className="error-text">{error}</p>}

            {loading ? (
                <p className="text-secondary">Loading users...</p>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Current Role</th>
                                <th>Assign Role</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td className="text-secondary">{u.email}</td>
                                    <td>
                                        {u.role?.name ? (
                                            <span className="pill pill-open">{u.role.name}</span>
                                        ) : (
                                            <span className="pill pill-cancelled">Unassigned</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <select
                                                className="form-select"
                                                style={{ width: 'auto' }}
                                                value={pendingRoleByUser[u.id] ?? ''}
                                                onChange={(e) =>
                                                    setPendingRoleByUser((prev) => ({ ...prev, [u.id]: e.target.value }))
                                                }
                                            >
                                                <option value="">-- Select role --</option>
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                className="btn btn-secondary"
                                                disabled={!pendingRoleByUser[u.id] || savingUserId === u.id}
                                                onClick={() => handleAssign(u.id)}
                                            >
                                                {savingUserId === u.id ? 'Saving...' : 'Assign'}
                                            </button>
                                        </div>
                                    </td>

                                    <td>
                                        {u.id !== user.id && (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ color: 'var(--danger)' }}
                                                onClick={() => handleDelete(u.id, u.name)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>

                                    
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ManageUsers;