import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { stock_log_id, vehicle_number, quantity } = body

    // Get vehicle ID from vehicle number
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('number', vehicle_number)
      .single()

    if (vehicleError) {
      console.error('Error fetching vehicle:', vehicleError)
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Check if vehicle sales entry exists
    const { data: existingEntry, error: checkError } = await supabase
      .from('vehicle_sales')
      .select('*')
      .eq('stock_log_id', stock_log_id)
      .eq('vehicle_id', vehicle.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing vehicle sales:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingEntry) {
      // Update existing entry
      const { data, error } = await supabase
        .from('vehicle_sales')
        .update({ quantity })
        .eq('id', existingEntry.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating vehicle sales:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('vehicle_sales')
        .insert({
          stock_log_id,
          vehicle_id: vehicle.id,
          quantity
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating vehicle sales:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}