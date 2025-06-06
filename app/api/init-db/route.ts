import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  
  try {
    // Check if products table exists by trying to fetch products
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('count(*)')
      .limit(1)

    if (checkError) {
      return NextResponse.json({ 
        error: 'Database not initialized. Please run the SQL schema in Supabase first.',
        details: checkError.message 
      }, { status: 500 })
    }

    // If products exist, database is already initialized
    if (existingProducts && existingProducts.length > 0) {
      return NextResponse.json({ 
        message: 'Database already initialized',
        productCount: existingProducts[0]?.count || 0
      })
    }

    // Initialize with basic data (this assumes tables exist)
    const products = [
      { name: "Sunflower Oil 30kg Can", conversion_factor: 30, unit_type: "kg", category: "Sunflower" },
      { name: "Sunflower Oil 15kg Can", conversion_factor: 15, unit_type: "kg", category: "Sunflower" },
      { name: "Sunflower Oil 15L Tin", conversion_factor: 13.6, unit_type: "L", category: "Sunflower" },
      { name: "Sunflower Gold 5L Box", conversion_factor: 4.5, unit_type: "L", category: "Sunflower" },
      { name: "Sunflower Gold 1L Box", conversion_factor: 0.9, unit_type: "L", category: "Sunflower" },
      { name: "Sunflower Gold 500ml Box", conversion_factor: 0.45, unit_type: "ml", category: "Sunflower" },
      { name: "Sunflower Gold 200ml Box", conversion_factor: 0.18, unit_type: "ml", category: "Sunflower" },
      { name: "Sunflower 850ml", conversion_factor: 0.85, unit_type: "ml", category: "Sunflower" },
      { name: "Sunflower 425ml", conversion_factor: 0.425, unit_type: "ml", category: "Sunflower" },
      { name: "Palm Oil 30kg Can", conversion_factor: 30, unit_type: "kg", category: "Palm" },
      { name: "Palm Oil 15kg Can", conversion_factor: 15, unit_type: "kg", category: "Palm" },
      { name: "Palm Oil 15L Tin", conversion_factor: 13.6, unit_type: "L", category: "Palm" },
      { name: "Palmstar 1L Box", conversion_factor: 0.9, unit_type: "L", category: "Palm" },
      { name: "Palmstar 500ml Box", conversion_factor: 0.45, unit_type: "ml", category: "Palm" },
      { name: "Palmstar 850ml", conversion_factor: 0.85, unit_type: "ml", category: "Palm" },
      { name: "Palmstar 425ml", conversion_factor: 0.425, unit_type: "ml", category: "Palm" },
      { name: "Lamp Oil 15L Tin", conversion_factor: 13.6, unit_type: "L", category: "Lamp" },
      { name: "Lamp Oil 5L Bottle", conversion_factor: 4.5, unit_type: "L", category: "Lamp" },
      { name: "Lamp Oil 1L Pouch", conversion_factor: 0.9, unit_type: "L", category: "Lamp" },
      { name: "Lamp Oil 500ml Pouch", conversion_factor: 0.45, unit_type: "ml", category: "Lamp" }
    ]

    // Insert products
    const { data: insertedProducts, error: productError } = await supabase
      .from('products')
      .insert(products)
      .select()

    if (productError) {
      return NextResponse.json({ 
        error: 'Failed to insert products',
        details: productError.message 
      }, { status: 500 })
    }

    // Insert routes
    const routes = [
      { name: 'Uthukottai' },
      { name: 'Arakonam' },
      { name: 'Acharapakkam' },
      { name: 'Kalpakkam' },
      { name: 'Poonamallee' },
      { name: 'Ponneri' },
      { name: 'ECR' }
    ]

    const { error: routeError } = await supabase
      .from('routes')
      .insert(routes)

    if (routeError) {
      console.warn('Route insertion error (might already exist):', routeError.message)
    }

    // Insert vehicles
    const vehicles = [
      { number: '2259' },
      { number: '5149' },
      { number: '3083' },
      { number: '4080' },
      { number: '0456' },
      { number: '4567' }
    ]

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .insert(vehicles)

    if (vehicleError) {
      console.warn('Vehicle insertion error (might already exist):', vehicleError.message)
    }

    return NextResponse.json({ 
      message: 'Database initialized successfully',
      productCount: insertedProducts?.length || 0
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json({ 
      error: 'Failed to initialize database',
      details: error.message 
    }, { status: 500 })
  }
}