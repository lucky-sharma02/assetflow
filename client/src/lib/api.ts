export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

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
  // FormData bodies (file uploads) must NOT get a manual Content-Type —
  // the browser sets multipart/form-data with the correct boundary itself
  // only when the header is left unset.
  const isFormData = init?.body instanceof FormData
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
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
