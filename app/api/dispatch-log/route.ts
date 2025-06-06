import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  try {
    // Get dispatch log entries for the specified date
    const { data: dispatchLog, error: dispatchError } = await supabase
      .from('dispatch_log')
      .select(`
        *,
        routes!inner(name),
        vehicles!inner(number),
        dispatch_products(
          quantity,
          products!inner(id, name, category)
        )
      `)
      .eq('date', date)
      .order('created_at', { ascending: false })

    if (dispatchError) {
      console.error('Error fetching dispatch log:', dispatchError)
      return NextResponse.json({ error: dispatchError.message }, { status: 500 })
    }

    // Transform the data to match the expected format
    const processedDispatchLog = dispatchLog.map(entry => ({
      id: entry.id,
      date: entry.date,
      line: entry.routes.name,
      vehicle: entry.vehicles.number,
      created_at: entry.created_at,
      products: entry.dispatch_products.map(dp => ({
        productId: dp.products.id,
        quantity: dp.quantity,
        name: dp.products.name,
        category: dp.products.category
      }))
    }))

    return NextResponse.json(processedDispatchLog)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { route_name, vehicle_number, products, date } = body

    // Get route ID
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('id')
      .eq('name', route_name)
      .single()

    if (routeError) {
      console.error('Error fetching route:', routeError)
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    // Get vehicle ID
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('number', vehicle_number)
      .single()

    if (vehicleError) {
      console.error('Error fetching vehicle:', vehicleError)
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Create dispatch entry
    const { data: dispatchEntry, error: dispatchError } = await supabase
      .from('dispatch_log')
      .insert({
        date: date || new Date().toISOString().split('T')[0],
        route_id: route.id,
        vehicle_id: vehicle.id
      })
      .select()
      .single()

    if (dispatchError) {
      console.error('Error creating dispatch entry:', dispatchError)
      return NextResponse.json({ error: dispatchError.message }, { status: 500 })
    }

    // Create dispatch products
    const dispatchProducts = products
      .filter(p => p.quantity > 0)
      .map(p => ({
        dispatch_id: dispatchEntry.id,
        product_id: p.productId,
        quantity: p.quantity
      }))

    if (dispatchProducts.length > 0) {
      const { error: productsError } = await supabase
        .from('dispatch_products')
        .insert(dispatchProducts)

      if (productsError) {
        console.error('Error creating dispatch products:', productsError)
        return NextResponse.json({ error: productsError.message }, { status: 500 })
      }

      // Update stock log dispatch quantities
      for (const product of products.filter(p => p.quantity > 0)) {
        const currentDate = date || new Date().toISOString().split('T')[0]
        
        // Get current stock log entry
        const { data: stockEntry, error: stockError } = await supabase
          .from('stock_log')
          .select('*')
          .eq('product_id', product.productId)
          .eq('date', currentDate)
          .single()

        if (stockEntry) {
          // Update dispatch quantity
          const { error: updateError } = await supabase
            .from('stock_log')
            .update({ 
              dispatch: (stockEntry.dispatch || 0) + product.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', stockEntry.id)

          if (updateError) {
            console.error('Error updating stock dispatch:', updateError)
          }
        }
      }
    }

    return NextResponse.json(dispatchEntry)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}