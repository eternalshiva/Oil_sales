"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clipboard, Droplet, Home, Menu, Package, Truck, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Stock Log",
    icon: Clipboard,
    href: "/stock-log",
    color: "text-violet-500",
  },
  {
    label: "Dispatch Log",
    icon: Truck,
    href: "/dispatch-log",
    color: "text-pink-700",
  },
  {
    label: "Price Master",
    icon: Package,
    href: "/price-master",
    color: "text-orange-500",
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "relative h-full border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div className={cn("flex items-center gap-2 transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
          <Droplet className="h-8 w-8 text-primary" />
          <span className="font-bold">Oil Inventory</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8">
          {isCollapsed ? <Menu /> : <X className="h-4 w-4" />}
        </Button>
      </div>
      <div className="space-y-1 px-3 py-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
              pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
            )}
          >
            <route.icon className={cn("h-5 w-5", route.color)} />
            <span className={cn("transition-opacity duration-200", isCollapsed ? "opacity-0 hidden" : "opacity-100")}>
              {route.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
