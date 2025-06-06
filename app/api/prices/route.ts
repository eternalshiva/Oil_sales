import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  
  try {
    // Get current prices for all products
    const { data: prices, error } = await supabase
      .from('price_history')
      .select(`
        *,
        products!inner(id, name, category, unit_type)
      `)
      .eq('is_current', true)
      .order('products(category)', { ascending: true })
      .order('products(name)', { ascending: true })

    if (error) {
      console.error('Error fetching prices:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data
    const processedPrices = prices.map(price => ({
      id: price.id,
      productId: price.product_id,
      product: price.products,
      baseRate: price.base_rate,
      conversionFactor: price.conversion_factor,
      effectiveDate: price.effective_date,
      unitPrice: price.base_rate * price.conversion_factor
    }))

    return NextResponse.json(processedPrices)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { product_id, base_rate, conversion_factor } = body

    // Mark existing prices as not current
    const { error: updateError } = await supabase
      .from('price_history')
      .update({ is_current: false })
      .eq('product_id', product_id)
      .eq('is_current', true)

    if (updateError) {
      console.error('Error updating existing prices:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Insert new current price
    const { data, error } = await supabase
      .from('price_history')
      .insert({
        product_id,
        base_rate,
        conversion_factor,
        is_current: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating price:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}