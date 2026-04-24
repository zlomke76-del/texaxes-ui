import { OPS_API_BASE } from "../constants";
import type {
  AvailabilityResponse,
  CreateBookingPayload,
  CreateBookingResponse,
  CreateTabResponse,
  ListOpenTabsResponse,
  TabDetailResponse,
  TabStatus,
  TodayResponse,
  WaiverCheckInPayload,
  WaiverCheckInResponse,
  WaiverSearchResponse,
} from "../types";

async function opsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  const hasBody = init?.body !== undefined && init?.body !== null;

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${OPS_API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(
      (json as { error?: string })?.error || `Request failed: ${res.status}`,
    );
  }

  return json as T;
}

export function getBookingsToday(date: string) {
  return opsFetch<TodayResponse>(
    `/api/admin/bookings-today?date=${encodeURIComponent(date)}`,
  );
}

export function getAvailability(date: string, throwers: number) {
  return opsFetch<AvailabilityResponse>(
    `/availability?date=${encodeURIComponent(date)}&throwers=${encodeURIComponent(
      String(throwers),
    )}`,
  );
}

export function getOpenTabs(status: TabStatus = "open", search?: string) {
  const params = new URLSearchParams({ status });
  if (search) params.set("search", search);

  return opsFetch<ListOpenTabsResponse>(
    `/api/admin/list-open-tabs?${params.toString()}`,
  );
}

export function updateBooking(
  booking_id: string,
  updates: Record<string, unknown>,
) {
  return opsFetch("/api/admin/update-booking", {
    method: "POST",
    body: JSON.stringify({
      booking_id,
      ...updates,
    }),
  });
}

export function createBooking(payload: CreateBookingPayload) {
  return opsFetch<CreateBookingResponse>("/api/admin/create-booking", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createTab(payload: Record<string, unknown>) {
  return opsFetch<CreateTabResponse>("/api/admin/create-tab", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTab(tabId: string) {
  return opsFetch<TabDetailResponse>(
    `/api/admin/get-tab?tab_id=${encodeURIComponent(tabId)}`,
  );
}

export function addLineItem(payload: Record<string, unknown>) {
  return opsFetch("/api/admin/add-line-item", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addPayment(payload: Record<string, unknown>) {
  return opsFetch("/api/admin/add-payment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTabStatus(payload: Record<string, unknown>) {
  return opsFetch("/api/admin/update-tab-status", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function voidLineItemRequest(payload: Record<string, unknown>) {
  return opsFetch("/api/admin/void-line-item", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function voidPaymentRequest(payload: Record<string, unknown>) {
  return opsFetch("/api/admin/void-payment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function searchWaivers(params: {
  q?: string;
  booking_id?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.booking_id) query.set("booking_id", params.booking_id);
  if (params.limit) query.set("limit", String(params.limit));

  return opsFetch<WaiverSearchResponse>(
    `/api/admin/waivers/search?${query.toString()}`,
  );
}

export function checkInWaiver(payload: WaiverCheckInPayload) {
  return opsFetch<WaiverCheckInResponse>("/api/admin/waivers/check-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
