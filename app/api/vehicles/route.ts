import { NextResponse } from 'next/server'

const defaultVehicles = [
  { id: 1, number: '2259', is_active: true },
  { id: 2, number: '5149', is_active: true },
  { id: 3, number: '3083', is_active: true },
  { id: 4, number: '4080', is_active: true },
  { id: 5, number: '0456', is_active: true },
  { id: 6, number: '4567', is_active: true }
]

export async function GET() {
  try {
    return NextResponse.json(defaultVehicles.filter(v => v.is_active))
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}