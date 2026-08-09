import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`neu-card ${className}`.trim()}>{children}</section>;
}

export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  className = ""
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`neu-input ${props.className ?? ""}`.trim()} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`neu-input ${props.className ?? ""}`.trim()} />;
}

export function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} placeholder={props.placeholder ?? "Search..."} />;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  width = "720px"
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: string;
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="overlay" role="presentation" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: width }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function Drawer({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="overlay overlay-right" role="presentation" onClick={onClose}>
      <aside className="drawer-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close drawer">
            ×
          </button>
        </div>
        <div>{children}</div>
      </aside>
    </div>,
    document.body
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "primary";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function LoadingState({ label = "Loading data..." }: { label?: string }) {
  return (
    <div className="state state-loading">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <h3>{title}</h3>
      <p className="support-copy">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state state-error">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} width="520px">
      <p className="muted-text">{description}</p>
      <div className="button-row right">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Pagination({
  page,
  pageCount,
  onPageChange
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) {
    return null;
  }

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <div className="pagination">
      <Button variant="secondary" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <div className="pagination-pages">
        {pages.map((item) => (
          <button
            key={item}
            className={`pagination-page ${item === page ? "active" : ""}`.trim()}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <Button variant="secondary" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <Card className={`stat-card stat-${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {helper ? <div className="stat-helper">{helper}</div> : null}
    </Card>
  );
}

export function Table<T extends { id?: string }>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No records found."
}: {
  columns: Array<{ header: string; cell: (row: T) => ReactNode; width?: string }>;
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No data" description={emptyMessage} />;
  }

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} style={{ width: column.width }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.header}>{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ToastHost({
  toasts
}: {
  toasts: Array<{ id: string; title: string; description?: string; tone: "success" | "error" | "info" }>;
}) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          <strong>{toast.title}</strong>
          {toast.description ? <p>{toast.description}</p> : null}
        </div>
      ))}
    </div>
  );
}