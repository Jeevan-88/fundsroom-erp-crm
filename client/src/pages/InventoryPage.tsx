import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { ApiResponse } from "../lib/responses";
import type { Product, StockMovement, StockMovementType } from "../lib/models";
import { formatDate, formatCurrency, movementTone, stockStatus, stockTone } from "../lib/format";
import { Badge, Button, Card, Drawer, EmptyState, ErrorState, Input, LoadingState, Pagination, Select, Table } from "../components/ui";
import { PageHeader } from "../components/layout";

type MovementFormState = {
  productId: string;
  movementType: StockMovementType;
  quantity: string;
  reason: string;
};

const emptyMovementForm: MovementFormState = {
  productId: "",
  movementType: "IN",
  quantity: "",
  reason: ""
};

export function InventoryPage() {
  const { request, canAccess } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementOpen, setMovementOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MovementFormState>(emptyMovementForm);
  const [page, setPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);

  const pageSize = 8;

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [productResponse, movementResponse] = await Promise.all([
        request<ApiResponse<Product[]>>("/api/products"),
        request<ApiResponse<StockMovement[]>>("/api/stock/movements")
      ]);

      setProducts(productResponse.data);
      setMovements(movementResponse.data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currentInventory = useMemo(() => products.slice((page - 1) * pageSize, page * pageSize), [products, page]);
  const movementRows = useMemo(() => movements.slice((movementPage - 1) * pageSize, movementPage * pageSize), [movements, movementPage]);
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  const movementPageCount = Math.max(1, Math.ceil(movements.length / pageSize));

  const selectedProduct = products.find((product) => product.id === form.productId) ?? null;

  const submitMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.productId) {
      toast.error("Select a product", "Choose a product before submitting the movement.");
      return;
    }

    setSaving(true);

    try {
      await request<ApiResponse<unknown>>("/api/stock/movements", {
        method: "POST",
        body: {
          productId: form.productId,
          quantity: Number(form.quantity),
          movementType: form.movementType,
          reason: form.reason
        }
      });

      toast.success("Stock movement recorded", form.reason);
      setMovementOpen(false);
      setForm(emptyMovementForm);
      await load();
    } catch (caughtError) {
      toast.error("Movement failed", caughtError instanceof Error ? caughtError.message : "Try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading inventory..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Inventory"
        description="Current stock and stock movement audit trail."
        actions={canAccess(["ADMIN", "WAREHOUSE"]) ? <Button onClick={() => setMovementOpen(true)}>New Movement</Button> : undefined}
      />

      <div className="inventory-grid">
        <Card>
          <div className="section-head"><h3>Current Inventory</h3></div>
          <Table
            rows={currentInventory}
            rowKey={(row) => row.id}
            columns={[
              { header: "Product", cell: (row) => row.name },
              { header: "SKU", cell: (row) => row.sku },
              { header: "Current Stock", cell: (row) => row.currentStock },
              { header: "Minimum Stock", cell: (row) => row.minimumStock },
              { header: "Warehouse", cell: (row) => row.warehouseLocation },
              { header: "Status", cell: (row) => <Badge tone={stockTone(row)}>{stockStatus(row)}</Badge> }
            ]}
          />
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </Card>

        <Card>
          <div className="section-head"><h3>Stock Movements</h3></div>
          <Table
            rows={movementRows}
            rowKey={(row) => row.id}
            columns={[
              { header: "Date", cell: (row) => formatDate(row.createdAt) },
              { header: "Product", cell: (row) => row.product?.name ?? "Unknown" },
              { header: "Movement", cell: (row) => <Badge tone={movementTone(row.movementType)}>{row.movementType}</Badge> },
              { header: "Quantity", cell: (row) => row.quantity },
              { header: "Reason", cell: (row) => row.reason },
              { header: "Created By", cell: (row) => row.createdBy?.name ?? "-" }
            ]}
          />
          <Pagination page={movementPage} pageCount={movementPageCount} onPageChange={setMovementPage} />
        </Card>
      </div>

      <Drawer open={movementOpen} title="Stock Movement" onClose={() => setMovementOpen(false)}>
        <form className="form-grid" onSubmit={submitMovement}>
          <label>
            <span>Product</span>
            <Select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} required>
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>
              ))}
            </Select>
          </label>

          <label>
            <span>Movement Type</span>
            <Select value={form.movementType} onChange={(event) => setForm({ ...form, movementType: event.target.value as StockMovementType })}>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </Select>
          </label>

          <label>
            <span>Quantity</span>
            <Input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
          </label>

          <label className="full-row">
            <span>Reason</span>
            <Input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} required />
          </label>

          {selectedProduct ? (
            <Card className="info-strip full-row">
              <div>Current stock: <strong>{selectedProduct.currentStock}</strong></div>
              <div>Unit price: <strong>{formatCurrency(selectedProduct.unitPrice)}</strong></div>
              {form.movementType === "OUT" ? <div>Available after OUT: <strong>{Math.max(0, selectedProduct.currentStock - Number(form.quantity || 0))}</strong></div> : null}
            </Card>
          ) : null}

          <div className="button-row right full-row">
            <Button type="button" variant="secondary" onClick={() => setMovementOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Submitting..." : "Save Movement"}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}