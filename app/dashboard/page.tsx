"use client"

import { useState } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { AlertTriangle, Download, Send } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { products, routes, useOilInventory } from "@/context/oil-inventory-context"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#FF6B6B", "#6BCB77"]

export default function DashboardPage() {
  const { stockData, priceData, dispatchData, getCurrentTimestamp, getFormattedDate } = useOilInventory()
  const { toast } = useToast()
  const [whatsappPreview, setWhatsappPreview] = useState(false)

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
      total,
      closing,
      balance,
      unitPrice,
      revenue,
    }
  })

  // Calculate totals
  const totalRevenue = processedStockData.reduce((sum, item) => sum + item.revenue, 0)
  const avgPricePerUnit = processedStockData.reduce((sum, item) => sum + item.unitPrice, 0) / processedStockData.length

  // Process dispatch data
  const routeDispatchSummary = routes
    .map((route) => {
      const entriesForRoute = dispatchData.filter((entry) => entry.line === route)

      // Get all products dispatched on this route
      const allProductsOnRoute = entriesForRoute.flatMap((entry) =>
        entry.products.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          vehicle: entry.vehicle,
        })),
      )

      // Sum quantities by product
      const productQuantities = {}
      allProductsOnRoute.forEach((item) => {
        if (!productQuantities[item.productId]) {
          productQuantities[item.productId] = 0
        }
        productQuantities[item.productId] += item.quantity
      })

      // Get unique vehicles used
      const vehiclesUsed = [...new Set(entriesForRoute.map((entry) => entry.vehicle))].join(", ")

      // Calculate total dispatched
      const totalDispatched = Object.values(productQuantities).reduce((sum: any, qty: any) => sum + qty, 0)

      return {
        line: route,
        totalDispatched,
        vehiclesUsed,
        productQuantities,
      }
    })
    .filter((summary) => summary.totalDispatched > 0)

  // Prepare chart data
  const salesData = processedStockData
    .filter((item) => item.totalSales > 0)
    .map((item) => ({
      name: item.product.split(" ").slice(0, 2).join(" "),
      sales: item.totalSales,
    }))

  const revenueData = processedStockData
    .filter((item) => item.revenue > 0)
    .map((item) => ({
      name: item.product.split(" ").slice(0, 2).join(" "),
      value: item.revenue,
    }))

  // Generate WhatsApp price update message
  const generateWhatsAppMessage = () => {
    const date = getFormattedDate()

    // Sort products by category and then by name
    const sortedProducts = [...processedStockData].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.product.localeCompare(b.product)
    })

    // Format product pricing info
    const productInfo = sortedProducts
      .map((item) => `• ${item.product} – ₹${item.unitPrice.toLocaleString()}`)
      .join("\n")

    return `🛢️ Price Update – ${date}\n${productInfo}`
  }

  const handleSendSummary = () => {
    setWhatsappPreview(true)
    toast({
      title: "Price Update Ready",
      description: "WhatsApp price update has been generated",
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue Today</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Based on today's sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Price per Unit</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{avgPricePerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Current pricing average</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>Current stock status for all products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium p-2">Product</th>
                        <th className="text-center font-medium p-2">Opening</th>
                        <th className="text-center font-medium p-2">Receipts</th>
                        <th className="text-center font-medium p-2">Total</th>
                        <th className="text-center font-medium p-2">Sales</th>
                        <th className="text-center font-medium p-2">DC</th>
                        <th className="text-center font-medium p-2">Closing</th>
                        <th className="text-center font-medium p-2">Balance</th>
                        <th className="text-right font-medium p-2">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedStockData.map((item) => (
                        <tr key={item.productId} className="border-b">
                          <td className="p-2">{item.product}</td>
                          <td className="text-center p-2">{item.opening}</td>
                          <td className="text-center p-2">{item.receipts}</td>
                          <td className="text-center p-2">{item.total}</td>
                          <td className="text-center p-2">{item.totalSales}</td>
                          <td className="text-center p-2">{item.dispatch}</td>
                          <td className="text-center p-2">{item.closing}</td>
                          <td className="text-center p-2">
                            <Badge
                              variant={item.balance < 5 ? "destructive" : item.balance < 10 ? "outline" : "default"}
                            >
                              {item.balance}
                            </Badge>
                          </td>
                          <td className="text-right p-2">₹{item.unitPrice.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Route-Wise Dispatch Summary</CardTitle>
                <CardDescription>Today's dispatches by route and vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium p-2">Line</th>
                        <th className="text-center font-medium p-2">Total Dispatched</th>
                        <th className="text-left font-medium p-2">Vehicles Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeDispatchSummary.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center p-4 text-muted-foreground">
                            No dispatches recorded today
                          </td>
                        </tr>
                      ) : (
                        routeDispatchSummary.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{item.line}</td>
                            <td className="text-center p-2">{item.totalDispatched}</td>
                            <td className="p-2">{item.vehiclesUsed}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processedStockData
              .filter((item) => item.balance < 10)
              .map((item) => (
                <Card key={item.productId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                    <CardDescription>{item.balance < 5 ? "🔴 Critical" : "⚠️ Low"}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{item.product}</div>
                        <div className="text-xs text-muted-foreground">Current Balance: {item.balance} units</div>
                      </div>
                      <AlertTriangle className={item.balance < 5 ? "text-red-500" : "text-amber-500"} />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          <Card className="bg-green-50 dark:bg-green-950">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-green-800 dark:text-green-300">WhatsApp Price Update</CardTitle>
                <CardDescription className="text-green-700 dark:text-green-400">
                  Current pricing for sharing via WhatsApp
                </CardDescription>
              </div>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSendSummary}>
                <Send className="mr-2 h-4 w-4" /> Generate Price Update
              </Button>
            </CardHeader>
            <CardContent>
              {whatsappPreview ? (
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-800 font-mono whitespace-pre-line">
                  {generateWhatsAppMessage()}
                </div>
              ) : (
                <div className="text-center p-8 text-green-700 dark:text-green-400">
                  Click "Generate Price Update" to preview the WhatsApp price report
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Product</CardTitle>
                <CardDescription>Units sold per product today</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#8884d8" name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Contribution</CardTitle>
                <CardDescription>Revenue share by product</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Snapshot</CardTitle>
              <CardDescription>Current pricing for all products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-2">Product</th>
                      <th className="text-right font-medium p-2">Base Rate (₹/kg)</th>
                      <th className="text-right font-medium p-2">Conversion</th>
                      <th className="text-right font-medium p-2">Unit Price (₹)</th>
                      <th className="text-right font-medium p-2">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceData.map((item) => {
                      const product = products.find((p) => p.id === item.productId)
                      const unitPrice = item.baseRate * item.conversionFactor
                      const lastUpdated = new Date(item.lastUpdated)

                      return (
                        <tr key={item.productId} className="border-b">
                          <td className="p-2">{product?.name || "Unknown"}</td>
                          <td className="text-right p-2">{item.baseRate.toLocaleString()}</td>
                          <td className="text-right p-2">{item.conversionFactor}</td>
                          <td className="text-right p-2">₹{unitPrice.toLocaleString()}</td>
                          <td className="text-right p-2">
                            {lastUpdated.toLocaleDateString()}{" "}
                            {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
