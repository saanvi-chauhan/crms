import React, { useState, useEffect, useRef } from 'react';
import { Users, FileText, AlertCircle, Shield, Activity, Home, LogOut, Settings, Plus, Search, Filter, Eye, Edit, MapPin, User, Phone, Award, CheckCircle, XCircle, Clock, FileWarning, Briefcase, UserPlus, Lock } from 'lucide-react';
import { authAPI, casesAPI, criminalsAPI, investigationsAPI, staffAPI, dashboardAPI, usersAPI, rolesAPI, auditAPI, crimeCategoriesAPI, firAPI } from './api';
const CRMS = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  // Data states
  const [cases, setCases] = useState([]);
  const [criminals, setCriminals] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [policeStaff, setPoliceStaff] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [crimeCategories, setCrimeCategories] = useState([]);
  const [showFIRModal, setShowFIRModal] = useState(false);
  const firFormRef = useRef(null);


  // Role definitions
  // Role definitions - Updated RBAC
  const ROLES = {
    Admin: {
      role_id: 1,
      displayName: 'Administrator',
      permissions: [
        'all', 'manage_users', 'manage_roles', 'view_cases', 'create_case', 'edit_case',
        'delete_case', 'view_criminals', 'create_criminal', 'edit_criminal', 'delete_criminal',
        'view_investigations', 'create_investigation', 'edit_investigation', 'view_staff',
        'manage_staff', 'system_settings'
      ]
    },
    Superintendent: {
      role_id: 2,
      displayName: 'Superintendent',
      permissions: [
        'view_audit_logs', 'view_cases', 'edit_case', 'assign_cases', 'view_criminals',
        'edit_criminal', 'view_investigations', 'assign_investigations', 'view_staff',
        'view_reports', 'generate_reports', 'approve_actions'
      ]
    },
    CID: {
      role_id: 3,
      displayName: 'CID (Investigating Officer)',
      permissions: [
        'view_cases', 'edit_case', 'view_criminals', 'create_criminal', 'edit_criminal',
        'view_investigations', 'create_investigation', 'edit_investigation', 'view_evidence',
        'add_evidence', 'update_case_status', 'view_reports'
      ]
    },
    NCO: {
      role_id: 4,
      displayName: 'NCO (Station Writer)',
      permissions: [
        'view_cases', 'create_case', 'create_fir', 'view_criminals', 'create_criminal',
        'view_investigations', 'basic_data_entry'
      ]
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    const userRole = ROLES[currentUser.role_name];
    return userRole?.permissions.includes('all') || userRole?.permissions.includes(permission);
  };

  // Fetch data functions
  const fetchCases = async () => {
    try {
      const data = await casesAPI.getAll();
      setCases(data);
    } catch (err) {
      console.error('Error fetching cases:', err);
    }
  };

  const fetchCriminals = async () => {
    try {
      const data = await criminalsAPI.getAll();
      setCriminals(data);
    } catch (err) {
      console.error('Error fetching criminals:', err);
    }
  };

  const fetchInvestigations = async () => {
    try {
      const data = await investigationsAPI.getAll();
      setInvestigations(data);
    } catch (err) {
      console.error('Error fetching investigations:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await staffAPI.getAll();
      setPoliceStaff(data);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const fetchCrimeCategories = async () => {
    try {
      const data = await crimeCategoriesAPI.getAll();
      setCrimeCategories(data);
    } catch (err) {
      console.error('Error fetching crime categories:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };
  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await rolesAPI.getAll();
      setRoles(data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await auditAPI.getLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  // Load data when user logs in
  // Load data when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchCases();
      fetchCriminals();
      fetchInvestigations();
      fetchStaff();
      fetchStats();
      fetchCrimeCategories();

      // Load users and roles if Admin
      if (hasPermission('manage_users')) {
        fetchUsers();
        fetchRoles();
      }

      // Load audit logs if Superintendent
      if (hasPermission('view_audit_logs')) {
        fetchAuditLogs();
      }
    }
  }, [currentUser]);

  // Login Component
  const LoginPage = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');

    const handleLogin = async (e) => {
      e.preventDefault();
      setLoading(true);
      setLoginError('');

      try {
        const data = await authAPI.login(credentials.username, credentials.password);
        setCurrentUser(data.user);
        setCurrentView('dashboard');
      } catch (err) {
        setLoginError(err.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full mb-4 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">CRMS</h1>
            <p className="text-gray-600">Crime Records Management System</p>
            <p className="text-sm text-gray-500 mt-1">Secure Police Portal</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter username"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In Securely'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500 mb-2">Demo Credentials:</p>
            <p className="text-xs text-center text-gray-600">admin / password123</p>
          </div>
        </div>
      </div>
    );
  };

  // Navigation Sidebar
  // Navigation Sidebar
  const Sidebar = () => {
    const menuItems = [
      { icon: Home, label: 'Dashboard', view: 'dashboard', permission: 'view_cases' },
      { icon: FileText, label: 'Cases', view: 'cases', permission: 'view_cases' },
      { icon: Users, label: 'Criminals', view: 'criminals', permission: 'view_criminals' },
      { icon: Activity, label: 'Investigations', view: 'investigations', permission: 'view_investigations' },
      { icon: Shield, label: 'Police Staff', view: 'staff', permission: 'view_staff' },
      { icon: UserPlus, label: 'User Management', view: 'users', permission: 'manage_users' },
      { icon: FileText, label: 'Audit Logs', view: 'audit', permission: 'view_audit_logs' },
      { icon: Settings, label: 'Settings', view: 'settings', permission: 'system_settings' },
    ];

    return (
      <div className="w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-screen p-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-700">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl">CRMS</h2>
            <p className="text-xs text-gray-400">{currentUser?.role_name}</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            if (item.permission !== 'view_cases' && !hasPermission(item.permission)) return null;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === item.view
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-800 rounded-lg p-4 mb-3 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{currentUser?.staff_name}</p>
                <p className="text-xs text-gray-400">{currentUser?.badge_number}</p>
                <p className="text-xs text-gray-500">{currentUser?.department}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              authAPI.logout();
              setCurrentUser(null);
              setCurrentView('login');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    );
  };

  // Dashboard View
  const Dashboard = () => {
    const statCards = [
      { label: 'Total Cases', value: stats?.total_cases || 0, icon: FileText, color: 'from-blue-500 to-blue-600' },
      { label: 'Open Cases', value: stats?.open_cases || 0, icon: AlertCircle, color: 'from-yellow-500 to-yellow-600' },
      { label: 'Wanted Criminals', value: stats?.wanted_criminals || 0, icon: Users, color: 'from-red-500 to-red-600' },
      { label: 'Active Staff', value: stats?.active_staff || 0, icon: Shield, color: 'from-green-500 to-green-600' }
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {currentUser?.staff_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Cases</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">FIR Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Crime Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 5).map((case_) => (
                  <tr key={case_.case_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-blue-600">{case_.FIR_number}</td>
                    <td className="py-3 px-4">{case_.crime_name}</td>
                    <td className="py-3 px-4">{case_.city}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${case_.status === 'Open' ? 'bg-yellow-100 text-yellow-700' :
                        case_.status === 'Under Investigation' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {case_.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{case_.date_reported}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Cases View
  const CasesView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditCaseModal, setShowEditCaseModal] = useState(false);
    const [editingCase, setEditingCase] = useState(null);
    const [editFormData, setEditFormData] = useState({
      status: '',
      description: ''
    });

    const handleEditCase = (case_) => {
      setEditingCase(case_);
      setEditFormData({
        status: case_.status,
        description: case_.description || ''
      });
      setShowEditCaseModal(true);
    };

    const handleUpdateCase = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await casesAPI.update(editingCase.case_id, editFormData);
        setShowEditCaseModal(false);
        setEditingCase(null);
        await fetchCases();
        alert('Case updated successfully!');
      } catch (err) {
        alert('Error updating case: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Cases Management</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              {hasPermission('create_fir') && (
                <button
                  onClick={() => setShowFIRModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Register New FIR
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">FIR Number</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Crime Type</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Location</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.filter(c =>
                  c.FIR_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.crime_name?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((case_) => (
                  <tr key={case_.case_id} className="border-b hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-blue-600">{case_.FIR_number}</td>
                    <td className="py-4 px-4">{case_.crime_name}</td>
                    <td className="py-4 px-4">{case_.city}, {case_.district}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${case_.status === 'Open' ? 'bg-yellow-100 text-yellow-700' :
                        case_.status === 'Under Investigation' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {case_.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm">{case_.date_reported}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('edit_case') && (
                          <button
                            onClick={() => handleEditCase(case_)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit Case">
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Case Modal */}
        {showEditCaseModal && editingCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit Case</h2>
                <button
                  onClick={() => setShowEditCaseModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800">{editingCase.FIR_number}</h3>
                <p className="text-sm text-gray-600">{editingCase.crime_name}</p>
                <p className="text-sm text-gray-600">{editingCase.city}, {editingCase.district}</p>
              </div>

              <form onSubmit={handleUpdateCase} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required>
                    <option value="Open">Open</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Closed">Closed</option>
                    <option value="Chargesheeted">Chargesheeted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="4"
                    placeholder="Update case description..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {loading ? 'Updating...' : 'Update Case'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditCaseModal(false)}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Criminals View
  const CriminalsView = () => {
    const [showEditCriminalModal, setShowEditCriminalModal] = useState(false);
    const [editCriminal, setEditCriminal] = useState(null);

    // Edit modal open handler
    const handleEditCriminalOpen = (criminal) => {
      setEditCriminal({
        ...criminal,
        wanted_reason: criminal.wanted_reason || '',
      });
      setShowEditCriminalModal(true);
    };
    // Edit submit handler
    const handleEditCriminalSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const updateData = {
          is_wanted: Boolean(editCriminal.is_wanted),
          wanted_reason: editCriminal.wanted_reason || null,
        };
        await criminalsAPI.update(editCriminal.criminal_id, updateData);
        setShowEditCriminalModal(false);
        setEditCriminal(null);
        await fetchCriminals();
        alert('Criminal update successful!');
      } catch (err) {
        console.error('Edit criminal error:', err);
        alert('Error updating criminal: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    const [showAddCriminalModal, setShowAddCriminalModal] = useState(false);
    const [activeCases, setActiveCases] = useState([]);
    const [loadingActiveCases, setLoadingActiveCases] = useState(false);
    const [newCriminal, setNewCriminal] = useState({
      name: '',
      alias: '',
      gender: '',
      date_of_birth: '',
      height: '',
      weight: '',
      eye_color: '',
      hair_color: '',
      distinguishing_marks: '',
      address: '',
      contact_number: '',
      is_wanted: false,
      wanted_reason: '',
      linked_case_id: ''
    });

    // Fetch active cases when modal opens
    useEffect(() => {
      if (showAddCriminalModal) {
        fetchActiveCases();
      }
    }, [showAddCriminalModal]);

    const fetchActiveCases = async () => {
      setLoadingActiveCases(true);
      try {
        const data = await casesAPI.getActive();
        setActiveCases(data);
        console.log('✅ Fetched active cases:', data.length, 'cases');
      } catch (err) {
        console.error('❌ Error fetching active cases:', err);
        setActiveCases([]);
      } finally {
        setLoadingActiveCases(false);
      }
    };

    const handleAddCriminal = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const criminalData = {
          name: newCriminal.name.trim(),
          alias: newCriminal.alias?.trim() || null,
          gender: newCriminal.gender,
          date_of_birth: newCriminal.date_of_birth || null,
          height: newCriminal.height ? parseInt(newCriminal.height) : null,
          weight: newCriminal.weight ? parseInt(newCriminal.weight) : null,
          eye_color: newCriminal.eye_color?.trim() || null,
          hair_color: newCriminal.hair_color?.trim() || null,
          distinguishing_marks: newCriminal.distinguishing_marks?.trim() || null,
          address: newCriminal.address?.trim() || null,
          contact_number: newCriminal.contact_number?.trim() || null,
          is_wanted: Boolean(newCriminal.is_wanted),
          wanted_reason: newCriminal.wanted_reason?.trim() || null,
          linked_case_id: newCriminal.linked_case_id ? parseInt(newCriminal.linked_case_id) : null,
        };
        if (!criminalData.name || !criminalData.gender) {
          throw new Error('Name and gender are required');
        }
        await criminalsAPI.create(criminalData);
        setShowAddCriminalModal(false);
        setNewCriminal({
          name: '',
          alias: '',
          gender: '',
          date_of_birth: '',
          height: '',
          weight: '',
          eye_color: '',
          hair_color: '',
          distinguishing_marks: '',
          address: '',
          contact_number: '',
          is_wanted: false,
          wanted_reason: '',
          linked_case_id: ''
        });
        await fetchCriminals();
        alert('Criminal record added successfully!');
      } catch (err) {
        console.error('Add criminal error:', err);
        alert('Error adding criminal: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Criminal Records</h1>
          {(hasPermission('all') || hasPermission('create_criminal')) && (
            <button
              onClick={() => setShowAddCriminalModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
              <Plus className="w-5 h-5" />
              Add New Criminal
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {criminals.map((criminal) => (
            <div key={criminal.criminal_id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{criminal.name}</h3>
                      <p className="text-sm text-gray-600">Alias: {criminal.alias || 'N/A'}</p>
                    </div>
                    {criminal.is_wanted && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">WANTED</span>
                    )}
                    <button
                      className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full hover:bg-blue-200"
                      onClick={() => handleEditCriminalOpen(criminal)}
                    >Edit</button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Gender</p>
                      <p className="text-sm font-semibold text-gray-800">{criminal.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Cases</p>
                      <p className="text-sm font-semibold text-gray-800">{criminal.total_cases}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Criminal Modal */}
        {showAddCriminalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add New Criminal Record</h2>
                <button
                  onClick={() => setShowAddCriminalModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleAddCriminal} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={newCriminal.name}
                      onChange={(e) => setNewCriminal({ ...newCriminal, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Alias</label>
                    <input
                      type="text"
                      value={newCriminal.alias}
                      onChange={(e) => setNewCriminal({ ...newCriminal, alias: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                    <select
                      value={newCriminal.gender}
                      onChange={(e) => setNewCriminal({ ...newCriminal, gender: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={newCriminal.date_of_birth}
                      onChange={(e) => setNewCriminal({ ...newCriminal, date_of_birth: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={newCriminal.height}
                      onChange={(e) => setNewCriminal({ ...newCriminal, height: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="170"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      value={newCriminal.weight}
                      onChange={(e) => setNewCriminal({ ...newCriminal, weight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="70"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Eye Color</label>
                    <input
                      type="text"
                      value={newCriminal.eye_color}
                      onChange={(e) => setNewCriminal({ ...newCriminal, eye_color: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Brown"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hair Color</label>
                    <input
                      type="text"
                      value={newCriminal.hair_color}
                      onChange={(e) => setNewCriminal({ ...newCriminal, hair_color: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Distinguishing Marks</label>
                  <textarea
                    value={newCriminal.distinguishing_marks}
                    onChange={(e) => setNewCriminal({ ...newCriminal, distinguishing_marks: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="3"
                    placeholder="Tattoos, scars, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <textarea
                    value={newCriminal.address}
                    onChange={(e) => setNewCriminal({ ...newCriminal, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                  <input
                    type="text"
                    value={newCriminal.contact_number}
                    onChange={(e) => setNewCriminal({ ...newCriminal, contact_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newCriminal.is_wanted}
                      onChange={(e) => setNewCriminal({ ...newCriminal, is_wanted: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Wanted Criminal</span>
                  </label>
                </div>

                {newCriminal.is_wanted && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Wanted Reason</label>
                    <textarea
                      value={newCriminal.wanted_reason}
                      onChange={(e) => setNewCriminal({ ...newCriminal, wanted_reason: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      rows="3"
                      placeholder="Reason for being wanted..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Case Linking</label>
                  <div className="flex items-center gap-4 mb-2">
                    <label>
                      <input
                        type="radio"
                        name="linkToCase"
                        value="no"
                        checked={!newCriminal.linked_case_id}
                        onChange={() => setNewCriminal({ ...newCriminal, linked_case_id: '' })}
                      />{' '}
                      Don’t link to any case
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="linkToCase"
                        value="yes"
                        checked={!!newCriminal.linked_case_id}
                        onChange={() => setNewCriminal({ ...newCriminal, linked_case_id: activeCases[0]?.case_id || '' })}
                        disabled={activeCases.length === 0}
                      />{' '}
                      Link to an active case
                    </label>
                  </div>
                  {newCriminal.linked_case_id && (
                    <select
                      value={newCriminal.linked_case_id}
                      onChange={(e) => setNewCriminal({ ...newCriminal, linked_case_id: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                      disabled={loadingActiveCases}>
                      <option value="">{loadingActiveCases ? 'Loading cases...' : 'Select an active case'}</option>
                      {!loadingActiveCases && activeCases.length === 0 && (
                        <option value="" disabled>No active cases available - Click Refresh below</option>
                      )}
                      {activeCases.map((case_) => (
                        <option key={case_.case_id} value={case_.case_id} disabled={case_.accused_status === 'Has Primary Accused'}>
                          {case_.FIR_number} - {case_.crime_name} ({case_.city}) [{case_.accused_status}]
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto border text-xs text-gray-700 my-2">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-semibold">Active cases:</div>
                      <button
                        type="button"
                        onClick={fetchActiveCases}
                        disabled={loadingActiveCases}
                        className="text-xs bg-blue-500 hover:bg-blue-700 text-white px-2 py-0.5 rounded ml-2 disabled:opacity-50">
                        {loadingActiveCases ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                    {loadingActiveCases ? (
                      <div className="italic text-blue-600">Loading active cases...</div>
                    ) : activeCases.length === 0 ? (
                      <div className="italic text-orange-600">No active cases found. Click Refresh to reload.</div>
                    ) : (
                      <ul>
                        {activeCases.map((c) => (
                          <li key={c.case_id} className="mb-1">
                            <span className="font-semibold">{c.FIR_number}</span> - {c.crime_name} ({c.city}) <span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-gray-300 text-gray-900 font-bold">{c.accused_status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {loading ? 'Adding Criminal...' : 'Add Criminal Record'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCriminalModal(false)}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Criminal Modal */}
        {showEditCriminalModal && editCriminal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit Criminal (Wanted Status)</h2>
                <button
                  onClick={() => setShowEditCriminalModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleEditCriminalSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!editCriminal.is_wanted}
                      onChange={(e) => setEditCriminal({ ...editCriminal, is_wanted: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Wanted Criminal</span>
                  </label>
                </div>
                {editCriminal.is_wanted && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Wanted Reason</label>
                    <textarea
                      value={editCriminal.wanted_reason || ''}
                      onChange={(e) => setEditCriminal({ ...editCriminal, wanted_reason: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      rows="3"
                      placeholder="Reason for being wanted..."
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditCriminalModal(false)}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Investigations View
  const InvestigationsView = () => {
    const [showAddInvestigationModal, setShowAddInvestigationModal] = useState(false);
    const [newInvestigation, setNewInvestigation] = useState({
      case_id: '',
      assigned_to: '',
      investigation_notes: '',
      status: 'Open',
      related_criminal_id: '',
    });
    const [selectedInvestigation, setSelectedInvestigation] = useState(null);
    const [updateStatus, setUpdateStatus] = useState('');

    // Helper functions to close and relate investigations
    const handleAddInvestigation = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const investigationData = {
          case_id: parseInt(newInvestigation.case_id),
          assigned_to: parseInt(newInvestigation.assigned_to),
          investigation_notes: newInvestigation.investigation_notes || null,
          status: newInvestigation.status || 'Open',
        };
        if (!investigationData.case_id || !investigationData.assigned_to) {
          throw new Error('Please select both a case and an assigned officer');
        }
        await investigationsAPI.create(investigationData);
        setShowAddInvestigationModal(false);
        setNewInvestigation({ case_id: '', assigned_to: '', investigation_notes: '', status: 'Open', related_criminal_id: '' });
        await fetchInvestigations();
        alert('Investigation created successfully!');
      } catch (err) {
        console.error('Add investigation error:', err);
        alert('Error creating investigation: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    const handleStatusUpdate = async (invId, status) => {
      if (!window.confirm('Are you sure you want to close this investigation?')) {
        return;
      }
      setLoading(true);
      try {
        await investigationsAPI.update(invId, { status: status });
        await fetchInvestigations();
        alert('Investigation status updated!');
      } catch (err) {
        console.error('Update investigation status error:', err);
        alert('Error updating status: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Investigations</h1>
          {(hasPermission('all') || hasPermission('create_investigation')) && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              onClick={() => setShowAddInvestigationModal(true)}
            >
              <Plus className="w-5 h-5 inline mr-1" /> Add Investigation
            </button>
          )}
        </div>

        {showAddInvestigationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add New Investigation</h2>
                <button
                  onClick={() => setShowAddInvestigationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleAddInvestigation} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Case *</label>
                  <select
                    value={newInvestigation.case_id}
                    onChange={e => setNewInvestigation({ ...newInvestigation, case_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select Case</option>
                    {cases.map(c => (
                      <option key={c.case_id} value={c.case_id}>{c.FIR_number} - {c.crime_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Officer *</label>
                  <select
                    value={newInvestigation.assigned_to}
                    onChange={e => setNewInvestigation({ ...newInvestigation, assigned_to: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select Officer</option>
                    {policeStaff.map(staff => (
                      <option key={staff.staff_id} value={staff.staff_id}>{staff.name} - {staff.badge_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Progress Notes</label>
                  <textarea
                    value={newInvestigation.investigation_notes}
                    onChange={e => setNewInvestigation({ ...newInvestigation, investigation_notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Related Criminal (Optional)</label>
                  <select
                    value={newInvestigation.related_criminal_id}
                    onChange={e => setNewInvestigation({ ...newInvestigation, related_criminal_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">No criminal selected</option>
                    {criminals.map(c => (
                      <option key={c.criminal_id} value={c.criminal_id}>{c.name} {c.alias ? `(${c.alias})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={newInvestigation.status}
                    onChange={e => setNewInvestigation({ ...newInvestigation, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {loading ? 'Adding...' : 'Add Investigation'}
                  </button>
                  <button type="button" className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors" onClick={() => setShowAddInvestigationModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {investigations.map((inv) => (
            <div key={inv.investigation_id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Investigation #{inv.investigation_id}</h3>
                  <p className="text-sm text-gray-600">Case: {inv.FIR_number} - {inv.crime_name}</p>
                </div>
                {/* Close Investigation button - Only CID can close */}
                {currentUser?.role_name === 'CID' && inv.status !== 'Closed' && (
                  <button
                    className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-semibold ml-2 hover:bg-red-200"
                    onClick={() => handleStatusUpdate(inv.investigation_id, 'Closed')}
                  >
                    Close Investigation
                  </button>
                )}
                {hasPermission('all') && inv.status !== 'Closed' && (
                  <button
                    className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-semibold ml-2 hover:bg-red-200"
                    onClick={() => handleStatusUpdate(inv.investigation_id, 'Closed')}
                  >
                    Close Investigation (Admin)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Assigned Officer</p>
                  <p className="font-semibold text-gray-800">{inv.officer_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                  <p className="font-semibold text-gray-800">{inv.last_updated}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Progress Notes</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{inv.progress_notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  // Staff View
  const StaffView = () => {
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [newStaff, setNewStaff] = useState({
      name: '',
      pol_rank: '',
      badge_number: '',
      contact: '',
      department: '',
      join_date: '',
    });

    const handleAddStaff = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const staffData = {
          name: newStaff.name.trim(),
          pol_rank: newStaff.pol_rank.trim(),
          badge_number: newStaff.badge_number.trim(),
          contact: newStaff.contact?.trim() || null,
          department: newStaff.department?.trim() || null,
          join_date: newStaff.join_date || null,
        };
        if (!staffData.name || !staffData.pol_rank || !staffData.badge_number) {
          throw new Error('Name, rank, and badge number are required');
        }
        await staffAPI.create(staffData);
        setShowAddStaffModal(false);
        setNewStaff({
          name: '',
          pol_rank: '',
          badge_number: '',
          contact: '',
          department: '',
          join_date: '',
        });
        await fetchStaff();
        alert('Police staff added successfully!');
      } catch (err) {
        console.error('Add staff error:', err);
        alert('Error adding staff: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Police Staff</h1>
          {(currentUser?.role_name === 'Admin' || currentUser?.role_name === 'Superintendent') && (
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
              <Plus className="w-5 h-5" />
              Add New Police Staff
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Badge</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Department</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Contact</th>
                </tr>
              </thead>
              <tbody>
                {policeStaff.map((staff) => (
                  <tr key={staff.staff_id} className="border-b hover:bg-blue-50">
                    <td className="py-4 px-4 font-mono font-semibold">{staff.badge_number}</td>
                    <td className="py-4 px-4">{staff.name}</td>
                    <td className="py-4 px-4">{staff.pol_rank}</td>
                    <td className="py-4 px-4">{staff.department}</td>
                    <td className="py-4 px-4">{staff.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Staff Modal */}
        {showAddStaffModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add New Police Staff</h2>
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rank *</label>
                  <input
                    type="text"
                    value={newStaff.pol_rank}
                    onChange={(e) => setNewStaff({ ...newStaff, pol_rank: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="SI, ASI, Constable, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Badge Number *</label>
                  <input
                    type="text"
                    value={newStaff.badge_number}
                    onChange={(e) => setNewStaff({ ...newStaff, badge_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact</label>
                  <input
                    type="text"
                    value={newStaff.contact}
                    onChange={(e) => setNewStaff({ ...newStaff, contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Join Date</label>
                  <input
                    type="date"
                    value={newStaff.join_date}
                    onChange={(e) => setNewStaff({ ...newStaff, join_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {loading ? 'Adding...' : 'Add Staff'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };
  // User Management View (Admin and Superintendent Only)
  const UserManagementView = () => {
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role_id: '', staff_id: '' });

    if (!currentUser || !(currentUser.role_name === 'Admin' || currentUser.role_name === 'Superintendent')) {
      return <div className="p-6 text-xl font-semibold text-red-700">Access Denied</div>;
    }


    const handleAddUser = async (e) => {
      e.preventDefault();
      try {
        setLoading(true);
        await usersAPI.create(newUser);
        await fetchUsers(); // Refresh the list
        setShowAddUserModal(false);
        setNewUser({ username: '', password: '', role_id: '', staff_id: '' });
        alert('User created successfully!');
      } catch (err) {
        alert('Error creating user: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteUser = async (userId) => {
      if (window.confirm('Are you sure you want to lock this user account?')) {
        try {
          await usersAPI.delete(userId);
          await fetchUsers();
          alert('User account locked successfully!');
        } catch (err) {
          alert('Error locking user: ' + err.message);
        }
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and roles</p>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
            <Plus className="w-5 h-5" />
            Add New User
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Username</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Staff Name</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Badge</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Last Login</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b hover:bg-blue-50">
                    <td className="py-4 px-4 font-semibold text-blue-600">{user.username}</td>
                    <td className="py-4 px-4">{user.staff_name}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role_name === 'Admin' ? 'bg-purple-100 text-purple-700' :
                        user.role_name === 'Superintendent' ? 'bg-blue-100 text-blue-700' :
                          user.role_name === 'CID' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {user.role_name}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-sm">{user.badge_number}</td>
                    <td className="py-4 px-4">
                      {user.is_active ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Locked</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDeleteUser(user.user_id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Lock User">
                          <Lock className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add New User</h2>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    minLength="6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select
                    value={newUser.role_id}
                    onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required>
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Staff Member</label>
                  <select
                    value={newUser.staff_id}
                    onChange={(e) => setNewUser({ ...newUser, staff_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required>
                    <option value="">Select Staff Member</option>
                    {policeStaff.map(staff => (
                      <option key={staff.staff_id} value={staff.staff_id}>
                        {staff.name} - {staff.badge_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showFIRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Register New FIR</h2>
                <button
                  onClick={() => setShowFIRModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form ref={firFormRef} onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const form = firFormRef.current;
                  const fd = new FormData(form);
                  const dataObj = Object.fromEntries(fd.entries());

                  const payload = {
                    ...dataObj,
                    crime_type_id: dataObj.crime_type_id ? Number(dataObj.crime_type_id) : undefined,
                    latitude: dataObj.latitude ? Number(dataObj.latitude) : null,
                    longitude: dataObj.longitude ? Number(dataObj.longitude) : null,
                  };

                  if (!payload.FIR_number || !payload.complainant_name || !payload.crime_type_id || !payload.date_reported) {
                    alert('Please fill in all required fields: FIR number, complainant name, crime type, date reported');
                    setLoading(false);
                    return;
                  }

                  await firAPI.register(payload);
                  setShowFIRModal(false);
                  form.reset();
                  await fetchCases();
                  alert('FIR registered successfully!');
                } catch (err) {
                  alert('Error registering FIR: ' + (err.message || err));
                } finally {
                  setLoading(false);
                }
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">FIR Number *</label>
                    <input
                      name="FIR_number"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Complainant Name *</label>
                    <input
                      name="complainant_name"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Crime Type *</label>
                    <select
                      name="crime_type_id"
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="">Select Crime Type</option>
                      {crimeCategories.map(cat => (
                        <option key={cat.crime_type_id} value={cat.crime_type_id}>{cat.crime_name} ({cat.ipc_section})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date Reported *</label>
                    <input
                      name="date_reported"
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      name="city"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                    <input
                      name="district"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Place of Offence</label>
                  <input
                    name="place_of_offence"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Police Station</label>
                  <input
                    name="police_station"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Complainant Contact</label>
                    <input
                      name="complainant_contact"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date Filed</label>
                    <input
                      name="date_filed"
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="4"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {loading ? 'Registering...' : 'Register FIR'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFIRModal(false)}
                    className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };
  // Audit Logs View (Superintendent Only)
  const AuditLogsView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Audit Logs</h1>
            <p className="text-gray-600 mt-1">System activity and security audit trail</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Logs</p>
            <p className="text-2xl font-bold text-gray-800">{auditLogs.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Timestamp</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Action</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Table</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Record ID</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.log_id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-gray-800">{log.username}</p>
                        <p className="text-xs text-gray-600">{log.staff_name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${log.role_name === 'Admin' ? 'bg-purple-100 text-purple-700' :
                        log.role_name === 'Superintendent' ? 'bg-blue-100 text-blue-700' :
                          log.role_name === 'CID' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {log.role_name}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'DELETE' || log.action === 'DEACTIVATE' ? 'bg-red-100 text-red-700' :
                            log.action === 'LOGIN' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                        }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-sm">{log.table_name}</td>
                    <td className="py-4 px-4 text-gray-600">{log.record_id || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  // Main render
  // Main render
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'cases': return <CasesView />;
      case 'criminals': return <CriminalsView />;
      case 'investigations': return <InvestigationsView />;
      case 'staff': return <StaffView />;
      case 'users': return <UserManagementView />;
      case 'audit': return <AuditLogsView />;
      default: return <Dashboard />;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen theme-cyber">
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen theme-cyber">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default CRMS;