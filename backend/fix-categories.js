import './src/db.js'
import { Category } from './src/models/Category.js'
import mongoose from 'mongoose'

async function fixCategories() {
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
    
    console.log('Connected! Checking categories...\n')
    
    // Get all documents from categories collection
    const db = mongoose.connection.db
    const categoriesCollection = db.collection('categories')
    const allCategories = await categoriesCollection.find({}).toArray()
    
    console.log(`Found ${allCategories.length} categories in database:\n`)
    
    allCategories.forEach(cat => {
      console.log('Category document:', JSON.stringify(cat, null, 2))
    })
    
    // Check for categories with category_name instead of name
    const oldFormatCategories = allCategories.filter(cat => cat.category_name && !cat.name)
    
    if (oldFormatCategories.length > 0) {
      console.log(`\nFound ${oldFormatCategories.length} categories with old format (category_name field)`)
      console.log('Migrating to new format (name field)...\n')
      
      for (const cat of oldFormatCategories) {
        await categoriesCollection.updateOne(
          { _id: cat._id },
          { 
            $set: { name: cat.category_name },
            $unset: { category_name: '' }
          }
        )
        console.log(`✓ Migrated: ${cat.category_name} → name field`)
      }
      
      console.log('\nMigration complete!')
    } else {
      console.log('\nAll categories are in correct format (using "name" field)')
    }
    
    // Show final state
    const updatedCategories = await Category.find()
    console.log(`\nFinal categories (${updatedCategories.length}):`)
    updatedCategories.forEach(c => {
      console.log(`- ${c.name} (ID: ${c._id})`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

fixCategories()
