import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import { getAllUsers, updateUserRole, activateUser, suspendUser, createUserProfile } from '../../services/userService';
import { ROLES } from '../../utils/constants';
import { Users, Shield, Plus } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';


const SEED_USERS = [
    { id: '1', name: 'Alice Ahmed', email: 'alice@iharvest.com', role: 'investor', isActive: true },
    { id: '2', name: 'Ben Farmer', email: 'ben@iharvest.com', role: 'farmer', isActive: true },
    { id: '3', name: 'Dr. Clara Vet', email: 'clara@iharvest.com', role: 'vet', isActive: true },
    { id: '4', name: 'David FSO', email: 'david@iharvest.com', role: 'fso', isActive: false },
    { id: '5', name: 'Eva Manager', email: 'eva@iharvest.com', role: 'cluster_manager', isActive: true },
    { id: '6', name: 'Frank Fund', email: 'frank@iharvest.com', role: 'fund_manager', isActive: true },
    { id: '7', name: 'Grace Admin', email: 'grace@iharvest.com', role: 'admin', isActive: true },
];

const UsersPage = () => {
    const [users, setUsers] = useState(SEED_USERS);
    const [editingUser, setEditingUser] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editRole, setEditRole] = useState('');
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    // New user form state
    const [newUser, setNewUser] = useState({
        uid: '',
        name: '',
        email: '',
        role: ROLES.INVESTOR
    });

    const load = async () => {
        try {
            const data = await getAllUsers();
            if (data && data.length) setUsers(data);
        } catch { /* keep seed */ }
    };

    useEffect(() => { load(); }, []);

    const openEdit = (user) => { setEditingUser(user); setEditRole(user.role); };

    const handleSave = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            await updateUserRole(editingUser.id, editRole);
            setUsers((u) => u.map((x) => x.id === editingUser.id ? { ...x, role: editRole } : x));
        } catch {
            // Optimistic local update on mock
            setUsers((u) => u.map((x) => x.id === editingUser.id ? { ...x, role: editRole } : x));
        } finally {
            setSaving(false);
            setEditingUser(null);
        }
    };

    const toggleActive = async (user) => {
        const fn = user.isActive ? suspendUser : activateUser;
        try { await fn(user.id); } catch { /* mock */ }
        setUsers((u) => u.map((x) => x.id === user.id ? { ...x, isActive: !x.isActive } : x));
    };

    const handleCreateUser = async () => {
        const { uid, name, email, role } = newUser;
        if (!uid.trim() || !name.trim() || !email.trim()) {
            addToast({ message: 'Please fill all fields (UID, Name, Email)', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            await createUserProfile(uid.trim(), {
                name: name.trim(),
                email: email.trim(),
                role
            });
            addToast({ message: 'User profile created successfully!', type: 'success' });
            setIsCreateModalOpen(false);
            setNewUser({ uid: '', name: '', email: '', role: ROLES.INVESTOR });
            load(); // Reload the list
        } catch (error) {
            addToast({ message: error.message || 'Failed to create user', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Role', accessor: 'role', render: (v) => <StatusBadge status={v} /> },
        { header: 'Status', accessor: 'isActive', render: (v) => <StatusBadge status={v ? 'active' : 'suspended'} /> },
        {
            header: 'Actions', accessor: 'id',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
                    <Button size="sm" variant={row.isActive ? 'danger' : 'primary'} onClick={() => toggleActive(row)}>
                        {row.isActive ? 'Suspend' : 'Activate'}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                        User Management
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>View, edit roles, and manage all platform users.</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
                    Add User
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                <Card variant="stat" title="Total Users" value={String(users.length)} icon={Users} />
                <Card variant="stat" title="Active" value={String(users.filter(u => u.isActive).length)} icon={Shield} trend={{ value: 0, isPositive: true }} />
            </div>

            <Card
                title="Quick Role Initialization"
                style={{ marginBottom: 'var(--spacing-xl)', border: '2px solid var(--primary-color)', background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, rgba(22, 163, 74, 0.1) 100%)' }}
            >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <Input
                            label="Auth UID"
                            placeholder="Paste UID from Firebase"
                            value={newUser.uid}
                            onChange={(e) => setNewUser({ ...newUser, uid: e.target.value })}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.85rem', fontWeight: 600 }}>Role</label>
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'white' }}
                        >
                            {Object.values(ROLES).map((r) => (
                                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <Button variant="primary" icon={Plus} onClick={handleCreateUser} disabled={saving} style={{ height: '42px' }}>
                        {saving ? 'Creating...' : 'Initialize Role'}
                    </Button>
                </div>
                <p style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Use this to create the Firestore profile for Vets, FSOs, Farmers, etc., after creating their Auth accounts.
                </p>
            </Card>

            <Card title="All Users">
                <Table columns={columns} data={users} searchable pageSize={8} />
            </Card>

            {/* Edit User Modal */}
            <Modal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title={`Edit User — ${editingUser?.name}`}
                size="sm"
                footer={
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Role
                        </label>
                        <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                        >
                            {Object.values(ROLES).map((r) => (
                                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Create User Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New User Profile"
                size="sm"
                footer={
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateUser} disabled={saving}>
                            {saving ? 'Creating…' : 'Create Profile'}
                        </Button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <Input
                        label="Firebase UID"
                        placeholder="Copy from Auth Console"
                        value={newUser.uid}
                        onChange={(e) => setNewUser({ ...newUser, uid: e.target.value })}
                        disabled={saving}
                    />
                    <Input
                        label="Full Name"
                        placeholder="John Doe"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        disabled={saving}
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="user@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        disabled={saving}
                    />
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Role
                        </label>
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                        >
                            {Object.values(ROLES).map((r) => (
                                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default UsersPage;
