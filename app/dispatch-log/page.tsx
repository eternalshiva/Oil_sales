"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, Download, Plus, Search, Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { products, routes, vehicles, useOilInventory } from "@/context/oil-inventory-context"

export default function DispatchLogPage() {
  const { stockData, dispatchData, addDispatchEntry, getCurrentTimestamp, getFormattedDate } = useOilInventory()
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [activeTab, setActiveTab] = useState("entry")

  // Form state
  const [selectedLine, setSelectedLine] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [productQuantities, setProductQuantities] = useState({})

  // Update time and date
  useEffect(() => {
    setCurrentTime(getCurrentTimestamp())
    setCurrentDate(getFormattedDate())

    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimestamp())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [getCurrentTimestamp, getFormattedDate])

  // Process stock data to get dispatchable products (those with balance > 0)
  const dispatchableProducts = stockData
    .map((item) => {
      const product = products.find((p) => p.id === item.productId)

      // Calculate total sales (sum of office sales and all vehicle sales)
      const vehicleSalesTotal = Object.values(item.vehicleSales || {}).reduce(
        (sum: number, sales: number) => sum + sales,
        0,
      )
      const totalSales = item.salesOffice + vehicleSalesTotal

      const total = item.opening + item.receipts
      const closing = total - totalSales
      const balance = closing - item.dispatch

      return {
        productId: item.productId,
        name: product?.name || "Unknown",
        category: product?.category || "Unknown",
        balance,
      }
    })
    .filter((item) => item.balance > 0)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  // Process dispatch data with product details
  const processedDispatchData = dispatchData.map((entry) => {
    const processedProducts = entry.products.map((p) => {
      const product = products.find((prod) => prod.id === p.productId)
      return {
        ...p,
        name: product?.name || "Unknown",
      }
    })

    return {
      ...entry,
      date: new Date(entry.date).toLocaleDateString(),
      time: new Date(entry.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      processedProducts,
    }
  })

  // Filter entries based on search term
  const filteredDispatchData = processedDispatchData.filter(
    (entry) =>
      entry.line.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.vehicle.includes(searchTerm) ||
      entry.processedProducts.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Calculate route-wise summary
  const routeSummary = routes
    .map((route) => {
      const entriesForRoute = processedDispatchData.filter((entry) => entry.line === route)

      // Get all products dispatched on this route
      const allProductsOnRoute = entriesForRoute.flatMap((entry) =>
        entry.processedProducts.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          name: p.name,
          vehicle: entry.vehicle,
        })),
      )

      // Sum quantities by product
      const productQuantities = {}
      allProductsOnRoute.forEach((item) => {
        if (!productQuantities[item.productId]) {
          productQuantities[item.productId] = {
            name: item.name,
            quantity: 0,
          }
        }
        productQuantities[item.productId].quantity += item.quantity
      })

      // Get unique vehicles used
      const vehiclesUsed = [...new Set(entriesForRoute.map((entry) => entry.vehicle))].join(", ")

      // Calculate total dispatched
      const totalDispatched = Object.values(productQuantities).reduce((sum, item) => sum + item.quantity, 0)

      return {
        line: route,
        totalDispatched,
        vehiclesUsed,
        products: Object.values(productQuantities),
      }
    })
    .filter((summary) => summary.totalDispatched > 0)

  // Prepare data for the vehicle-wise dispatch grid
  const prepareVehicleDispatchGrid = () => {
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

  const vehicleDispatchGrid = prepareVehicleDispatchGrid()

  // Handle quantity change
  const handleQuantityChange = (productId, value) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: value === "" ? 0 : Number(value),
    }))
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!selectedLine || !selectedVehicle) {
      toast({
        title: "Error",
        description: "Please select both a line and a vehicle",
        variant: "destructive",
      })
      return
    }

    // Format product quantities for submission
    const formattedProductQuantities = Object.entries(productQuantities).map(([productId, quantity]) => ({
      productId: Number(productId),
      quantity: Number(quantity),
    }))

    // Check if any products have quantities
    if (formattedProductQuantities.filter((p) => p.quantity > 0).length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one product quantity",
        variant: "destructive",
      })
      return
    }

    // Add dispatch entry
    addDispatchEntry(selectedLine, selectedVehicle, formattedProductQuantities)

    toast({
      title: "Dispatch Entry Added",
      description: "The dispatch entry has been successfully added",
    })

    // Reset form
    setSelectedLine("")
    setSelectedVehicle("")
    setProductQuantities({})
  }

  // Handle export
  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Dispatch log data is being exported",
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispatch Log</h2>
          <p className="text-muted-foreground">
            {currentDate} • {currentTime}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dispatches..."
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

      <Tabs defaultValue="entry" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="entry">Dispatch Entry</TabsTrigger>
          <TabsTrigger value="grid">Vehicle-wise Grid</TabsTrigger>
          <TabsTrigger value="summary">Route Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Dispatch Entry</CardTitle>
              <CardDescription>Record oil dispatches to different routes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="line">Line</Label>
                    <Select value={selectedLine} onValueChange={setSelectedLine}>
                      <SelectTrigger id="line">
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem key={route} value={route}>
                            {route}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Vehicle Number</Label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger id="vehicle">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle} value={vehicle}>
                            {vehicle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedLine && selectedVehicle && (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Truck className="mr-2 h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-medium">Product Quantities</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left font-medium p-2">Product</th>
                            <th className="text-center font-medium p-2">Available Balance</th>
                            <th className="text-right font-medium p-2">Quantity to Dispatch</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dispatchableProducts.map((product) => (
                            <tr key={product.productId} className="border-b">
                              <td className="p-2">{product.name}</td>
                              <td className="text-center p-2">{product.balance}</td>
                              <td className="text-right p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={product.balance}
                                  value={productQuantities[product.productId] || ""}
                                  onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
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
                        <Plus className="mr-2 h-4 w-4" /> Add Dispatch Entry
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dispatch Entries</CardTitle>
              <CardDescription>Recent dispatch records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>
                        <Button variant="ghost" className="p-0 h-8 font-medium flex items-center">
                          Line <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Products</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDispatchData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No dispatch entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDispatchData.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>{entry.time}</TableCell>
                          <TableCell>{entry.line}</TableCell>
                          <TableCell>{entry.vehicle}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {entry.processedProducts.map((product, idx) => (
                                <div key={idx} className="text-xs">
                                  {product.name.split(" ").slice(0, 2).join(" ")}: {product.quantity} units
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle-wise Dispatch Grid</CardTitle>
              <CardDescription>Matrix view of products dispatched by vehicle</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicleDispatchGrid.vehicles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No dispatch data available. Add dispatch entries to see the grid view.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium p-2 bg-muted/50">Products</th>
                        {vehicleDispatchGrid.vehicles.map((vehicle) => (
                          <th key={vehicle} className="text-center font-medium p-2 bg-muted/50">
                            {vehicle}
                          </th>
                        ))}
                        <th className="text-center font-medium p-2 bg-muted/50">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleDispatchGrid.productRows.map((row) => (
                        <tr key={row.productId} className="border-b hover:bg-muted/20">
                          <td className="p-2 font-medium">{row.name.split(" ").slice(0, 2).join(" ")}</td>
                          {vehicleDispatchGrid.vehicles.map((vehicle) => (
                            <td key={vehicle} className="text-center p-2">
                              {row.vehicleQuantities[vehicle] || "-"}
                            </td>
                          ))}
                          <td className="text-center p-2 font-medium">{row.total}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-primary/20 font-medium bg-muted/30">
                        <td className="p-2">Total</td>
                        {vehicleDispatchGrid.vehicles.map((vehicle) => (
                          <td key={vehicle} className="text-center p-2">
                            {vehicleDispatchGrid.vehicleTotals[vehicle]}
                          </td>
                        ))}
                        <td className="text-center p-2 font-bold">{vehicleDispatchGrid.vehicleTotals.grand}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route-Wise Summary</CardTitle>
              <CardDescription>Dispatch totals by route</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line</TableHead>
                      <TableHead className="text-right">Total Dispatched</TableHead>
                      <TableHead>Vehicles Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeSummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          No dispatch summary available
                        </TableCell>
                      </TableRow>
                    ) : (
                      routeSummary.map((summary, index) => (
                        <TableRow key={index}>
                          <TableCell>{summary.line}</TableCell>
                          <TableCell className="text-right">{summary.totalDispatched}</TableCell>
                          <TableCell>{summary.vehiclesUsed}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product-Wise Summary</CardTitle>
              <CardDescription>Total quantities dispatched by product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Total Dispatched</TableHead>
                      <TableHead>Routes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleDispatchGrid.productRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          No product summary available
                        </TableCell>
                      </TableRow>
                    ) : (
                      vehicleDispatchGrid.productRows
                        .sort((a, b) => b.total - a.total)
                        .map((row) => {
                          // Find routes where this product was dispatched
                          const productRoutes = new Set()
                          dispatchData.forEach((entry) => {
                            if (entry.products.some((p) => p.productId === row.productId)) {
                              productRoutes.add(entry.line)
                            }
                          })

                          return (
                            <TableRow key={row.productId}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell className="text-right">{row.total}</TableCell>
                              <TableCell>{Array.from(productRoutes).join(", ")}</TableCell>
                            </TableRow>
                          )
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
