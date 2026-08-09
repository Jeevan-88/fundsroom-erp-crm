import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { ApiResponse } from "../lib/responses";
import type { Customer } from "../lib/models";
import { formatDate, customerStatusTone, customerTypeTone } from "../lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Modal, Select } from "../components/ui";
import { PageHeader } from "../components/layout";

export function CustomerDetailPage() {
  const { id } = useParams();
  const { request, canAccess } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await request<ApiResponse<Customer>>(`/api/customers/${id}`);
        if (!cancelled) {
          setCustomer(response.data);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load customer.");
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

  const submitFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customer) {
      return;
    }

    try {
      await request<ApiResponse<unknown>>(`/api/customers/${customer.id}/followups`, {
        method: "POST",
        body: {
          note: followUpNote,
          followUpDate: new Date(followUpDate).toISOString()
        }
      });
      toast.success("Follow-up added", customer.customerName);
      setFollowUpOpen(false);
      setFollowUpNote("");
      const refreshed = await request<ApiResponse<Customer>>(`/api/customers/${customer.id}`);
      setCustomer(refreshed.data);
    } catch (caughtError) {
      toast.error("Follow-up failed", caughtError instanceof Error ? caughtError.message : "Try again later.");
    }
  };

  if (loading) {
    return <LoadingState label="Loading customer profile..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate(0)} />;
  }

  if (!customer) {
    return <EmptyState title="Customer not found" description="The record could not be located." action={<Link to="/customers"><Button variant="secondary">Back to customers</Button></Link>} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={customer.customerName}
        description="Customer profile, notes, and follow-up history."
        actions={canAccess(["ADMIN", "SALES"]) ? <Button onClick={() => setFollowUpOpen(true)}>Add Follow-up</Button> : undefined}
      />

      <div className="detail-grid">
        <Card>
          <div className="section-head">
            <h3>Profile</h3>
          </div>
          <div className="detail-list">
            <div><span>Business</span><strong>{customer.businessName ?? "-"}</strong></div>
            <div><span>Mobile</span><strong>{customer.mobile}</strong></div>
            <div><span>Email</span><strong>{customer.email ?? "-"}</strong></div>
            <div><span>GST</span><strong>{customer.gstNumber ?? "-"}</strong></div>
            <div><span>Type</span><Badge tone={customerTypeTone(customer.customerType)}>{customer.customerType}</Badge></div>
            <div><span>Status</span><Badge tone={customerStatusTone(customer.status)}>{customer.status}</Badge></div>
            <div><span>Follow-up Date</span><strong>{customer.followUpDate ? formatDate(customer.followUpDate) : "-"}</strong></div>
            <div><span>Address</span><strong>{customer.address ?? "-"}</strong></div>
            <div className="full-row"><span>Notes</span><strong>{customer.notes ?? "-"}</strong></div>
          </div>
        </Card>

        <Card>
          <div className="section-head">
            <h3>Follow-up History</h3>
          </div>
          {customer.followUps && customer.followUps.length > 0 ? (
            <div className="timeline">
              {customer.followUps.map((followUp) => (
                <div key={followUp.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div>
                    <strong>{followUp.note}</strong>
                    <p className="muted-text">Due {formatDate(followUp.followUpDate)} · Added {formatDate(followUp.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No follow-ups yet" description="Create the first follow-up for this customer." />
          )}
        </Card>
      </div>

      <Modal open={followUpOpen} title="Add Follow-up" onClose={() => setFollowUpOpen(false)}>
        <form className="form-grid" onSubmit={submitFollowUp}>
          <label className="full-row"><span>Follow-up Note</span><Input value={followUpNote} onChange={(event) => setFollowUpNote(event.target.value)} required /></label>
          <label><span>Follow-up Date</span><Input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} required /></label>
          <div className="button-row right full-row">
            <Button type="button" variant="secondary" onClick={() => setFollowUpOpen(false)}>Cancel</Button>
            <Button type="submit">Save Follow-up</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}