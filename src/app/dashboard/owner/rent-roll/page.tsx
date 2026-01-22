"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, TrendingDown } from "lucide-react"
import { AgingAnalysisCards, PortfolioRentRollTable } from "@/components/rent-roll"

export default function OwnerRentRollPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">My Rent Roll</h1>
        <p className="text-slate-600 mt-1">
          View rent collection status across your properties
        </p>
      </div>

      <Tabs defaultValue="rent-roll" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rent-roll" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Rent Roll
          </TabsTrigger>
          <TabsTrigger value="aging" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Aging Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rent-roll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Property Rent Roll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioRentRollTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          <AgingAnalysisCards showDetails />
        </TabsContent>
      </Tabs>
    </div>
  )
}
