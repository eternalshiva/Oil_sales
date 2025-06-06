import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const DISPATCH_FILE = path.join(DATA_DIR, 'dispatch-log.json')

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

async function getDispatchData(date: string) {
  await ensureDataDir()
  
  if (!existsSync(DISPATCH_FILE)) {
    const initialData = { [date]: [] }
    await writeFile(DISPATCH_FILE, JSON.stringify(initialData, null, 2))
    return []
  }
  
  const data = await readFile(DISPATCH_FILE, 'utf-8')
  const allData = JSON.parse(data)
  
  return allData[date] || []
}

async function addDispatchEntry(date: string, entry: any) {
  await ensureDataDir()
  
  let allData = {}
  if (existsSync(DISPATCH_FILE)) {
    const fileData = await readFile(DISPATCH_FILE, 'utf-8')
    allData = JSON.parse(fileData)
  }
  
  if (!allData[date]) {
    allData[date] = []
  }
  
  allData[date].push(entry)
  await writeFile(DISPATCH_FILE, JSON.stringify(allData, null, 2))
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    const dispatchData = await getDispatchData(date)
    
    // Transform to match expected format
    const processedData = dispatchData.map(entry => ({
      id: entry.id,
      date: entry.date,
      line: entry.line,
      vehicle: entry.vehicle,
      created_at: entry.created_at,
      products: entry.products.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        name: p.name || `Product ${p.productId}`,
        category: p.category || 'Unknown'
      }))
    }))
    
    return NextResponse.json(processedData)
  } catch (error) {
    console.error('Error fetching dispatch log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { route_name, vehicle_number, products, date } = body
    
    const currentDate = date || new Date().toISOString().split('T')[0]
    
    const newEntry = {
      id: Date.now(),
      date: currentDate,
      line: route_name,
      vehicle: vehicle_number,
      created_at: new Date().toISOString(),
      products: products.filter(p => p.quantity > 0).map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        name: `Product ${p.productId}`,
        category: 'Unknown'
      }))
    }
    
    await addDispatchEntry(currentDate, newEntry)
    
    // Also update stock dispatch quantities
    // This would normally update the stock_log table
    
    return NextResponse.json(newEntry)
  } catch (error) {
    console.error('Error creating dispatch entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}