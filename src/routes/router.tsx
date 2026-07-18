import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/app/AppShell"
import { ModuleGate } from "@/components/app/ModuleGate"
import { ProtectedRoute } from "@/routes/ProtectedRoute"

const LandingPage = lazy(() => import("@/pages/landing/LandingPage"))
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"))
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"))
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"))
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"))

const DashboardPage = lazy(() => import("@/pages/app/dashboard/DashboardPage"))
const ServiceOrdersBoardPage = lazy(() => import("@/pages/app/service-orders/ServiceOrdersBoardPage"))
const ServiceOrderFormPage = lazy(() => import("@/pages/app/service-orders/ServiceOrderFormPage"))
const ServiceOrderDetailPage = lazy(() => import("@/pages/app/service-orders/ServiceOrderDetailPage"))
const ClientsListPage = lazy(() => import("@/pages/app/clients/ClientsListPage"))
const ClientDetailPage = lazy(() => import("@/pages/app/clients/ClientDetailPage"))
const InventoryListPage = lazy(() => import("@/pages/app/inventory/InventoryListPage"))
const FinancePage = lazy(() => import("@/pages/app/finance/FinancePage"))
const TeamPage = lazy(() => import("@/pages/app/team/TeamPage"))
const PosPage = lazy(() => import("@/pages/app/pos/PosPage"))
const ShowcaseAdminPage = lazy(() => import("@/pages/app/showcase/ShowcaseAdminPage"))
const ShowcasePublicPage = lazy(() => import("@/pages/app/showcase/ShowcasePublicPage"))

function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="border-muted-foreground/30 border-t-primary size-8 animate-spin rounded-full border-2" />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Public storefront — no auth, served by the anon RLS policy on resale_devices. */}
        <Route path="/showcase/:companySlug" element={<ShowcasePublicPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route
              path="dashboard"
              element={
                <ModuleGate module="dashboard">
                  <DashboardPage />
                </ModuleGate>
              }
            />
            <Route
              path="service-orders"
              element={
                <ModuleGate module="service_orders">
                  <ServiceOrdersBoardPage />
                </ModuleGate>
              }
            />
            <Route
              path="service-orders/new"
              element={
                <ModuleGate module="service_orders">
                  <ServiceOrderFormPage />
                </ModuleGate>
              }
            />
            <Route
              path="service-orders/:id"
              element={
                <ModuleGate module="service_orders">
                  <ServiceOrderDetailPage />
                </ModuleGate>
              }
            />
            <Route
              path="clients"
              element={
                <ModuleGate module="clients">
                  <ClientsListPage />
                </ModuleGate>
              }
            />
            <Route
              path="clients/:id"
              element={
                <ModuleGate module="clients">
                  <ClientDetailPage />
                </ModuleGate>
              }
            />
            <Route
              path="inventory"
              element={
                <ModuleGate module="inventory">
                  <InventoryListPage />
                </ModuleGate>
              }
            />
            <Route
              path="finance"
              element={
                <ModuleGate module="finance">
                  <FinancePage />
                </ModuleGate>
              }
            />
            <Route
              path="team"
              element={
                <ModuleGate module="team">
                  <TeamPage />
                </ModuleGate>
              }
            />
            <Route
              path="pos"
              element={
                <ModuleGate module="pos">
                  <PosPage />
                </ModuleGate>
              }
            />
            <Route
              path="showcase"
              element={
                <ModuleGate module="showcase">
                  <ShowcaseAdminPage />
                </ModuleGate>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
