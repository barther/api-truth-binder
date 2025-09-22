// ATW = "Around The World" (third-shift weekly desk map). Do NOT rename or redefine.
import { ATWManagement } from "@/components/ATWManagement"

export default function ATWPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-franklin font-bold tracking-tight">
            ATW Management
          </h1>
          <p className="text-muted-foreground">
            Manage Around The World third-shift relief positions with weekly desk rotation schedules.
          </p>
        </div>
        
        <ATWManagement />
      </div>
    </div>
  )
}