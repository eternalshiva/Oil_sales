import { NextResponse } from 'next/server'

const defaultRoutes = [
  { id: 1, name: 'Uthukottai', is_active: true },
  { id: 2, name: 'Arakonam', is_active: true },
  { id: 3, name: 'Acharapakkam', is_active: true },
  { id: 4, name: 'Kalpakkam', is_active: true },
  { id: 5, name: 'Poonamallee', is_active: true },
  { id: 6, name: 'Ponneri', is_active: true },
  { id: 7, name: 'ECR', is_active: true }
]

export async function GET() {
  try {
    return NextResponse.json(defaultRoutes.filter(r => r.is_active))
  } catch (error) {
    console.error('Error fetching routes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}