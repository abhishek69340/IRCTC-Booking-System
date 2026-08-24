const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    'https://irctc-booking-system-production.up.railway.app'

async function request(
    endpoint,
    options = {}
) {
    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        }
    )

    const contentType =
        response.headers.get('content-type') || ''

    const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text()

    if (!response.ok) {
        const message =
            typeof data === 'string'
                ? data
                : data?.message ||
                data?.error ||
                `Request failed with status ${response.status}`

        throw new Error(message)
    }

    return data
}

/* =========================================================
   BOOK TICKET
========================================================= */

export async function bookTicket(ticketData) {
    return request(
        '/api/v1/tickets',
        {
            method: 'POST',
            body: JSON.stringify(ticketData)
        }
    )
}

/* =========================================================
   ACTIVE TICKETS
========================================================= */

export async function getActiveTickets() {
    return request(
        '/api/v1/tickets/active',
        {
            method: 'GET'
        }
    )
}

/* =========================================================
   HISTORY TICKETS
========================================================= */

export async function getHistoryTickets() {
    return request(
        '/api/v1/tickets/history',
        {
            method: 'GET'
        }
    )
}

/* =========================================================
   PNR
========================================================= */

export async function getTicketByPnr(pnr) {
    return request(
        `/api/v1/tickets/pnr/${encodeURIComponent(pnr)}`,
        {
            method: 'GET'
        }
    )
}

/* =========================================================
   DELETE TICKET
========================================================= */

export async function deleteTicket(ticketId) {
    return request(
        `/api/v1/tickets/${ticketId}`,
        {
            method: 'DELETE'
        }
    )
}