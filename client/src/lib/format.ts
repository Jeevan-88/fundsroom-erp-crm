import type { ChallanStatus, CustomerStatus, CustomerType, Product, StockMovementType, UserRole } from "./models";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short"
});

export function formatCurrency(value: string | number) {
  return currencyFormatter.format(Number(value));
}

export function formatDate(value: string | number | Date) {
  return dateFormatter.format(new Date(value));
}

export function stockStatus(product: Product) {
  if (product.currentStock <= 0) {
    return "OUT OF STOCK";
  }

  if (product.currentStock <= product.minimumStock) {
    return "LOW STOCK";
  }

  return "IN STOCK";
}

export function stockTone(product: Product) {
  if (product.currentStock <= 0) {
    return "danger" as const;
  }

  if (product.currentStock <= product.minimumStock) {
    return "warning" as const;
  }

  return "success" as const;
}

export function movementTone(type: StockMovementType) {
  return type === "IN" ? "success" : "danger";
}

export function challanTone(status: ChallanStatus) {
  if (status === "CONFIRMED") {
    return "success" as const;
  }

  if (status === "CANCELLED") {
    return "danger" as const;
  }

  return "info" as const;
}

export function customerStatusTone(status: CustomerStatus) {
  if (status === "ACTIVE") {
    return "success" as const;
  }

  if (status === "INACTIVE") {
    return "danger" as const;
  }

  return "warning" as const;
}

export function customerTypeTone(type: CustomerType) {
  if (type === "WHOLESALE") {
    return "primary" as const;
  }

  if (type === "DISTRIBUTOR") {
    return "info" as const;
  }

  return "neutral" as const;
}

export function roleLabel(role?: UserRole) {
  return role ?? "Unknown";
}