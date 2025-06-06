import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  try {
    // Get stock log entries for the specified date
    const { data: stockLog, error: stockError } = await supabase
      .from('stock_log')
      .select('*')
      .eq('date', date)

    if (stockError) {
      console.error('Error fetching stock log:', stockError)
      return NextResponse.json({ error: stockError.message }, { status: 500 })
    }

    // Get vehicle sales for these stock log entries
    const stockLogIds = stockLog.map(item => item.id)
    
    let vehicleSales = []
    if (stockLogIds.length > 0) {
      const { data: vehicleSalesData, error: vehicleError } = await supabase
        .from('vehicle_sales')
        .select(`
          *,
          vehicles!inner(number)
        `)
        .in('stock_log_id', stockLogIds)

      if (vehicleError) {
        console.error('Error fetching vehicle sales:', vehicleError)
      } else {
        vehicleSales = vehicleSalesData || []
      }
    }

    // Combine stock log with vehicle sales
    const processedStockLog = stockLog.map(item => {
      const itemVehicleSales = vehicleSales.filter(vs => vs.stock_log_id === item.id)
      const vehicleSalesMap = {}
      
      itemVehicleSales.forEach(vs => {
        vehicleSalesMap[vs.vehicles.number] = vs.quantity
      })

      return {
        ...item,
        vehicleSales: vehicleSalesMap
      }
    })

    return NextResponse.json(processedStockLog)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { product_id, date, field, value } = body

    // Check if stock log entry exists for this product and date
    const { data: existingEntry, error: checkError } = await supabase
      .from('stock_log')
      .select('*')
      .eq('product_id', product_id)
      .eq('date', date)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing entry:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingEntry) {
      // Update existing entry
      const { data, error } = await supabase
        .from('stock_log')
        .update({ 
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingEntry.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating stock log:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('stock_log')
        .insert({
          product_id,
          date,
          [field]: value,
          opening: field === 'opening' ? value : 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating stock log:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}