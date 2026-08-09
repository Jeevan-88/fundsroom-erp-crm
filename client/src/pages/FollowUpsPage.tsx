import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ApiResponse } from "../lib/responses";
import type { Customer } from "../lib/models";
import { formatDate } from "../lib/format";
import { Badge, Card, EmptyState, ErrorState, LoadingState, Table } from "../components/ui";
import { PageHeader } from "../components/layout";

type FollowUpRow = {
  id: string;
  customerId: string;
  customerName: string;
  note: string;
  followUpDate: string;
  createdAt: string;
};

export function FollowUpsPage() {
  const { request } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<FollowUpRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const customerResponse = await request<ApiResponse<Customer[]>>("/api/customers");
        const details = await Promise.all(
          customerResponse.data.map(async (customer) => {
            const detailResponse = await request<ApiResponse<Customer>>(`/api/customers/${customer.id}`);
            return detailResponse.data;
          })
        );

        const followUpRows = details.flatMap((customer) =>
          (customer.followUps ?? []).map((followUp) => ({
            id: followUp.id,
            customerId: customer.id,
            customerName: customer.customerName,
            note: followUp.note,
            followUpDate: followUp.followUpDate,
            createdAt: followUp.createdAt
          }))
        ).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

        if (!cancelled) {
          setRows(followUpRows);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load follow-ups.");
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

  if (loading) {
    return <LoadingState label="Loading follow-ups..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="page-stack">
      <PageHeader title="Follow Ups" description="Latest CRM follow-up notes across customers." />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No follow-ups yet" description="Add follow-ups from customer detail pages." />
        ) : (
          <Table
            rows={rows}
            rowKey={(row) => row.id}
            columns={[
              { header: "Customer", cell: (row) => <Link to={`/customers/${row.customerId}`}>{row.customerName}</Link> },
              { header: "Note", cell: (row) => row.note },
              { header: "Follow-up", cell: (row) => formatDate(row.followUpDate) },
              { header: "Added", cell: (row) => formatDate(row.createdAt) }
            ]}
          />
        )}
      </Card>
    </div>
  );
}