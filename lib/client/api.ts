"use client";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  walletAddress?: string,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (walletAddress) {
    headers.set("x-wallet-address", walletAddress);
  }

  const response = await fetch(path, {
    ...options,
    credentials: options.credentials ?? "same-origin",
    headers,
  });

  let payload: T & { error?: string };
  try {
    payload = (await response.json()) as T & { error?: string };
  } catch {
    throw new Error(response.ok ? "Invalid server response." : `Request failed (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}
