import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const PRICES_FILE = path.join(DATA_DIR, 'prices.json')

// Default pricing data
const getDefaultPrices = () => {
  const prices = []
  for (let i = 1; i <= 20; i++) {
    let baseRate = 130 // Sunflower default
    let category = 'Sunflower'
    
    if (i >= 10 && i <= 16) {
      baseRate = 95 // Palm
      category = 'Palm'
    } else if (i >= 17 && i <= 20) {
      baseRate = 90 // Lamp
      category = 'Lamp'
    }
    
    const conversionFactors = [30, 15, 13.6, 4.5, 0.9, 0.45, 0.18, 0.85, 0.425]
    const conversionFactor = conversionFactors[(i - 1) % conversionFactors.length] || 1
    
    prices.push({
      id: i,
      productId: i,
      product: {
        id: i,
        name: `Product ${i}`,
        category,
        unit_type: i <= 2 || i === 10 || i === 11 ? 'kg' : 'L'
      },
      baseRate,
      conversionFactor,
      effectiveDate: new Date().toISOString(),
      unitPrice: baseRate * conversionFactor
    })
  }
  return prices
}

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

async function getPrices() {
  await ensureDataDir()
  
  if (!existsSync(PRICES_FILE)) {
    const defaultPrices = getDefaultPrices()
    await writeFile(PRICES_FILE, JSON.stringify(defaultPrices, null, 2))
    return defaultPrices
  }
  
  const data = await readFile(PRICES_FILE, 'utf-8')
  return JSON.parse(data)
}

async function updatePrice(productId: number, baseRate: number, conversionFactor: number) {
  const prices = await getPrices()
  
  const priceIndex = prices.findIndex(p => p.productId === productId)
  if (priceIndex >= 0) {
    prices[priceIndex].baseRate = baseRate
    prices[priceIndex].conversionFactor = conversionFactor
    prices[priceIndex].unitPrice = baseRate * conversionFactor
    prices[priceIndex].effectiveDate = new Date().toISOString()
  } else {
    // Add new price entry
    prices.push({
      id: productId,
      productId,
      product: {
        id: productId,
        name: `Product ${productId}`,
        category: 'Unknown',
        unit_type: 'kg'
      },
      baseRate,
      conversionFactor,
      effectiveDate: new Date().toISOString(),
      unitPrice: baseRate * conversionFactor
    })
  }
  
  await writeFile(PRICES_FILE, JSON.stringify(prices, null, 2))
  return prices[priceIndex] || prices[prices.length - 1]
}

export async function GET() {
  try {
    const prices = await getPrices()
    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching prices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, base_rate, conversion_factor } = body

    const updatedPrice = await updatePrice(product_id, base_rate, conversion_factor)
    
    return NextResponse.json(updatedPrice)
  } catch (error) {
    console.error('Error updating price:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}