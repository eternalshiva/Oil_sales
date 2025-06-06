import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const STOCK_FILE = path.join(DATA_DIR, 'stock-log.json')

// Initialize with demo stock data
const initializeStockData = () => {
  const stockData = []
  for (let i = 1; i <= 20; i++) {
    stockData.push({
      id: i,
      product_id: i,
      date: new Date().toISOString().split('T')[0],
      opening: Math.floor(Math.random() * 30) + 5,
      receipts: 0,
      sales_office: 0,
      dispatch: 0,
      vehicleSales: {} // { vehicleNumber: quantity }
    })
  }
  return stockData
}

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

async function getStockData(date: string) {
  await ensureDataDir()
  
  if (!existsSync(STOCK_FILE)) {
    const initialData = { [date]: initializeStockData() }
    await writeFile(STOCK_FILE, JSON.stringify(initialData, null, 2))
    return initialData[date] || []
  }
  
  const data = await readFile(STOCK_FILE, 'utf-8')
  const allData = JSON.parse(data)
  
  if (!allData[date]) {
    allData[date] = initializeStockData()
    await writeFile(STOCK_FILE, JSON.stringify(allData, null, 2))
  }
  
  return allData[date] || []
}

async function updateStockData(date: string, stockData: any[]) {
  await ensureDataDir()
  
  let allData = {}
  if (existsSync(STOCK_FILE)) {
    const fileData = await readFile(STOCK_FILE, 'utf-8')
    allData = JSON.parse(fileData)
  }
  
  allData[date] = stockData
  await writeFile(STOCK_FILE, JSON.stringify(allData, null, 2))
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    const stockData = await getStockData(date)
    return NextResponse.json(stockData)
  } catch (error) {
    console.error('Error fetching stock log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, date, field, value } = body
    
    const stockData = await getStockData(date)
    
    // Find or create stock entry for this product
    let stockEntry = stockData.find(item => item.product_id === product_id)
    
    if (!stockEntry) {
      stockEntry = {
        id: product_id,
        product_id,
        date,
        opening: Math.floor(Math.random() * 30) + 5,
        receipts: 0,
        sales_office: 0,
        dispatch: 0,
        vehicleSales: {}
      }
      stockData.push(stockEntry)
    }
    
    // Update the field
    stockEntry[field] = value
    stockEntry.updated_at = new Date().toISOString()
    
    await updateStockData(date, stockData)
    
    return NextResponse.json(stockEntry)
  } catch (error) {
    console.error('Error updating stock log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}