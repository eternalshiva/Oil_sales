"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, Download, Plus, Search, Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { products, useOilInventory } from "@/context/oil-inventory-context"

export default function StockLogPage() {
  const {
    stockData,
    priceData,
    updateStockSalesOffice,
    updateStockSalesVehicle,
    updateStockReceipts,
    getDispatchedVehicles,
    getCurrentTimestamp,
    getFormattedDate,
  } = useOilInventory()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("sales")
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")

  // Vehicle sales form state
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [vehicleSalesForm, setVehicleSalesForm] = useState({})
  const [showVehicleSalesForm, setShowVehicleSalesForm] = useState(false)

  // Get dispatched vehicles
  const dispatchedVehicles = getDispatchedVehicles()

  // Update time and date
  useEffect(() => {
    setCurrentTime(getCurrentTimestamp())
    setCurrentDate(getFormattedDate())

    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimestamp())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [getCurrentTimestamp, getFormattedDate])

  // Process stock data with product details
  const processedStockData = stockData.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    const priceItem = priceData.find((p) => p.productId === item.productId)

    // Calculate total sales (sum of office sales and all vehicle sales)
    const vehicleSalesTotal = Object.values(item.vehicleSales || {}).reduce(
      (sum: number, sales: number) => sum + sales,
      0,
    )
    const totalSales = item.salesOffice + vehicleSalesTotal

    const total = item.opening + item.receipts
    const closing = total - totalSales
    const balance = closing - item.dispatch
    const unitPrice = priceItem ? priceItem.baseRate * priceItem.conversionFactor : 0
    const revenue = totalSales * unitPrice

    return {
      ...item,
      product: product?.name || "Unknown",
      category: product?.category || "Unknown",
      totalSales,
      vehicleSalesTotal,
      total,
      closing,
      balance,
      unitPrice,
      revenue,
    }
  })

  // Filter entries based on search term
  const filteredStockData = processedStockData.filter(
    (item) =>
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle input change for office sales
  const handleOfficeSalesChange = (productId, value) => {
    updateStockSalesOffice(productId, value === "" ? 0 : Number(value))
  }

  // Handle input change for receipts
  const handleReceiptsChange = (productId, value) => {
    updateStockReceipts(productId, value === "" ? 0 : Number(value))
  }

  // Handle input change for vehicle sales form
  const handleVehicleSalesFormChange = (productId, value) => {
    setVehicleSalesForm((prev) => ({
      ...prev,
      [productId]: value === "" ? 0 : Number(value),
    }))
  }

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle)

    // Initialize form with existing sales data for this vehicle
    const initialFormData = {}
    processedStockData.forEach((item) => {
      if (item.vehicleSales && item.vehicleSales[vehicle]) {
        initialFormData[item.productId] = item.vehicleSales[vehicle]
      }
    })

    setVehicleSalesForm(initialFormData)
    setShowVehicleSalesForm(true)
  }

  // Handle vehicle sales form submission
  const handleVehicleSalesSubmit = (e) => {
    e.preventDefault()

    if (!selectedVehicle) {
      toast({
        title: "Error",
        description: "Please select a vehicle",
        variant: "destructive",
      })
      return
    }

    // Update sales for each product
    Object.entries(vehicleSalesForm).forEach(([productId, sales]) => {
      updateStockSalesVehicle(Number(productId), selectedVehicle, Number(sales))
    })

    toast({
      title: "Sales Updated",
      description: `Sales for vehicle ${selectedVehicle} have been recorded`,
    })

    // Reset form
    setSelectedVehicle("")
    setVehicleSalesForm({})
    setShowVehicleSalesForm(false)
  }

  // Handle export
  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Stock log data is being exported",
    })
  }

  // Check if current time is within sales entry window (4:00 PM - 6:00 PM)
  const isSalesEntryTime = () => {
    const now = new Date()
    const hours = now.getHours()
    return hours >= 16 && hours < 18
  }

  // Check if current time is within receipts entry window (6:00 PM - 7:00 PM)
  const isReceiptsEntryTime = () => {
    const now = new Date()
    const hours = now.getHours()
    return hours >= 18 && hours < 19
  }

  // Determine if time-based controls should be enforced
  const enforceTimeControls = false // Set to true to enforce time-based controls

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Log</h2>
          <p className="text-muted-foreground">
            {currentDate} • {currentTime}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 md:w-[200px] lg:w-[300px]"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daily Stock Management</CardTitle>
          <CardDescription>Record sales and receipts for all products</CardDescription>
          <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList>
              <TabsTrigger value="sales" disabled={enforceTimeControls && !isSalesEntryTime()}>
                Sales Entry (4:00 PM - 6:00 PM)
              </TabsTrigger>
              <TabsTrigger value="receipts" disabled={enforceTimeControls && !isReceiptsEntryTime()}>
                Receipts Entry (6:00 PM - 7:00 PM)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {activeTab === "sales" && (
            <div className="mb-6">
              {showVehicleSalesForm ? (
                <form onSubmit={handleVehicleSalesSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Sales for Vehicle: {selectedVehicle}</h3>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setShowVehicleSalesForm(false)}>
                      Cancel
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left font-medium p-2">Product</th>
                          <th className="text-center font-medium p-2">Available</th>
                          <th className="text-right font-medium p-2">Sales Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStockData.map((item) => (
                          <tr key={item.productId} className="border-b">
                            <td className="p-2">{item.product}</td>
                            <td className="text-center p-2">{item.total - item.totalSales}</td>
                            <td className="text-right p-2">
                              <Input
                                type="number"
                                min="0"
                                max={item.total - item.totalSales}
                                value={vehicleSalesForm[item.productId] || ""}
                                onChange={(e) => handleVehicleSalesFormChange(item.productId, e.target.value)}
                                className="h-8 w-20 text-right ml-auto"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">
                      <Plus className="mr-2 h-4 w-4" /> Save Vehicle Sales
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle">Select Vehicle for Sales Entry</Label>
                      <Select value={selectedVehicle} onValueChange={handleVehicleSelect}>
                        <SelectTrigger id="vehicle" className="w-[200px]">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {dispatchedVehicles.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No vehicles dispatched today
                            </SelectItem>
                          ) : (
                            dispatchedVehicles.map((vehicle) => (
                              <SelectItem key={vehicle} value={vehicle}>
                                Vehicle {vehicle}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dispatchedVehicles.length === 0
                        ? "No vehicles have been dispatched today. Add dispatch entries first."
                        : `${dispatchedVehicles.length} vehicle(s) available for sales entry`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[250px]">
                    <Button variant="ghost" className="p-0 h-8 font-medium flex items-center">
                      Product <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  {activeTab === "receipts" && (
                    <TableHead className="text-right">
                      <span className="font-medium text-primary">Receipts</span>
                    </TableHead>
                  )}
                  <TableHead className="text-right">Total</TableHead>
                  {activeTab === "sales" && (
                    <>
                      <TableHead className="text-right">
                        <span className="font-medium text-primary">Vehicle Sales</span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="font-medium text-primary">Office Sales</span>
                      </TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Closing</TableHead>
                  <TableHead className="text-right">DC</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Price (₹)</TableHead>
                  <TableHead className="text-right">Revenue (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStockData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === "sales" ? 11 : 9} className="text-center py-4">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStockData.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell className="text-right">{item.opening}</TableCell>
                      {activeTab === "receipts" && (
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            value={item.receipts || ""}
                            onChange={(e) => handleReceiptsChange(item.productId, e.target.value)}
                            className="h-8 w-20 text-right"
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-right">{item.total}</TableCell>
                      {activeTab === "sales" && (
                        <>
                          <TableCell className="text-right">
                            {item.vehicleSalesTotal > 0 ? (
                              <div className="flex flex-col">
                                {Object.entries(item.vehicleSales || {}).map(([vehicle, sales]) => (
                                  <span key={vehicle} className="text-xs">
                                    {vehicle}: {sales}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              "0"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              value={item.salesOffice || ""}
                              onChange={(e) => handleOfficeSalesChange(item.productId, e.target.value)}
                              className="h-8 w-20 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.totalSales}</TableCell>
                        </>
                      )}
                      <TableCell className="text-right">{item.closing}</TableCell>
                      <TableCell className="text-right">{item.dispatch}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.balance < 5 ? "destructive" : item.balance < 10 ? "outline" : "default"}>
                          {item.balance}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
