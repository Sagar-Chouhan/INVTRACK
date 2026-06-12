import { useState, useEffect, useCallback } from 'react'
import { stockAPI, categoriesAPI } from '../../services/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Save,
} from 'lucide-react'

// Modal component defined outside to prevent re-renders
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

export default function StockList() {
  const [stock, setStock] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
    quantity: '',
    unit: 'Pcs',
    location: '',
    source_type: 'purchase',
    supplier_donor_name: '',
    unit_price: '',
    notes: '',
  })

  const units = ['Pcs', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set']

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [stockData, categoriesData] = await Promise.all([
        stockAPI.getAll(),
        categoriesAPI.getAll(),
      ])
      setStock(Array.isArray(stockData) ? stockData : stockData.items || [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await stockAPI.update(editingItem._id, formData)
        toast.success('Stock item updated successfully')
        setShowEditModal(false)
      } else {
        await stockAPI.create(formData)
        toast.success('Stock item added successfully')
        setShowAddModal(false)
      }
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await stockAPI.delete(id)
      toast.success('Stock item deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      product_name: item.product_name || item.name || '',
      category_id: item.category_id?._id || item.category_id || '',
      quantity: item.quantity || '',
      unit: item.unit || 'Pcs',
      location: item.location || '',
      source_type: item.source_type || 'purchase',
      supplier_donor_name: item.supplier_donor_name || '',
      unit_price: item.unit_price || '',
      notes: item.notes || '',
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      product_name: '',
      category_id: '',
      quantity: '',
      unit: 'Pcs',
      location: '',
      source_type: 'purchase',
      supplier_donor_name: '',
      unit_price: '',
      notes: '',
    })
    setEditingItem(null)
  }

  // Optimized input handlers to prevent focus loss
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value)
  }, [])

  const handleCategoryFilterChange = useCallback((value) => {
    setSelectedCategory(value)
  }, [])

  const filteredStock = stock.filter((item) => {
    const name = item.product_name || item.name || ''
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || 
      (item.category_id?._id || item.category_id) === selectedCategory
    return matchesSearch && matchesCategory
  })

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
          <h1 className="text-xl sm:text-2xl font-bold text-white">Stock Management</h1>
          <p className="text-slate-400">Manage your inventory items</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
        >
          <Plus className="h-5 w-5" />
          Add Stock
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryFilterChange(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Stock Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Product</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Category</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Quantity</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Location</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Source</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => (
                <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-slate-400" />
                      </div>
                      <span className="text-white font-medium">{item.product_name || item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {item.category_id?.name || item.category || 'Uncategorized'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${item.quantity <= 5 ? 'text-red-400' : 'text-white'}`}>
                        {item.quantity}
                      </span>
                      <span className="text-slate-400 text-sm">{item.unit}</span>
                      {item.quantity <= 5 && (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{item.location || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.source_type === 'donation' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {item.source_type || 'purchase'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStock.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No stock items found</p>
          </div>
        )}
      </div>

      <Modal show={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add New Stock">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Product Name *</label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => handleInputChange('product_name', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category *</label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Unit Price</label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              placeholder="e.g., Warehouse A"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Source Type</label>
              <select
                value={formData.source_type}
                onChange={(e) => handleInputChange('source_type', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="purchase">Purchase</option>
                <option value="donation">Donation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Supplier/Donor</label>
              <input
                type="text"
                value={formData.supplier_donor_name}
                onChange={(e) => handleInputChange('supplier_donor_name', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              rows="2"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                setShowEditModal(false)
                resetForm()
              }}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {editingItem ? 'Update' : 'Add Stock'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal show={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Stock Item">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Product Name *</label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => handleInputChange('product_name', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category *</label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Unit Price</label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              placeholder="e.g., Warehouse A"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Source Type</label>
              <select
                value={formData.source_type}
                onChange={(e) => handleInputChange('source_type', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="purchase">Purchase</option>
                <option value="donation">Donation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Supplier/Donor</label>
              <input
                type="text"
                value={formData.supplier_donor_name}
                onChange={(e) => handleInputChange('supplier_donor_name', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              rows="2"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                setShowEditModal(false)
                resetForm()
              }}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {editingItem ? 'Update' : 'Add Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
