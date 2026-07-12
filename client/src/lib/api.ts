const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      body.error ?? `Request failed with status ${res.status}`,
      res.status,
      body.details
    )
  }

  if (res.status === 204) {
    return null
  }

  return res.json()
}
