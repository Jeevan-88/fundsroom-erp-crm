import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { ApiResponse } from "../lib/responses";
import type { Challan, Customer, Product, StockMovement } from "../lib/models";
import { formatCurrency, formatDate, challanTone, customerStatusTone, movementTone, stockStatus, stockTone } from "../lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, StatCard, Table } from "../components/ui";
import { PageHeader } from "../components/layout";

export function DashboardPage() {
  const { request, canAccess } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [customerResponse, productResponse, challanResponse, movementResponse] = await Promise.all([
          request<ApiResponse<Customer[]>>("/api/customers"),
          request<ApiResponse<Product[]>>("/api/products"),
          request<ApiResponse<Challan[]>>("/api/challans"),
          request<ApiResponse<StockMovement[]>>("/api/stock/movements")
        ]);

        if (cancelled) {
          return;
        }

        setCustomers(customerResponse.data);
        setProducts(productResponse.data);
        setChallans(challanResponse.data);
        setMovements(movementResponse.data);
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [request]);

  const stats = useMemo(() => {
    const lowStockItems = products.filter((product) => product.currentStock <= product.minimumStock);
    const draftChallans = challans.filter((challan) => challan.status === "DRAFT");
    const confirmedChallans = challans.filter((challan) => challan.status === "CONFIRMED");

    return {
      totalCustomers: customers.length,
      totalProducts: products.length,
      lowStockItems: lowStockItems.length,
      draftChallans: draftChallans.length,
      confirmedChallans: confirmedChallans.length,
      lowStockItemsList: lowStockItems
    };
  }, [challans, customers.length, products]);

  if (loading) {
    return <LoadingState label="Loading dashboard data..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate(0)} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard"
        description="Operational overview for CRM, inventory, stock, and challans."
        actions={
          <>
            {canAccess(["ADMIN", "SALES"] ) ? <Link to="/customers"><Button variant="secondary">New Customer</Button></Link> : null}
            {canAccess(["ADMIN"] ) ? <Link to="/products"><Button variant="secondary">New Product</Button></Link> : null}
            {canAccess(["ADMIN", "WAREHOUSE"] ) ? <Link to="/inventory"><Button variant="secondary">Stock Movement</Button></Link> : null}
            {canAccess(["ADMIN", "SALES"] ) ? <Link to="/challans/new"><Button>Create Challan</Button></Link> : null}
          </>
        }
      />

      <div className="stat-grid">
        <StatCard label="Total Customers" value={stats.totalCustomers} tone="info" />
        <StatCard label="Total Products" value={stats.totalProducts} tone="primary" />
        <StatCard label="Low Stock Items" value={stats.lowStockItems} tone="warning" />
        <StatCard label="Draft Challans" value={stats.draftChallans} tone="info" />
        <StatCard label="Confirmed Challans" value={stats.confirmedChallans} tone="success" />
      </div>

      <div className="dashboard-grid">
        <Card>
          <div className="section-head">
            <h3>Recent Stock Movements</h3>
          </div>
          <Table
            rows={movements.slice(0, 5)}
            rowKey={(row) => row.id}
            columns={[
              { header: "Date", cell: (row) => formatDate(row.createdAt) },
              { header: "Product", cell: (row) => row.product?.name ?? "Unknown" },
              { header: "Movement", cell: (row) => <Badge tone={movementTone(row.movementType)}>{row.movementType}</Badge> },
              { header: "Quantity", cell: (row) => row.quantity },
              { header: "Reason", cell: (row) => row.reason }
            ]}
          />
        </Card>

        <Card>
          <div className="section-head">
            <h3>Low Stock Alerts</h3>
          </div>
          {stats.lowStockItemsList.length === 0 ? (
            <EmptyState title="All stock levels healthy" description="No products are at or below minimum stock." />
          ) : (
            <Table
              rows={stats.lowStockItemsList.slice(0, 5)}
              rowKey={(row) => row.id}
              columns={[
                { header: "Product", cell: (row) => row.name },
                { header: "SKU", cell: (row) => row.sku },
                { header: "Stock", cell: (row) => <Badge tone={stockTone(row)}>{stockStatus(row)}</Badge> },
                { header: "Available", cell: (row) => row.currentStock }
              ]}
            />
          )}
        </Card>

        <Card>
          <div className="section-head">
            <h3>Recent Customers</h3>
          </div>
          <Table
            rows={customers.slice(0, 5)}
            rowKey={(row) => row.id}
            columns={[
              { header: "Name", cell: (row) => row.customerName },
              { header: "Business", cell: (row) => row.businessName ?? "-" },
              { header: "Status", cell: (row) => <Badge tone={customerStatusTone(row.status)}>{row.status}</Badge> },
              { header: "Type", cell: (row) => row.customerType }
            ]}
          />
        </Card>

        <Card>
          <div className="section-head">
            <h3>Recent Challans</h3>
          </div>
          <Table
            rows={challans.slice(0, 5)}
            rowKey={(row) => row.id}
            columns={[
              { header: "Challan", cell: (row) => <Link to={`/challans/${row.id}`}>{row.challanNumber}</Link> },
              { header: "Customer", cell: (row) => row.customer?.customerName ?? "-" },
              { header: "Status", cell: (row) => <Badge tone={challanTone(row.status)}>{row.status}</Badge> },
              { header: "Qty", cell: (row) => row.totalQuantity }
            ]}
          />
        </Card>
      </div>
    </div>
  );
}