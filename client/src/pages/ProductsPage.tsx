import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { ApiResponse } from "../lib/responses";
import type { Product } from "../lib/models";
import { formatCurrency, stockStatus, stockTone } from "../lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Modal, Pagination, Select, Table } from "../components/ui";
import { PageHeader } from "../components/layout";

type ProductFormState = {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  minimumStock: string;
  warehouseLocation: string;
};

const emptyProductForm: ProductFormState = {
  name: "",
  sku: "",
  category: "",
  unitPrice: "",
  minimumStock: "0",
  warehouseLocation: ""
};

export function ProductsPage() {
  const { request, canAccess } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);

  const pageSize = 8;

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    const query = new URLSearchParams();

    if (search.trim()) {
      query.set("search", search.trim());
    }

    if (category.trim()) {
      query.set("category", category.trim());
    }

    if (lowStock) {
      query.set("lowStock", "true");
    }

    try {
      const response = await request<ApiResponse<Product[]>>(`/api/products?${query.toString()}`);
      setProducts(response.data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [search, category, lowStock]);

  const pagedProducts = useMemo(() => products.slice((page - 1) * pageSize, page * pageSize), [products, page]);
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyProductForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice,
      minimumStock: String(product.minimumStock),
      warehouseLocation: product.warehouseLocation
    });
    setModalOpen(true);
  };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      unitPrice: Number(form.unitPrice),
      minimumStock: Number(form.minimumStock),
      warehouseLocation: form.warehouseLocation
    };

    try {
      if (editingProduct) {
        await request<ApiResponse<Product>>(`/api/products/${editingProduct.id}`, { method: "PUT", body: payload });
        toast.success("Product updated", payload.name);
      } else {
        await request<ApiResponse<Product>>("/api/products", { method: "POST", body: { ...payload, currentStock: 0 } });
        toast.success("Product created", payload.name);
      }

      setModalOpen(false);
      await loadProducts();
    } catch (caughtError) {
      toast.error("Product save failed", caughtError instanceof Error ? caughtError.message : "Try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading products..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadProducts} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Products"
        description="Product master, pricing, and stock visibility."
        actions={canAccess(["ADMIN"]) ? <Button onClick={openCreate}>Add Product</Button> : undefined}
      />

      <Card>
        <div className="filter-row">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or SKU..." />
          <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Filter by category" />
          <Select value={lowStock ? "true" : ""} onChange={(event) => setLowStock(event.target.value === "true")}> 
            <option value="">All stock levels</option>
            <option value="true">Low stock only</option>
          </Select>
        </div>

        <Table
          rows={pagedProducts}
          rowKey={(row) => row.id}
          emptyMessage="No products found for the selected filters."
          columns={[
            { header: "Product", cell: (row) => row.name },
            { header: "SKU", cell: (row) => row.sku },
            { header: "Category", cell: (row) => row.category },
            { header: "Unit Price", cell: (row) => formatCurrency(row.unitPrice) },
            { header: "Current Stock", cell: (row) => row.currentStock },
            { header: "Minimum Stock", cell: (row) => row.minimumStock },
            { header: "Warehouse", cell: (row) => row.warehouseLocation },
            { header: "Status", cell: (row) => <Badge tone={stockTone(row)}>{stockStatus(row)}</Badge> },
            {
              header: "Actions",
              cell: (row) => (
                <div className="row-actions">
                  {canAccess(["ADMIN"]) ? <Button variant="ghost" onClick={() => openEdit(row)}>Edit</Button> : null}
                </div>
              )
            }
          ]}
        />

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </Card>

      <Modal open={modalOpen} title={editingProduct ? "Edit Product" : "Add Product"} onClose={() => setModalOpen(false)}>
        <form className="form-grid" onSubmit={submitProduct}>
          <label><span>Name</span><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label><span>SKU</span><Input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required /></label>
          <label><span>Category</span><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></label>
          <label><span>Unit Price</span><Input type="number" step="0.01" min="0" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} required /></label>
          <label><span>Minimum Stock</span><Input type="number" min="0" value={form.minimumStock} onChange={(event) => setForm({ ...form, minimumStock: event.target.value })} required /></label>
          <label className="full-row"><span>Warehouse Location</span><Input value={form.warehouseLocation} onChange={(event) => setForm({ ...form, warehouseLocation: event.target.value })} required /></label>
          <div className="button-row right full-row">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Product"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}