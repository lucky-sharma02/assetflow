const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with status ${res.status}`)
  }

  if (res.status === 204) {
    return null
  }

  return res.json()
}
