import './src/db.js'
import { StockInventory } from './src/models/StockInventory.js'
import { Category } from './src/models/Category.js'
import mongoose from 'mongoose'

async function checkStock() {
  try {
    console.log('Connecting to MongoDB...')
    
    // Wait for connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve()
      } else {
        mongoose.connection.once('open', resolve)
      }
    })
    
    console.log('Connected! Checking stock items...\n')
    
    const stocks = await StockInventory.find().populate('category')
    console.log(`Total stock items: ${stocks.length}\n`)
    
    if (stocks.length === 0) {
      console.log('No stock items found in database!')
    } else {
      stocks.forEach(s => {
        console.log(`- ${s.product_name}`)
        console.log(`  Quantity: ${s.quantity}`)
        console.log(`  Category: ${s.category?.category_name || 'None'}`)
        console.log(`  Category ID: ${s.category?._id || 'None'}`)
        console.log(`  Created: ${s.created_at || s.createdAt}`)
        console.log('')
      })
    }
    
    console.log('\nCategories in database:')
    const categories = await Category.find()
    console.log(`Total categories: ${categories.length}\n`)
    categories.forEach(c => {
      console.log(`- ${c.category_name} (ID: ${c._id})`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

checkStock()
