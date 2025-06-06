import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const STOCK_FILE = path.join(DATA_DIR, 'stock-log.json')

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

async function updateStockVehicleSales(date: string, stockLogId: number, vehicleNumber: string, quantity: number) {
  await ensureDataDir()
  
  if (!existsSync(STOCK_FILE)) {
    return null
  }
  
  const fileData = await readFile(STOCK_FILE, 'utf-8')
  const allData = JSON.parse(fileData)
  
  if (!allData[date]) {
    return null
  }
  
  // Find the stock entry by ID (which matches product_id)
  const stockEntry = allData[date].find(item => item.id === stockLogId)
  if (!stockEntry) {
    return null
  }
  
  // Update vehicle sales
  if (!stockEntry.vehicleSales) {
    stockEntry.vehicleSales = {}
  }
  
  stockEntry.vehicleSales[vehicleNumber] = quantity
  
  // Save back to file
  await writeFile(STOCK_FILE, JSON.stringify(allData, null, 2))
  
  return stockEntry
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stock_log_id, vehicle_number, quantity } = body
    const date = new Date().toISOString().split('T')[0]

    const result = await updateStockVehicleSales(date, stock_log_id, vehicle_number, quantity)
    
    if (!result) {
      return NextResponse.json({ error: 'Stock entry not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      id: `${stock_log_id}-${vehicle_number}`,
      stock_log_id,
      vehicle_number,
      quantity,
      updated: true
    })
  } catch (error) {
    console.error('Error updating vehicle sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}