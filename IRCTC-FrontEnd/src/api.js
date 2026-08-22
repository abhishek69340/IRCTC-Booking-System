const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://irctc-booking-system-production.up.railway.app/api/v1/tickets'

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === 'string' && data) ||
      `Request failed (${response.status})`
    throw new Error(message)
  }

  return data
}

export function bookTicket(payload) {
  return request(`${API_BASE}/book`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function getActiveTickets() {
  return request(`${API_BASE}/active`)
}

export function getHistoryTickets() {
  return request(`${API_BASE}/history`)
}

export function getTicketByPnr(pnr) {
  return request(`${API_BASE}/${encodeURIComponent(pnr)}`)
}
