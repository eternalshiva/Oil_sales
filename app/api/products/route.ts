import { NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Fallback data store for when Supabase is not available
const DATA_DIR = path.join(process.cwd(), 'data')
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json')

const defaultProducts = [
  { id: 1, name: "Sunflower Oil 30kg Can", conversion_factor: 30, unit_type: "kg", category: "Sunflower", is_active: true },
  { id: 2, name: "Sunflower Oil 15kg Can", conversion_factor: 15, unit_type: "kg", category: "Sunflower", is_active: true },
  { id: 3, name: "Sunflower Oil 15L Tin", conversion_factor: 13.6, unit_type: "L", category: "Sunflower", is_active: true },
  { id: 4, name: "Sunflower Gold 5L Box", conversion_factor: 4.5, unit_type: "L", category: "Sunflower", is_active: true },
  { id: 5, name: "Sunflower Gold 1L Box", conversion_factor: 0.9, unit_type: "L", category: "Sunflower", is_active: true },
  { id: 6, name: "Sunflower Gold 500ml Box", conversion_factor: 0.45, unit_type: "ml", category: "Sunflower", is_active: true },
  { id: 7, name: "Sunflower Gold 200ml Box", conversion_factor: 0.18, unit_type: "ml", category: "Sunflower", is_active: true },
  { id: 8, name: "Sunflower 850ml", conversion_factor: 0.85, unit_type: "ml", category: "Sunflower", is_active: true },
  { id: 9, name: "Sunflower 425ml", conversion_factor: 0.425, unit_type: "ml", category: "Sunflower", is_active: true },
  { id: 10, name: "Palm Oil 30kg Can", conversion_factor: 30, unit_type: "kg", category: "Palm", is_active: true },
  { id: 11, name: "Palm Oil 15kg Can", conversion_factor: 15, unit_type: "kg", category: "Palm", is_active: true },
  { id: 12, name: "Palm Oil 15L Tin", conversion_factor: 13.6, unit_type: "L", category: "Palm", is_active: true },
  { id: 13, name: "Palmstar 1L Box", conversion_factor: 0.9, unit_type: "L", category: "Palm", is_active: true },
  { id: 14, name: "Palmstar 500ml Box", conversion_factor: 0.45, unit_type: "ml", category: "Palm", is_active: true },
  { id: 15, name: "Palmstar 850ml", conversion_factor: 0.85, unit_type: "ml", category: "Palm", is_active: true },
  { id: 16, name: "Palmstar 425ml", conversion_factor: 0.425, unit_type: "ml", category: "Palm", is_active: true },
  { id: 17, name: "Lamp Oil 15L Tin", conversion_factor: 13.6, unit_type: "L", category: "Lamp", is_active: true },
  { id: 18, name: "Lamp Oil 5L Bottle", conversion_factor: 4.5, unit_type: "L", category: "Lamp", is_active: true },
  { id: 19, name: "Lamp Oil 1L Pouch", conversion_factor: 0.9, unit_type: "L", category: "Lamp", is_active: true },
  { id: 20, name: "Lamp Oil 500ml Pouch", conversion_factor: 0.45, unit_type: "ml", category: "Lamp", is_active: true }
]

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

async function getProducts() {
  await ensureDataDir()
  
  if (!existsSync(PRODUCTS_FILE)) {
    await writeFile(PRODUCTS_FILE, JSON.stringify(defaultProducts, null, 2))
    return defaultProducts
  }
  
  const data = await readFile(PRODUCTS_FILE, 'utf-8')
  return JSON.parse(data)
}

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json(products.filter(p => p.is_active))
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}