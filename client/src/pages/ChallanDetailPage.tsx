import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { ApiResponse } from "../lib/responses";
import type { Challan } from "../lib/models";
import { challanTone, formatCurrency, formatDate } from "../lib/format";
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, LoadingState, Table } from "../components/ui";
import { PageHeader } from "../components/layout";

export function ChallanDetailPage() {
  const { id } = useParams();
  const { request, canAccess } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [challan, setChallan] = useState<Challan | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await request<ApiResponse<Challan>>(`/api/challans/${id}`);
        if (!cancelled) {
          setChallan(response.data);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load challan.");
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
  }, [id, request]);

  const refresh = async () => {
    if (!id) {
      return;
    }

    const response = await request<ApiResponse<Challan>>(`/api/challans/${id}`);
    setChallan(response.data);
  };

  const confirmChallan = async () => {
    if (!challan) {
      return;
    }

    setSubmitting(true);
    try {
      await request<ApiResponse<Challan>>(`/api/challans/${challan.id}/confirm`, { method: "POST" });
      toast.success("Challan confirmed", challan.challanNumber);
      setConfirmOpen(false);
      await refresh();
    } catch (caughtError) {
      toast.error("Confirmation failed", caughtError instanceof Error ? caughtError.message : "Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelChallan = async () => {
    if (!challan) {
      return;
    }

    setSubmitting(true);
    try {
      await request<ApiResponse<Challan>>(`/api/challans/${challan.id}/cancel`, { method: "POST" });
      toast.success("Challan cancelled", challan.challanNumber);
      setCancelOpen(false);
      await refresh();
    } catch (caughtError) {
      toast.error("Cancellation failed", caughtError instanceof Error ? caughtError.message : "Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading challan details..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate(0)} />;
  }

  if (!challan) {
    return <EmptyState title="Challan not found" description="The record could not be located." action={<Link to="/challans"><Button variant="secondary">Back to challans</Button></Link>} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={challan.challanNumber}
        description="Challan header, historical snapshots, and transaction state."
        actions={
          <>
            <Link to="/challans"><Button variant="secondary">Back</Button></Link>
            {challan.status === "DRAFT" && canAccess(["ADMIN", "SALES"]) ? <Link to={`/challans/${challan.id}/edit`}><Button variant="secondary">Edit Draft</Button></Link> : null}
            {challan.status === "DRAFT" && canAccess(["ADMIN", "SALES"]) ? <Button onClick={() => setConfirmOpen(true)}>Confirm Challan</Button> : null}
            {challan.status === "DRAFT" && canAccess(["ADMIN", "SALES"]) ? <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel Challan</Button> : null}
          </>
        }
      />

      <div className="detail-grid">
        <Card>
          <div className="section-head"><h3>Header</h3></div>
          <div className="detail-list">
            <div><span>Customer</span><strong>{challan.customer?.customerName ?? "-"}</strong></div>
            <div><span>Status</span><Badge tone={challanTone(challan.status)}>{challan.status}</Badge></div>
            <div><span>Created By</span><strong>{challan.createdBy?.name ?? "-"}</strong></div>
            <div><span>Created Date</span><strong>{formatDate(challan.createdAt)}</strong></div>
            <div><span>Total Quantity</span><strong>{challan.totalQuantity}</strong></div>
          </div>
        </Card>

        <Card>
          <div className="section-head"><h3>Items</h3></div>
          {challan.items && challan.items.length > 0 ? (
            <Table
              rows={challan.items}
              rowKey={(row) => row.id}
              columns={[
                { header: "Product Name Snapshot", cell: (row) => row.productNameSnapshot },
                { header: "SKU Snapshot", cell: (row) => row.skuSnapshot },
                { header: "Unit Price Snapshot", cell: (row) => formatCurrency(row.unitPriceSnapshot) },
                { header: "Quantity", cell: (row) => row.quantity },
                { header: "Line Total", cell: (row) => formatCurrency(Number(row.unitPriceSnapshot) * row.quantity) }
              ]}
            />
          ) : (
            <EmptyState title="No items found" description="This challan has no item rows." />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm challan"
        description="Stock will be reduced and OUT movements will be created."
        confirmLabel={submitting ? "Confirming..." : "Confirm"}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmChallan}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel challan"
        description="Only draft challans can be cancelled."
        confirmLabel={submitting ? "Cancelling..." : "Cancel challan"}
        tone="danger"
        onCancel={() => setCancelOpen(false)}
        onConfirm={cancelChallan}
      />
    </div>
  );
}