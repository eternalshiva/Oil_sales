"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Product types with their conversion factors
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

// Initial stock data
const initialStockData = products.map((product) => ({
  productId: product.id,
  opening: Math.floor(Math.random() * 30) + 5, // Random opening balance between 5-35
  receipts: 0,
  salesOffice: 0,
  dispatch: 0,
  baseRate: product.category === "Sunflower" ? 130 : product.category === "Palm" ? 95 : 90, // Per kg/L rate
  vehicleSales: {}, // Will store sales by vehicle number: { "2259": 5, "3083": 3 }
}))

// Initial price data
const initialPriceData = products.map((product) => ({
  productId: product.id,
  baseRate: product.category === "Sunflower" ? 130 : product.category === "Palm" ? 95 : 90, // Per kg/L rate
  conversionFactor: product.conversionFactor,
  location: "All Locations",
  lastUpdated: new Date().toISOString(),
}))

// Initial dispatch data
const initialDispatchData = []

// Context type
type OilInventoryContextType = {
  stockData: any[]
  priceData: any[]
  dispatchData: any[]
  updateStockSalesOffice: (productId: number, sales: number) => void
  updateStockSalesVehicle: (productId: number, vehicle: string, sales: number) => void
  updateStockReceipts: (productId: number, receipts: number) => void
  updatePrice: (productId: number, baseRate: number, conversionFactor: number) => void
  addDispatchEntry: (
    line: string,
    vehicle: string,
    productQuantities: { productId: number; quantity: number }[],
  ) => void
  getDispatchedVehicles: () => string[]
  getVehicleDispatchData: () => any
  getCurrentTimestamp: () => string
  getFormattedDate: (date?: Date) => string
}

// Create context
const OilInventoryContext = createContext<OilInventoryContextType | undefined>(undefined)

// Provider component
export function OilInventoryProvider({ children }: { children: ReactNode }) {
  const [stockData, setStockData] = useState(initialStockData)
  const [priceData, setPriceData] = useState(initialPriceData)
  const [dispatchData, setDispatchData] = useState(initialDispatchData)

  // Update stock sales for office
  const updateStockSalesOffice = (productId: number, sales: number) => {
    setStockData((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, salesOffice: Number(sales) } : item)),
    )
  }

  // Update stock sales for a specific vehicle
  const updateStockSalesVehicle = (productId: number, vehicle: string, sales: number) => {
    setStockData((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updatedVehicleSales = { ...item.vehicleSales, [vehicle]: Number(sales) }
          return { ...item, vehicleSales: updatedVehicleSales }
        }
        return item
      }),
    )
  }

  // Update stock receipts
  const updateStockReceipts = (productId: number, receipts: number) => {
    setStockData((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, receipts: Number(receipts) } : item)),
    )
  }

  // Update price
  const updatePrice = (productId: number, baseRate: number, conversionFactor: number) => {
    setPriceData((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              baseRate: Number(baseRate),
              conversionFactor: Number(conversionFactor),
              lastUpdated: new Date().toISOString(),
            }
          : item,
      ),
    )
  }

  // Get list of vehicles that have been dispatched today
  const getDispatchedVehicles = () => {
    return [...new Set(dispatchData.map((entry) => entry.vehicle))]
  }

  // Get vehicle dispatch data for the grid view
  const getVehicleDispatchData = () => {
    // Get all dispatched vehicles
    const dispatchedVehicles = [...new Set(dispatchData.map((entry) => entry.vehicle))].sort()

    if (dispatchedVehicles.length === 0) return { vehicles: [], productRows: [], vehicleTotals: {} }

    // Get all products that have been dispatched
    const dispatchedProductIds = new Set()
    dispatchData.forEach((entry) => {
      entry.products.forEach((p) => dispatchedProductIds.add(p.productId))
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
            .filter((entry) => entry.vehicle === vehicle)
            .reduce((sum, entry) => {
              const productEntry = entry.products.find((p) => p.productId === productId)
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

  // Add dispatch entry
  const addDispatchEntry = (
    line: string,
    vehicle: string,
    productQuantities: { productId: number; quantity: number }[],
  ) => {
    // Filter out products with zero quantity
    const validProductQuantities = productQuantities.filter((pq) => pq.quantity > 0)

    if (validProductQuantities.length === 0) return

    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      line,
      vehicle,
      products: validProductQuantities,
    }

    setDispatchData((prev) => [newEntry, ...prev])

    // Update stock dispatch values
    setStockData((prev) =>
      prev.map((item) => {
        const dispatchItem = validProductQuantities.find((pq) => pq.productId === item.productId)
        return dispatchItem ? { ...item, dispatch: item.dispatch + Number(dispatchItem.quantity) } : item
      }),
    )
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
        updateStockSalesOffice,
        updateStockSalesVehicle,
        updateStockReceipts,
        updatePrice,
        addDispatchEntry,
        getDispatchedVehicles,
        getVehicleDispatchData,
        getCurrentTimestamp,
        getFormattedDate,
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
