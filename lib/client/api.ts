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
    headers,
  });

  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}
