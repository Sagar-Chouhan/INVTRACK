import { useState, useEffect } from 'react'
import { usersAPI, categoriesAPI } from '../../services/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  User,
  ClipboardCheck,
  X,
  Save,
  Tag,
  Package,
} from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    role: 'user',
  })
  const [selectedCategories, setSelectedCategories] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, categoriesData] = await Promise.all([
        usersAPI.getAll(),
        categoriesAPI.getAll(),
      ])
      console.log('=== LOAD DATA ===')
      console.log('Loaded users:', usersData)
      console.log('Loaded categories:', categoriesData)
      console.log('Users count:', usersData?.length)
      console.log('Categories count:', categoriesData?.length)
      
      // Find Kavya and log her details
      const kavya = usersData?.find(u => u.full_name === 'Kavya')
      if (kavya) {
        console.log('Kavya details:', kavya)
        console.log('Kavya assigned_categories:', kavya.assigned_categories)
      }
      
      setUsers(Array.isArray(usersData) ? usersData : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      console.log('=== END LOAD ===\n')
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      role: user.role || 'user',
    })
    setShowEditModal(true)
  }

  const handleAssignCategories = (user) => {
    console.log('=== ASSIGN CATEGORIES MODAL ===')
    console.log('User:', user)
    console.log('User ID:', user._id)
    console.log('Current assigned_categories:', user.assigned_categories)
    console.log('Available categories:', categories)
    
    setEditingUser(user)
    const currentCategories = user.assigned_categories?.map(c => c._id || c) || []
    console.log('Mapped category IDs:', currentCategories)
    setSelectedCategories(currentCategories)
    setShowAssignModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await usersAPI.update(editingUser._id, formData)
      toast.success('User updated successfully')
      setShowEditModal(false)
      setEditingUser(null)
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user')
    }
  }

  const handleSaveCategories = async () => {
    try {
      console.log('=== SAVING CATEGORIES ===')
      console.log('Selected categories (IDs):', selectedCategories)
      console.log('Editing user:', editingUser)
      console.log('User ID:', editingUser._id)
      
      console.log('Sending categories:', JSON.stringify(selectedCategories, null, 2))
      
      const result = await usersAPI.updateCategories(editingUser._id, selectedCategories)
      
      console.log('API response:', JSON.stringify(result, null, 2))
      console.log('Updated categories:', result.assigned_categories)
      console.log('=== SAVE COMPLETE ===')
      
      toast.success(`✅ ${selectedCategories.length} categories ${selectedCategories.length === 1 ? 'category' : 'categories'} assigned to ${editingUser?.full_name}`)
      setShowAssignModal(false)
      setEditingUser(null)
      setSelectedCategories([])
      
      // Reload data to show updated categories
      await loadData()
    } catch (error) {
      console.error('=== SAVE FAILED ===')
      console.error('Error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      toast.error(error.response?.data?.message || 'Failed to assign categories. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await usersAPI.delete(id)
      toast.success('User deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const toggleCategory = (catId) => {
    console.log('Toggle category:', catId)
    setSelectedCategories((prev) => {
      const newSelection = prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
      console.log('Previous selection:', prev)
      console.log('New selection:', newSelection)
      return newSelection
    })
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />
      case 'auditor': return <ClipboardCheck className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      auditor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${styles[role] || styles.user}`}>
        {getRoleIcon(role)}
        {role}
      </span>
    )
  }

  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">Manage system users and auditors</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Users</p>
              <p className="text-white text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Auditors</p>
              <p className="text-white text-2xl font-bold">
                {users.filter(u => u.role === 'auditor').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-indigo-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Tag className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Categories Assigned</p>
              <p className="text-white text-2xl font-bold">
                {users.filter(u => u.role === 'auditor' && u.assigned_categories?.length > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="auditor">Auditor</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Mobile</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Categories</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-white font-medium">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{user.email}</td>
                  <td className="px-4 py-3 text-slate-300">{user.mobile}</td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">
                    {user.role === 'auditor' ? (
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {user.assigned_categories?.length > 0 ? (
                          <>
                            {user.assigned_categories.map((cat, i) => (
                              <span 
                                key={i} 
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-md border border-indigo-500/30 font-medium"
                              >
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                                {cat.name || cat}
                              </span>
                            ))}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs italic">No categories assigned</span>
                            <button
                              onClick={() => handleAssignCategories(user)}
                              className="text-emerald-400 hover:text-emerald-300 text-xs underline"
                            >
                              Assign now
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.role === 'auditor' && (
                        <button
                          onClick={() => handleAssignCategories(user)}
                          className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30 transition-all"
                          title="Assign Categories to Auditor"
                        >
                          <ClipboardCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-all"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Mobile</label>
            <input
              type="text"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="user">User</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {/* Show Assigned Categories for Auditors */}
          {editingUser?.role === 'auditor' && editingUser?.assigned_categories?.length > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-indigo-400" />
                <label className="block text-sm text-indigo-400 font-semibold">Assigned Categories</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingUser.assigned_categories.map((cat, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 text-sm rounded-md border border-indigo-500/30 font-medium"
                  >
                    <Package className="h-3.5 w-3.5" />
                    {cat.name || cat}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Use "Assign Categories" button to modify
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              Update
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Categories Modal */}
      <Modal show={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Categories to Auditor">
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">Auditor:</span>
              </div>
              <span className="text-white font-semibold">{editingUser?.full_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-400" />
                <span className="text-sm text-slate-400">Selected:</span>
              </div>
              <span className="text-indigo-400 font-bold text-lg">
                {selectedCategories.length} / {categories.length}
              </span>
            </div>
          </div>
          
          {categories.length === 0 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <p className="text-yellow-400 text-sm mb-2">⚠️ No categories available!</p>
              <p className="text-slate-400 text-xs">
                Please create categories first from Inventory → Categories
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-slate-400 text-sm mb-3">
                  Select which categories this auditor can verify:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {categories.map((cat) => (
                    <label
                      key={cat._id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCategories.includes(cat._id)
                          ? 'bg-indigo-500/20 border-2 border-indigo-500/50 hover:bg-indigo-500/30'
                          : 'bg-slate-800 border-2 border-transparent hover:bg-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat._id)}
                        onChange={() => toggleCategory(cat._id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Package className={`h-4 w-4 ${selectedCategories.includes(cat._id) ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className={`font-medium ${selectedCategories.includes(cat._id) ? 'text-white' : 'text-slate-300'}`}>
                          {cat.name}
                        </span>
                      </div>
                      {selectedCategories.includes(cat._id) && (
                        <span className="text-xs text-indigo-400 font-semibold">✓ Selected</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategories}
                  disabled={selectedCategories.length === 0}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  Save ({selectedCategories.length})
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
