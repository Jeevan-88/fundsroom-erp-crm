import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { ApiResponse } from "../lib/responses";
import type { Customer, CustomerStatus, CustomerType } from "../lib/models";
import { customerStatusTone, customerTypeTone, formatDate } from "../lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Modal, Pagination, Select, Table } from "../components/ui";
import { PageHeader } from "../components/layout";

type CustomerFormState = {
  customerName: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  notes: string;
};

const emptyCustomerForm: CustomerFormState = {
  customerName: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
  notes: ""
};

export function CustomersPage() {
  const { request, canAccess } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | CustomerStatus>("");
  const [customerType, setCustomerType] = useState<"" | CustomerType>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm);

  const pageSize = 8;

  const loadCustomers = async () => {
    setLoading(true);
    setError("");

    const query = new URLSearchParams();

    if (search.trim()) {
      query.set("search", search.trim());
    }

    if (status) {
      query.set("status", status);
    }

    if (customerType) {
      query.set("customerType", customerType);
    }

    try {
      const response = await request<ApiResponse<Customer[]>>(`/api/customers?${query.toString()}`);
      setCustomers(response.data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCustomers();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [search, status, customerType]);

  const pagedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return customers.slice(start, start + pageSize);
  }, [customers, page]);

  const pageCount = Math.max(1, Math.ceil(customers.length / pageSize));

  const openCreate = () => {
    setEditingCustomer(null);
    setForm(emptyCustomerForm);
    setModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      customerName: customer.customerName,
      mobile: customer.mobile,
      email: customer.email ?? "",
      businessName: customer.businessName ?? "",
      gstNumber: customer.gstNumber ?? "",
      customerType: customer.customerType,
      address: customer.address ?? "",
      status: customer.status,
      notes: customer.notes ?? ""
    });
    setModalOpen(true);
  };

  const submitCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      customerName: form.customerName,
      mobile: form.mobile,
      email: form.email || undefined,
      businessName: form.businessName || undefined,
      gstNumber: form.gstNumber || undefined,
      customerType: form.customerType,
      address: form.address || undefined,
      status: form.status,
      notes: form.notes || undefined
    };

    try {
      if (editingCustomer) {
        await request<ApiResponse<Customer>>(`/api/customers/${editingCustomer.id}`, {
          method: "PUT",
          body: payload
        });
        toast.success("Customer updated", payload.customerName);
      } else {
        await request<ApiResponse<Customer>>("/api/customers", {
          method: "POST",
          body: payload
        });
        toast.success("Customer created", payload.customerName);
      }

      setModalOpen(false);
      await loadCustomers();
    } catch (caughtError) {
      toast.error("Customer save failed", caughtError instanceof Error ? caughtError.message : "Try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading customers..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadCustomers} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Customers"
        description="Manage customer records, filters, and follow-up preparation."
        actions={canAccess(["ADMIN", "SALES"]) ? <Button onClick={openCreate}>Add Customer</Button> : undefined}
      />

      <Card>
        <div className="filter-row">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers..." />
          <Select value={status} onChange={(event) => setStatus(event.target.value as CustomerStatus | "")}> 
            <option value="">All statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Select value={customerType} onChange={(event) => setCustomerType(event.target.value as CustomerType | "")}> 
            <option value="">All types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </Select>
        </div>

        <Table
          rows={pagedCustomers}
          rowKey={(row) => row.id}
          emptyMessage="No customers match your current filters."
          columns={[
            { header: "Name", cell: (row) => <Link to={`/customers/${row.id}`}>{row.customerName}</Link> },
            { header: "Business", cell: (row) => row.businessName ?? "-" },
            { header: "Mobile", cell: (row) => row.mobile },
            { header: "Type", cell: (row) => <Badge tone={customerTypeTone(row.customerType)}>{row.customerType}</Badge> },
            { header: "Status", cell: (row) => <Badge tone={customerStatusTone(row.status)}>{row.status}</Badge> },
            { header: "Follow-up", cell: (row) => row.followUpDate ? formatDate(row.followUpDate) : "-" },
            {
              header: "Actions",
              cell: (row) => (
                <div className="row-actions">
                  <Button variant="ghost" onClick={() => navigate(`/customers/${row.id}`)}>View</Button>
                  {canAccess(["ADMIN", "SALES"]) ? <Button variant="ghost" onClick={() => openEdit(row)}>Edit</Button> : null}
                </div>
              )
            }
          ]}
        />

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </Card>

      <Modal
        open={modalOpen}
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={submitCustomer}>
          <label><span>Customer Name</span><Input required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></label>
          <label><span>Mobile</span><Input required value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></label>
          <label><span>Email</span><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label><span>Business Name</span><Input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></label>
          <label><span>GST Number</span><Input value={form.gstNumber} onChange={(event) => setForm({ ...form, gstNumber: event.target.value })} /></label>
          <label><span>Customer Type</span><Select value={form.customerType} onChange={(event) => setForm({ ...form, customerType: event.target.value as CustomerType })}><option value="RETAIL">Retail</option><option value="WHOLESALE">Wholesale</option><option value="DISTRIBUTOR">Distributor</option></Select></label>
          <label><span>Status</span><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CustomerStatus })}><option value="LEAD">Lead</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></label>
          <label className="full-row"><span>Address</span><Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
          <label className="full-row"><span>Notes</span><Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          <div className="button-row right full-row">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Customer"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}