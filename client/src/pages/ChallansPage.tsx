import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ApiResponse } from "../lib/responses";
import type { Challan } from "../lib/models";
import { challanTone, formatDate } from "../lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Pagination, Select, Table } from "../components/ui";
import { PageHeader } from "../components/layout";

export function ChallansPage() {
  const { request, canAccess } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [challans, setChallans] = useState<Challan[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | Challan["status"]>("");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await request<ApiResponse<Challan[]>>("/api/challans");
      setChallans(response.data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load challans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredChallans = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return challans.filter((challan) => {
      const matchesSearch = !lower || challan.challanNumber.toLowerCase().includes(lower) || challan.customer?.customerName.toLowerCase().includes(lower);
      const matchesStatus = !status || challan.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [challans, search, status]);

  const pagedChallans = filteredChallans.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredChallans.length / pageSize));

  if (loading) {
    return <LoadingState label="Loading challans..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Challans"
        description="Draft and confirmed challans with transaction-safe stock validation."
        actions={canAccess(["ADMIN", "SALES"]) ? <Link to="/challans/new"><Button>Create Challan</Button></Link> : undefined}
      />

      <Card>
        <div className="filter-row">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search challan or customer..." />
          <Select value={status} onChange={(event) => setStatus(event.target.value as Challan["status"] | "")}> 
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>

        <Table
          rows={pagedChallans}
          rowKey={(row) => row.id}
          emptyMessage="No challans found for the selected filters."
          columns={[
            { header: "Challan Number", cell: (row) => <Link to={`/challans/${row.id}`}>{row.challanNumber}</Link> },
            { header: "Customer", cell: (row) => row.customer?.customerName ?? "-" },
            { header: "Total Quantity", cell: (row) => row.totalQuantity },
            { header: "Status", cell: (row) => <Badge tone={challanTone(row.status)}>{row.status}</Badge> },
            { header: "Created By", cell: (row) => row.createdBy?.name ?? "-" },
            { header: "Created Date", cell: (row) => formatDate(row.createdAt) },
            {
              header: "Actions",
              cell: (row) => (
                <div className="row-actions">
                  <Button variant="ghost" onClick={() => navigate(`/challans/${row.id}`)}>View</Button>
                  {row.status === "DRAFT" && canAccess(["ADMIN", "SALES"]) ? <Button variant="ghost" onClick={() => navigate(`/challans/${row.id}/edit`)}>Edit</Button> : null}
                </div>
              )
            }
          ]}
        />

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </Card>
    </div>
  );
}