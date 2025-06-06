"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, Download, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { products, useOilInventory } from "@/context/oil-inventory-context"

export default function PriceMasterPage() {
  const { priceData, updatePrice, getCurrentTimestamp, getFormattedDate } = useOilInventory()
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [editMode, setEditMode] = useState(false)

  // Local state for editing - initialized once
  const [editablePriceData, setEditablePriceData] = useState([])

  // Update time and date
  useEffect(() => {
    setCurrentTime(getCurrentTimestamp())
    setCurrentDate(getFormattedDate())

    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimestamp())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [getCurrentTimestamp, getFormattedDate])

  // Process price data with product details - only when priceData changes or edit mode is toggled
  useEffect(() => {
    const processed = priceData.map((item) => {
      const product = products.find((p) => p.id === item.productId)

      return {
        ...item,
        product: product?.name || "Unknown",
        category: product?.category || "Unknown",
        unitType: product?.unitType || "kg",
        unitPrice: item.baseRate * item.conversionFactor,
        tempBaseRate: item.baseRate,
        tempConversionFactor: item.conversionFactor,
      }
    })

    setEditablePriceData(processed)
  }, [priceData, editMode])

  // Filter entries based on search term
  const filteredPriceData = editablePriceData.filter(
    (item) =>
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle input change
  const handleInputChange = (productId, field, value) => {
    setEditablePriceData((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, [field]: value === "" ? "" : Number(value) } : item,
      ),
    )
  }

  // Handle save all
  const handleSaveAll = () => {
    editablePriceData.forEach((item) => {
      if (item.tempBaseRate !== item.baseRate || item.tempConversionFactor !== item.conversionFactor) {
        updatePrice(item.productId, item.tempBaseRate, item.tempConversionFactor)
      }
    })

    setEditMode(false)

    toast({
      title: "Prices Updated",
      description: "All product prices have been updated successfully",
    })
  }

  // Handle export
  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Price master data is being exported",
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Price Master</h2>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Pricing</CardTitle>
            <CardDescription>Manage base rates and conversion factors</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAll}>Save All</Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>Edit Prices</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">
                    <Button variant="ghost" className="p-0 h-8 font-medium flex items-center">
                      Product <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Base Rate (₹/kg)</TableHead>
                  <TableHead className="text-right">Conversion Factor</TableHead>
                  <TableHead className="text-right">Unit Type</TableHead>
                  <TableHead className="text-right">Unit Price (₹)</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPriceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No price entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPriceData.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            min="0"
                            value={item.tempBaseRate}
                            onChange={(e) => handleInputChange(item.productId, "tempBaseRate", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        ) : (
                          item.baseRate.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.tempConversionFactor}
                            onChange={(e) => handleInputChange(item.productId, "tempConversionFactor", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        ) : (
                          item.conversionFactor
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.unitType}</TableCell>
                      <TableCell className="text-right">
                        ₹{(item.tempBaseRate * item.tempConversionFactor).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(item.lastUpdated).toLocaleDateString()}{" "}
                        {new Date(item.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
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
