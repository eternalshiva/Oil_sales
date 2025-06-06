"use client"

import { createContext, useContext, ReactNode } from "react"
import useSWR from 'swr'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
})

// Product types with their conversion factors (for reference)
export const products = [
  { id: 1, name: "Sunflower Oil 30kg Can", conversionFactor: 30, unitType: "kg", category: "Sunflower" },
  { id: 2, name: "Sunflower Oil 15kg Can", conversionFactor: 15, unitType: "kg", category: "Sunflower" },
  { id: 3, name: "Sunflower Oil 15L Tin", conversionFactor: 13.6, unitType: "L", category: "Sunflower" },
  { id: 4, name: "Sunflower Gold 5L Box", conversionFactor: 4.5, unitType: "L", category: "Sunflower" },
  { id: 5, name: "Sunflower Gold 1L Box", conversionFactor: 0.9, unitType: "L", category: "Sunflower" },
  { id: 6, name: "Sunflower Gold 500ml Box", conversionFactor: 0.45, unitType: "ml", category: "Sunflower" },
  { id: 7, name: "Sunflower Gold 200ml Box", conversionFactor: 0.18, unitType: "ml", category: "Sunflower" },
  { id: 8, name: "Sunflower 850ml", conversionFactor: 0.85, unitType: "ml", category: "Sunflower" },
  { id: 9, name: "Sunflower 425ml", conversionFactor: 0.425, unitType: "ml", category: "Sunflower" },
  { id: 10, name: "Palm Oil 30kg Can", conversionFactor: 30, unitType: "kg", category: "Palm" },
  { id: 11, name: "Palm Oil 15kg Can", conversionFactor: 15, unitType: "kg", category: "Palm" },
  { id: 12, name: "Palm Oil 15L Tin", conversionFactor: 13.6, unitType: "L", category: "Palm" },
  { id: 13, name: "Palmstar 1L Box", conversionFactor: 0.9, unitType: "L", category: "Palm" },
  { id: 14, name: "Palmstar 500ml Box", conversionFactor: 0.45, unitType: "ml", category: "Palm" },
  { id: 15, name: "Palmstar 850ml", conversionFactor: 0.85, unitType: "ml", category: "Palm" },
  { id: 16, name: "Palmstar 425ml", conversionFactor: 0.425, unitType: "ml", category: "Palm" },
  { id: 17, name: "Lamp Oil 15L Tin", conversionFactor: 13.6, unitType: "L", category: "Lamp" },
  { id: 18, name: "Lamp Oil 5L Bottle", conversionFactor: 4.5, unitType: "L", category: "Lamp" },
  { id: 19, name: "Lamp Oil 1L Pouch", conversionFactor: 0.9, unitType: "L", category: "Lamp" },
  { id: 20, name: "Lamp Oil 500ml Pouch", conversionFactor: 0.45, unitType: "ml", category: "Lamp" },
]

// Routes/Lines
export const routes = ["Uthukottai", "Arakonam", "Acharapakkam", "Kalpakkam", "Poonamallee", "Ponneri", "ECR"]

// Vehicle numbers
export const vehicles = ["2259", "5149", "3083", "4080", "0456", "4567"]

// Context type
type OilInventoryContextType = {
  // Data from API
  stockData: any[]
  priceData: any[]
  dispatchData: any[]
  isLoading: boolean
  error: any

  // Functions to update data
  updateStockSalesOffice: (productId: number, sales: number) => Promise<void>
  updateStockSalesVehicle: (productId: number, vehicle: string, sales: number) => Promise<void>
  updateStockReceipts: (productId: number, receipts: number) => Promise<void>
  updatePrice: (productId: number, baseRate: number, conversionFactor: number) => Promise<void>
  addDispatchEntry: (
    line: string,
    vehicle: string,
    productQuantities: { productId: number; quantity: number }[],
  ) => Promise<void>
  
  // Helper functions
  getDispatchedVehicles: () => string[]
  getVehicleDispatchData: () => any
  getCurrentTimestamp: () => string
  getFormattedDate: (date?: Date) => string
  
  // Mutate functions to refresh data
  mutateStockData: () => void
  mutatePriceData: () => void
  mutateDispatchData: () => void
}

// Create context
const OilInventoryContext = createContext<OilInventoryContextType | undefined>(undefined)

