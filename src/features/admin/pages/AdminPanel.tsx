import type { User } from "@/shared/types"
import ProductionStatusSelectView from "@/features/admin/components/ProductionStatusSelect"
import DashboardView from "@/features/dashboard/components/Dashboard"
import GenericTableView from "@/features/admin/components/GenericTable"
import RolesPermMatrixView from "@/features/admin/components/RolesPermMatrix"
import SupplyDetailView from "@/features/admin/components/SupplyDetail"
import CRUDModalView from "@/features/admin/components/CRUDModal"
import ProductionPncModalView from "@/features/admin/components/ProductionPncModal"
import QuickClientModalView from "@/features/admin/components/QuickClientModal"
import AnulModalView from "@/features/admin/components/AnulModal"
import PaymentRejectionModalView from "@/features/admin/components/PaymentRejectionModal"
import DelModalView from "@/features/admin/components/DelModal"
import SidebarContentView from "@/features/admin/components/SidebarContent"
import AdminLayoutView from "@/features/admin/components/AdminLayout"
import { useAdminPanel } from "@/features/admin/hooks/useAdminPanel"
import type { AdminPanelState } from "@/features/admin/types"

// The admin panel: its state lives in useAdminPanel and each part of the screen is a view in components/.
// The views are bound here on every render (as they were declared inside the component), so they mount and
// update exactly as before.
export default function AdminPanel(props: {
  onSwitchToClient: () => void
  onLogout: () => void
  user: User | null
}) {
  const state = useAdminPanel(props)
  const adminState: AdminPanelState = {
    ...state,
    ProductionStatusSelect: (...args) => ProductionStatusSelectView(adminState, ...args),
    Dashboard: (...args) => DashboardView(adminState, ...args),
    GenericTable: (...args) => GenericTableView(adminState, ...args),
    RolesPermMatrix: (...args) => RolesPermMatrixView(adminState, ...args),
    supplyDetail: (...args) => SupplyDetailView(adminState, ...args),
    CRUDModal: (...args) => CRUDModalView(adminState, ...args),
    ProductionPncModal: (...args) => ProductionPncModalView(adminState, ...args),
    QuickClientModal: (...args) => QuickClientModalView(adminState, ...args),
    AnulModal: (...args) => AnulModalView(adminState, ...args),
    PaymentRejectionModal: (...args) => PaymentRejectionModalView(adminState, ...args),
    DelModal: (...args) => DelModalView(adminState, ...args),
    SidebarContent: (...args) => SidebarContentView(adminState, ...args),
  }
  return AdminLayoutView(adminState)
}
