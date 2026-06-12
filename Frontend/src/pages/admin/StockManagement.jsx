import { useState, useEffect, useCallback } from 'react'
import { stockAPI, categoriesAPI } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  ChevronDown,
  Loader2,
} from 'lucide-react'
// Modal component outside to prevent re-renders
const Modal = ({ show, onClose, title, children }) => (
  <AnimatePresence>
    {show && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)
export default function StockManagement() {
  const [stock, setStock] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    qty: '',
    min_qty: '',
    unit: 'Pcs',
    description: '',
  })

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
      setStock(stockData.items || stockData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStock = async (e) => {
    e.preventDefault()
    try {
      await stockAPI.create({
        product_name: formData.name,
        category_id: formData.category,
        quantity: parseInt(formData.qty),
        unit: formData.unit,
        notes: formData.description,
      })
      toast.success('Stock item added successfully')
      setShowAddModal(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add stock')
    }
  }

  const handleEditStock = async (e) => {
    e.preventDefault()
    try {
      await stockAPI.update(editingItem._id, {
        product_name: formData.name,
        category_id: formData.category,
        quantity: parseInt(formData.qty),
        unit: formData.unit,
        notes: formData.description,
      })
      toast.success('Stock item updated successfully')
      setShowEditModal(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock')
    }
  }

  const handleDeleteStock = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await stockAPI.delete(id)
      toast.success('Stock item deleted')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete stock')
    }
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      category: item.category?._id || item.category || '',
      qty: item.qty?.toString() || '',
      min_qty: item.min_qty?.toString() || '10',
      unit: item.unit || 'Pcs',
      description: item.description || '',
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      qty: '',
      min_qty: '',
      unit: 'Pcs',
      description: '',
    })
    setEditingItem(null)
  }

  // Optimized input handler to prevent focus loss
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
  }, [])

  const handleCategoryFilterChange = useCallback((value) => {
    setSelectedCategory(value)
  }, [])

  const filteredStock = stock.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || 
      (item.category?._id || item.category) === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Management</h1>
          <p className="text-slate-400">Manage your inventory items</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all"
        >
          <Plus className="h-5 w-5" />
          Add Stock
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search stock..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-8 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[180px]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStock.map((item) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-slate-900/50 border rounded-xl p-4 ${
              item.qty <= (item.min_qty || 10)
                ? 'border-red-500/50'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{item.name}</h3>
                  <p className="text-sm text-slate-400">{item.category?.name || 'Uncategorized'}</p>
                </div>
              </div>
              {item.qty <= (item.min_qty || 10) && (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              )}
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <div>
                <p className="text-slate-400">Quantity</p>
                <p className={`text-xl font-bold ${
                  item.qty <= (item.min_qty || 10) ? 'text-red-400' : 'text-white'
                }`}>
                  {item.qty} <span className="text-sm font-normal text-slate-500">{item.unit}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Min Stock</p>
                <p className="text-white">{item.min_qty || 10}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(item)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteStock(item._id)}
                className="flex items-center justify-center px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredStock.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No stock items found</p>
          <p className="text-sm">Add your first item to get started</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal show={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Stock Item">
        <form onSubmit={handleAddStock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Item Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.qty}
                onChange={(e) => handleInputChange('qty', e.target.value)}
                required
                min="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Min Quantity</label>
              <input
                type="number"
                value={formData.min_qty}
                onChange={(e) => handleInputChange('min_qty', e.target.value)}
                required
                min="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {['Pcs', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg transition-all"
          >
            Add Item
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Stock Item">
        <form onSubmit={handleEditStock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Item Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.qty}
                onChange={(e) => handleInputChange('qty', e.target.value)}
                required
                min="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Min Quantity</label>
              <input
                type="number"
                value={formData.min_qty}
                onChange={(e) => handleInputChange('min_qty', e.target.value)}
                required
                min="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {['Pcs', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg transition-all"
          >
            Update Item
          </button>
        </form>
      </Modal>
    </div>
  )
}
