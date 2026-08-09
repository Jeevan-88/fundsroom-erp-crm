import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { ApiResponse } from "../lib/responses";
import type { Challan, Customer, Product } from "../lib/models";
import { formatCurrency } from "../lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Select, Table } from "../components/ui";
import { PageHeader } from "../components/layout";

type ChallanItemDraft = {
  productId: string;
  quantity: string;
};

export function ChallanCreatePage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams();
  const { request, canAccess } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<ChallanItemDraft[]>([{ productId: "", quantity: "1" }]);
  const [challan, setChallan] = useState<Challan | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [customerResponse, productResponse] = await Promise.all([
          request<ApiResponse<Customer[]>>("/api/customers"),
          request<ApiResponse<Product[]>>("/api/products")
        ]);

        if (cancelled) {
          return;
        }

        setCustomers(customerResponse.data);
        setProducts(productResponse.data);

        if (mode === "edit" && id) {
          const challanResponse = await request<ApiResponse<Challan>>(`/api/challans/${id}`);
          if (!cancelled) {
            const draft = challanResponse.data;
            setChallan(draft);
            setCustomerId(draft.customerId);
            setItems(
              draft.items?.map((item) => ({ productId: item.productId, quantity: String(item.quantity) })) ?? []
            );
          }
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load challan form.");
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
  }, [id, mode, request]);

  const selectedProducts = useMemo(() => items.map((item) => products.find((product) => product.id === item.productId)).filter(Boolean) as Product[], [items, products]);
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalAmount = items.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + (product ? Number(product.unitPrice) * Number(item.quantity || 0) : 0);
  }, 0);

  const setItem = (index: number, value: Partial<ChallanItemDraft>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item)));
  };

  const addRow = () => setItems((current) => [...current, { productId: "", quantity: "1" }]);
  const removeRow = (index: number) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerId) {
      toast.error("Select a customer", "A challan needs a customer.");
      return;
    }

    if (items.some((item) => !item.productId || Number(item.quantity) <= 0)) {
      toast.error("Invalid challan items", "Each row must have a product and positive quantity.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        customerId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity)
        }))
      };

      if (mode === "edit" && id) {
        await request<ApiResponse<Challan>>(`/api/challans/${id}`, {
          method: "PUT",
          body: payload
        });
        toast.success("Draft updated", "The challan draft has been saved.");
      } else {
        await request<ApiResponse<Challan>>("/api/challans", {
          method: "POST",
          body: payload
        });
        toast.success("Draft saved", "The challan draft has been created.");
      }

      navigate("/challans");
    } catch (caughtError) {
      toast.error("Unable to save challan", caughtError instanceof Error ? caughtError.message : "Try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading challan form..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate(0)} />;
  }

  if (mode === "edit" && challan && challan.status !== "DRAFT") {
    return <EmptyState title="Challan locked" description="Only draft challans can be edited." action={<Link to={`/challans/${challan.id}`}><Button variant="secondary">View challan</Button></Link>} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={mode === "edit" ? "Edit Challan" : "Create Challan"}
        description="Build a draft challan before confirmation." 
        actions={canAccess(["ADMIN", "SALES"]) ? <Link to="/challans"><Button variant="secondary">Back to challans</Button></Link> : undefined}
      />

      <Card>
        <form className="form-grid challan-form" onSubmit={submit}>
          <label className="full-row">
            <span>Customer</span>
            <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.customerName}</option>
              ))}
            </Select>
          </label>

          <div className="full-row section-head inline">
            <h3>Items</h3>
            <Button type="button" variant="secondary" onClick={addRow}>Add Product</Button>
          </div>

          <div className="full-row items-stack">
            {items.map((item, index) => {
              const product = products.find((entry) => entry.id === item.productId);

              return (
                <Card className="item-row" key={`${index}-${item.productId}`}>
                  <div className="item-grid">
                    <label>
                      <span>Product</span>
                      <Select value={item.productId} onChange={(event) => setItem(index, { productId: event.target.value })}>
                        <option value="">Select product</option>
                        {products.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name} ({entry.sku})</option>
                        ))}
                      </Select>
                    </label>
                    <label>
                      <span>Quantity</span>
                      <Input type="number" min="1" value={item.quantity} onChange={(event) => setItem(index, { quantity: event.target.value })} />
                    </label>
                    <div className="item-meta">
                      <div><span>SKU</span><strong>{product?.sku ?? "-"}</strong></div>
                      <div><span>Available Stock</span><strong>{product?.currentStock ?? "-"}</strong></div>
                      <div><span>Unit Price</span><strong>{product ? formatCurrency(product.unitPrice) : "-"}</strong></div>
                      <div><span>Line Total</span><strong>{product ? formatCurrency(Number(product.unitPrice) * Number(item.quantity || 0)) : "-"}</strong></div>
                    </div>
                    <div className="item-actions">
                      <Button type="button" variant="ghost" onClick={() => removeRow(index)} disabled={items.length === 1}>Remove</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="summary-panel full-row">
            <div><span>Total Quantity</span><strong>{totalQuantity}</strong></div>
            <div><span>Total Amount</span><strong>{formatCurrency(totalAmount)}</strong></div>
            <div><span>Selected Products</span><strong>{selectedProducts.length}</strong></div>
          </Card>

          <div className="button-row right full-row">
            <Button type="button" variant="secondary" onClick={() => navigate("/challans")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Draft"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}