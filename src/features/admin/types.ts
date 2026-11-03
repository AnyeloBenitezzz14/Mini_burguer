import type ProductionStatusSelectView from "@/features/admin/components/ProductionStatusSelect"
import type DashboardView from "@/features/dashboard/components/Dashboard"
import type GenericTableView from "@/features/admin/components/GenericTable"
import type RolesPermMatrixView from "@/features/admin/components/RolesPermMatrix"
import type SupplyDetailView from "@/features/admin/components/SupplyDetail"
import type CRUDModalView from "@/features/admin/components/CRUDModal"
import type ProductionPncModalView from "@/features/admin/components/ProductionPncModal"
import type QuickClientModalView from "@/features/admin/components/QuickClientModal"
import type AnulModalView from "@/features/admin/components/AnulModal"
import type PaymentRejectionModalView from "@/features/admin/components/PaymentRejectionModal"
import type DelModalView from "@/features/admin/components/DelModal"
import type SidebarContentView from "@/features/admin/components/SidebarContent"
import type { useAdminPanel } from "@/features/admin/hooks/useAdminPanel"

// A view without its first argument (the state): how AdminPanel's own code calls it
type Bound<V> = V extends (state: never, ...rest: infer R) => infer O ? (...rest: R) => O : never

export type AdminPanelState = ReturnType<typeof useAdminPanel> & {
  ProductionStatusSelect: Bound<typeof ProductionStatusSelectView>
  Dashboard: Bound<typeof DashboardView>
  GenericTable: Bound<typeof GenericTableView>
  RolesPermMatrix: Bound<typeof RolesPermMatrixView>
  supplyDetail: Bound<typeof SupplyDetailView>
  CRUDModal: Bound<typeof CRUDModalView>
  ProductionPncModal: Bound<typeof ProductionPncModalView>
  QuickClientModal: Bound<typeof QuickClientModalView>
  AnulModal: Bound<typeof AnulModalView>
  PaymentRejectionModal: Bound<typeof PaymentRejectionModalView>
  DelModal: Bound<typeof DelModalView>
  SidebarContent: Bound<typeof SidebarContentView>
}