// Provider component
export function OilInventoryProvider({ children }: { children: ReactNode }) {
  const currentDate = new Date().toISOString().split('T')[0]

  // Fetch data using SWR
  const { data: stockData = [], error: stockError, mutate: mutateStockData } = useSWR(
    `/api/stock-log?date=${currentDate}`,
    fetcher
  )
  
  const { data: priceData = [], error: priceError, mutate: mutatePriceData } = useSWR(
    '/api/prices',
    fetcher
  )
  
  const { data: dispatchData = [], error: dispatchError, mutate: mutateDispatchData } = useSWR(
    `/api/dispatch-log?date=${currentDate}`,
    fetcher
  )

  const isLoading = !stockData && !priceData && !dispatchData
  const error = stockError || priceError || dispatchError

  // Update stock sales for office
  const updateStockSalesOffice = async (productId: number, sales: number) => {
    try {
      const response = await fetch('/api/stock-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          date: currentDate,
          field: 'sales_office',
          value: sales
        })
      })
      
      if (!response.ok) throw new Error('Failed to update office sales')
      mutateStockData()
    } catch (error) {
      console.error('Error updating office sales:', error)
      throw error
    }
  }

  // Update stock sales for a specific vehicle
  const updateStockSalesVehicle = async (productId: number, vehicle: string, sales: number) => {
    try {
      // Find the stock log entry for this product and date
      const stockEntry = stockData.find(item => item.product_id === productId)
      if (!stockEntry) {
        throw new Error('Stock entry not found')
      }

      const response = await fetch('/api/vehicle-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_log_id: stockEntry.id,
          vehicle_number: vehicle,
          quantity: sales
        })
      })
      
      if (!response.ok) throw new Error('Failed to update vehicle sales')
      mutateStockData()
    } catch (error) {
      console.error('Error updating vehicle sales:', error)
      throw error
    }
  }

  // Update stock receipts
  const updateStockReceipts = async (productId: number, receipts: number) => {
    try {
      const response = await fetch('/api/stock-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          date: currentDate,
          field: 'receipts',
          value: receipts
        })
      })
      
      if (!response.ok) throw new Error('Failed to update receipts')
      mutateStockData()
    } catch (error) {
      console.error('Error updating receipts:', error)
      throw error
    }
  }

  // Update price
  const updatePrice = async (productId: number, baseRate: number, conversionFactor: number) => {
    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          base_rate: baseRate,
          conversion_factor: conversionFactor
        })
      })
      
      if (!response.ok) throw new Error('Failed to update price')
      mutatePriceData()
    } catch (error) {
      console.error('Error updating price:', error)
      throw error
    }
  }

  // Add dispatch entry
  const addDispatchEntry = async (
    line: string,
    vehicle: string,
    productQuantities: { productId: number; quantity: number }[],
  ) => {
    try {
      const validProductQuantities = productQuantities.filter((pq) => pq.quantity > 0)
      
      if (validProductQuantities.length === 0) return

      const response = await fetch('/api/dispatch-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_name: line,
          vehicle_number: vehicle,
          products: validProductQuantities,
          date: currentDate
        })
      })
      
      if (!response.ok) throw new Error('Failed to add dispatch entry')
      
      // Refresh both dispatch and stock data
      mutateDispatchData()
      mutateStockData()
    } catch (error) {
      console.error('Error adding dispatch entry:', error)
      throw error
    }
  }

  // Get list of vehicles that have been dispatched today
  const getDispatchedVehicles = () => {
    return [...new Set(dispatchData.map((entry: any) => entry.vehicle))]
  }

  // Get vehicle dispatch data for the grid view
  const getVehicleDispatchData = () => {
    const dispatchedVehicles = [...new Set(dispatchData.map((entry: any) => entry.vehicle))].sort()

    if (dispatchedVehicles.length === 0) return { vehicles: [], productRows: [], vehicleTotals: {} }

    // Get all products that have been dispatched
    const dispatchedProductIds = new Set()
    dispatchData.forEach((entry: any) => {
      entry.products.forEach((p: any) => dispatchedProductIds.add(p.productId))
    })

    // Create product rows with quantities for each vehicle
    const productRows = Array.from(dispatchedProductIds)
      .map((productId) => {
        const product = products.find((p) => p.id === productId)
        if (!product) return null

        const vehicleQuantities = {}
        let rowTotal = 0

        dispatchedVehicles.forEach((vehicle) => {
          const quantity = dispatchData
            .filter((entry: any) => entry.vehicle === vehicle)
            .reduce((sum: number, entry: any) => {
              const productEntry = entry.products.find((p: any) => p.productId === productId)
              return sum + (productEntry ? productEntry.quantity : 0)
            }, 0)

          vehicleQuantities[vehicle] = quantity
          rowTotal += quantity
        })

        return {
          productId,
          name: product.name,
          vehicleQuantities,
          total: rowTotal,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))

    // Calculate totals for each vehicle
    const vehicleTotals = {}
    dispatchedVehicles.forEach((vehicle) => {
      vehicleTotals[vehicle] = productRows.reduce((sum, row) => sum + (row.vehicleQuantities[vehicle] || 0), 0)
    })

    // Calculate grand total
    const grandTotal = Object.values(vehicleTotals).reduce((sum: number, total: number) => sum + total, 0)
    vehicleTotals.grand = grandTotal

    return {
      vehicles: dispatchedVehicles,
      productRows,
      vehicleTotals,
    }
  }

  // Get current timestamp in HH:MM format
  const getCurrentTimestamp = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  }

  // Get formatted date (DD/MM/YYYY)
  const getFormattedDate = (date = new Date()) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`
  }

  return (
    <OilInventoryContext.Provider
      value={{
        stockData,
        priceData,
        dispatchData,
        isLoading,
        error,
        updateStockSalesOffice,
        updateStockSalesVehicle,
        updateStockReceipts,
        updatePrice,
        addDispatchEntry,
        getDispatchedVehicles,
        getVehicleDispatchData,
        getCurrentTimestamp,
        getFormattedDate,
        mutateStockData,
        mutatePriceData,
        mutateDispatchData,
      }}
    >
      {children}
    </OilInventoryContext.Provider>
  )
}

// Custom hook to use the context
export function useOilInventory() {
  const context = useContext(OilInventoryContext)
  if (context === undefined) {
    throw new Error("useOilInventory must be used within an OilInventoryProvider")
  }
  return context
}
