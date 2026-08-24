import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Headphones,
  Home,
  Info,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Ticket,
  TrainFront,
  UserRound,
  Users,
  X,
  Plus,
  Minus,
  RotateCcw,
  Trash2,
  History,
  RefreshCw
} from 'lucide-react'

import {
  bookTicket,
  getActiveTickets,
  getHistoryTickets,
  getTicketByPnr,
  deleteTicket
} from './api'

import railwayLogo from './assets/railway-logo.png'

const stations = [
  'Bengaluru City',
  'Chennai Central',
  'New Delhi',
  'Mumbai Central',
  'Hyderabad Deccan',
  'Pune Junction',
  'Mysuru Junction',
  'Kochi',
  'Jaipur',
  'Manali',
  'Shimla',
  'Amritsar',
  'Goa',
  'Kolkata'
]

const emptyPassenger = {
  name: '',
  age: '',
  gender: 'Male',
  berthPreference: 'Lower'
}

/* =========================================================
   DATE / TIME HELPERS
========================================================= */

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

function formatTime(value) {
  if (!value) return '—'

  const [h, m] = value.split(':').map(Number)

  if (Number.isNaN(h) || Number.isNaN(m)) return '—'

  const date = new Date()
  date.setHours(h, m, 0, 0)

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/*
 * Creates the exact journey date/time.
 *
 * Example:
 * journeyDate  = 2026-08-24
 * departureTime = 05:34:00
 *
 * Result:
 * 24 Aug 2026 05:34
 */
function getJourneyDateTime(ticket) {
  if (!ticket?.journeyDate || !ticket?.departureTime) {
    return null
  }

  const dateTime = new Date(
      `${ticket.journeyDate}T${ticket.departureTime}`
  )

  if (Number.isNaN(dateTime.getTime())) {
    return null
  }

  return dateTime
}

/*
 * TRUE = journey has already started/passed.
 *
 * Once the journey date + departure time is over,
 * the ticket belongs to Ticket History.
 */
function isJourneyOver(ticket) {
  const journeyDateTime = getJourneyDateTime(ticket)

  if (!journeyDateTime) {
    return false
  }

  return journeyDateTime.getTime() <= Date.now()
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [view, setView] = useState('home')
  const [menu, setMenu] = useState(false)

  const [notice, setNotice] = useState(null)

  const [loading, setLoading] = useState(false)
  const [pnrLoading, setPnrLoading] = useState(false)

  const [active, setActive] = useState([])
  const [history, setHistory] = useState([])

  const [pnr, setPnr] = useState('')
  const [pnrResult, setPnrResult] = useState(null)

  const [form, setForm] = useState({
    trainNumber: '',
    from: '',
    to: '',
    journeyDate: '',
    departureTime: ''
  })

  const [passengers, setPassengers] = useState([
    { ...emptyPassenger }
  ])

  /*
   * IMPORTANT:
   *
   * Do NOT use .slice(0, 3)
   *
   * Your previous code had:
   *
   * [...active, ...history].slice(0, 3)
   *
   * which caused the home page to show only 3 tickets.
   *
   * Now ALL tickets are included.
   */
  const recent = useMemo(
      () => [...active, ...history],
      [active, history]
  )

  /* =======================================================
     LOAD TICKETS
  ======================================================= */

  useEffect(() => {
    loadTickets()
  }, [])

  /*
   * Re-check every 30 seconds.
   *
   * This means if a ticket's departure time passes while
   * the user is keeping the website open, it automatically
   * moves from My Journeys to Ticket History.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      classifyTickets()
    }, 30000)

    return () => clearInterval(timer)
  }, [active, history])

  /*
   * Load tickets from backend.
   *
   * We keep your existing API structure:
   * getActiveTickets()
   * getHistoryTickets()
   */
  async function loadTickets() {
    try {
      const [activeResponse, historyResponse] =
          await Promise.all([
            getActiveTickets(),
            getHistoryTickets()
          ])

      const activeTickets = Array.isArray(activeResponse)
          ? activeResponse
          : []

      const historyTickets = Array.isArray(historyResponse)
          ? historyResponse
          : []

      /*
       * Combine both backend responses first.
       *
       * This prevents tickets from disappearing if the backend
       * active/history filtering is slightly out of sync.
       */
      const ticketMap = new Map()

      ;[
        ...activeTickets,
        ...historyTickets
      ].forEach(ticket => {
        const key =
            ticket.ticketId ||
            ticket.pnrNumber

        if (key != null) {
          ticketMap.set(String(key), ticket)
        }
      })

      const allTickets = Array.from(ticketMap.values())

      /*
       * Frontend decides the current category based on
       * journey date + departure time.
       */
      const activeTicketsFinal = allTickets.filter(
          ticket => !isJourneyOver(ticket)
      )

      const historyTicketsFinal = allTickets.filter(
          ticket => isJourneyOver(ticket)
      )

      /*
       * Sort:
       * Active -> nearest upcoming journey first
       * History -> newest completed journey first
       */
      activeTicketsFinal.sort(
          (a, b) =>
              getJourneyDateTime(a)?.getTime() -
              getJourneyDateTime(b)?.getTime()
      )

      historyTicketsFinal.sort(
          (a, b) =>
              getJourneyDateTime(b)?.getTime() -
              getJourneyDateTime(a)?.getTime()
      )

      setActive(activeTicketsFinal)
      setHistory(historyTicketsFinal)

    } catch (e) {
      setNotice({
        type: 'error',
        text:
            e.message ||
            'Unable to load journeys.'
      })
    }
  }

  /*
   * Reclassify currently loaded tickets.
   */
  function classifyTickets() {
    const allTickets = [
      ...active,
      ...history
    ]

    const ticketMap = new Map()

    allTickets.forEach(ticket => {
      const key =
          ticket.ticketId ||
          ticket.pnrNumber

      if (key != null) {
        ticketMap.set(String(key), ticket)
      }
    })

    const uniqueTickets =
        Array.from(ticketMap.values())

    const activeTickets =
        uniqueTickets.filter(
            ticket => !isJourneyOver(ticket)
        )

    const historyTickets =
        uniqueTickets.filter(
            ticket => isJourneyOver(ticket)
        )

    activeTickets.sort(
        (a, b) =>
            getJourneyDateTime(a)?.getTime() -
            getJourneyDateTime(b)?.getTime()
    )

    historyTickets.sort(
        (a, b) =>
            getJourneyDateTime(b)?.getTime() -
            getJourneyDateTime(a)?.getTime()
    )

    setActive(activeTickets)
    setHistory(historyTickets)
  }

  /* =======================================================
     FORM HELPERS
  ======================================================= */

  function updateForm(key, value) {
    setForm(previous => ({
      ...previous,
      [key]: value
    }))
  }

  function updatePassenger(index, key, value) {
    setPassengers(previous =>
        previous.map((passenger, passengerIndex) =>
            passengerIndex === index
                ? {
                  ...passenger,
                  [key]: value
                }
                : passenger
        )
    )
  }

  function addPassenger() {
    if (passengers.length < 6) {
      setPassengers(previous => [
        ...previous,
        { ...emptyPassenger }
      ])
    }
  }

  function removePassenger(index) {
    if (passengers.length > 1) {
      setPassengers(previous =>
          previous.filter(
              (_, passengerIndex) =>
                  passengerIndex !== index
          )
      )
    }
  }

  function swap() {
    setForm(previous => ({
      ...previous,
      from: previous.to,
      to: previous.from
    }))
  }

  function go(nextView) {
    setView(nextView)
    setMenu(false)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  /* =======================================================
     BOOK TICKET
  ======================================================= */

  async function submitBooking(event) {
    event.preventDefault()
    setNotice(null)

    if (!form.from || !form.to) {
      return setNotice({
        type: 'error',
        text:
            'Please select both From and To stations.'
      })
    }

    if (form.from === form.to) {
      return setNotice({
        type: 'error',
        text:
            'From and To stations must be different.'
      })
    }

    if (
        !form.trainNumber ||
        !form.journeyDate ||
        !form.departureTime
    ) {
      return setNotice({
        type: 'error',
        text:
            'Please complete train number, date and departure time.'
      })
    }

    if (
        passengers.some(
            passenger =>
                !passenger.name.trim() ||
                !passenger.age
        )
    ) {
      return setNotice({
        type: 'error',
        text:
            'Please complete every passenger name and age.'
      })
    }

    /*
     * Prevent booking in the past.
     */
    const selectedJourney = new Date(
        `${form.journeyDate}T${form.departureTime}`
    )

    if (
        !Number.isNaN(selectedJourney.getTime()) &&
        selectedJourney.getTime() <= Date.now()
    ) {
      return setNotice({
        type: 'error',
        text:
            'Journey date and departure time must be in the future.'
      })
    }

    setLoading(true)

    try {
      const result = await bookTicket({
        trainNumber:
            form.trainNumber.trim(),

        from: form.from,

        to: form.to,

        journeyDate:
        form.journeyDate,

        departureTime:
        form.departureTime,

        passengers:
            passengers.map(passenger => ({
              ...passenger,
              name: passenger.name.trim(),
              age: Number(passenger.age)
            }))
      })

      setPnrResult(result)

      setNotice({
        type: 'success',
        text:
            `Ticket booked successfully! PNR: ${result.pnrNumber}`
      })

      /*
       * Clear booking form.
       */
      setForm({
        trainNumber: '',
        from: '',
        to: '',
        journeyDate: '',
        departureTime: ''
      })

      setPassengers([
        { ...emptyPassenger }
      ])

      setPnr('')

      /*
       * Reload database tickets.
       */
      await loadTickets()

    } catch (e) {
      setNotice({
        type: 'error',
        text:
            e.message ||
            'Booking failed.'
      })
    } finally {
      setLoading(false)
    }
  }

  /* =======================================================
     PNR SEARCH
  ======================================================= */

  async function searchPnr(event) {
    event.preventDefault()

    const value = pnr.trim()

    if (!/^\d{10}$/.test(value)) {
      return setNotice({
        type: 'error',
        text:
            'PNR must be exactly 10 digits.'
      })
    }

    setPnrLoading(true)
    setNotice(null)

    try {
      const result =
          await getTicketByPnr(value)

      setPnrResult(result)

      setNotice({
        type: 'success',
        text:
            `PNR ${value} found successfully.`
      })

    } catch (e) {
      setPnrResult(null)

      setNotice({
        type: 'error',
        text:
            e.message ||
            'PNR lookup failed.'
      })
    } finally {
      setPnrLoading(false)
    }
  }

  /* =======================================================
     DELETE TICKET
  ======================================================= */

  async function handleDeleteTicket(ticket) {
    if (!ticket?.ticketId) {
      setNotice({
        type: 'error',
        text:
            'Ticket ID is missing. Cannot delete this ticket.'
      })

      return
    }

    const confirmed = window.confirm(
        `Delete ticket ${ticket.pnrNumber}?\n\n` +
        `This will permanently remove the ticket from the database.`
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteTicket(ticket.ticketId)

      /*
       * Remove from active UI immediately.
       */
      setActive(previous =>
          previous.filter(
              item =>
                  item.ticketId !== ticket.ticketId
          )
      )

      /*
       * Remove from history UI immediately.
       */
      setHistory(previous =>
          previous.filter(
              item =>
                  item.ticketId !== ticket.ticketId
          )
      )

      /*
       * If this ticket is currently displayed
       * as a PNR result, remove it too.
       */
      if (
          pnrResult?.ticketId ===
          ticket.ticketId
      ) {
        setPnrResult(null)
      }

      setNotice({
        type: 'success',
        text:
            `Ticket ${ticket.pnrNumber} deleted successfully.`
      })

    } catch (e) {
      setNotice({
        type: 'error',
        text:
            e.message ||
            'Unable to delete ticket.'
      })
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
      <div className="app-shell">

        <div
            className="background-image"
            aria-hidden="true"
        />

        <div
            className="background-shade"
            aria-hidden="true"
        />

        {/* ===================================================
          HEADER
      =================================================== */}

        <header className="topbar">

          <button
              className="brand"
              onClick={() => go('home')}
          >
          <span className="railway-emblem">
            <img
                src={railwayLogo}
                alt="Indian Railways Logo"
            />
          </span>

            <span>
            <strong>
              IRCTC <b>EXPRESS</b>
            </strong>

            <small>
              INDIAN RAILWAYS
            </small>
          </span>
          </button>

          <button
              className="mobile-menu"
              onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>

          <nav
              className={
                menu
                    ? 'nav open'
                    : 'nav'
              }
          >

            <button
                className={
                  view === 'home'
                      ? 'active'
                      : ''
                }
                onClick={() => go('home')}
            >
              <Home />
              Home
            </button>

            <button
                className={
                  view === 'book'
                      ? 'active'
                      : ''
                }
                onClick={() => go('book')}
            >
              <Ticket />
              Book Ticket
            </button>

            <button
                className={
                  view === 'active'
                      ? 'active'
                      : ''
                }
                onClick={() => go('active')}
            >
              <TrainFront />
              My Journeys
            </button>

            {/* ===============================================
              NEW TICKET HISTORY NAVIGATION
          =============================================== */}

            <button
                className={
                  view === 'history'
                      ? 'active'
                      : ''
                }
                onClick={() => go('history')}
            >
              <History />
              Ticket History
            </button>

            <button
                className={
                  view === 'pnr'
                      ? 'active'
                      : ''
                }
                onClick={() => go('pnr')}
            >
              <Search />
              PNR Status
            </button>

            <button
                onClick={() =>
                    setNotice({
                      type: 'info',
                      text:
                          'Railway enquiry: 139'
                    })
                }
            >
              <Headphones />
              Helpline
            </button>

          </nav>

          <button
              className="login"
              onClick={() =>
                  setNotice({
                    type: 'info',
                    text:
                        'Login / Sign Up can be connected when authentication is added.'
                  })
              }
          >
            <UserRound />
            Login / Sign Up
          </button>

        </header>

        {/* ===================================================
          TOAST
      =================================================== */}

        {notice && (
            <div
                className={`toast ${notice.type}`}
            >

          <span>
            {
              notice.type === 'success'
                  ? <BadgeCheck />
                  : notice.type === 'error'
                      ? <X />
                      : <Info />
            }
          </span>

              <span>
            {notice.text}
          </span>

              <button
                  onClick={() =>
                      setNotice(null)
                  }
              >
                <X />
              </button>

            </div>
        )}

        {/* ===================================================
          MAIN
      =================================================== */}

        <main className="content">

          {/* =================================================
            HOME
        ================================================= */}

          {view === 'home' && (
              <>
                <section className="hero">

                  <div className="hero-copy">

                    <div className="eyebrow">
                      INDIA'S JOURNEY, REIMAGINED
                    </div>

                    <h1>
                      Travel smarter.
                      <br />
                      <span>
                    Journey
                  </span>{' '}
                      with confidence.
                    </h1>

                    <div className="accent-line" />

                    <p>
                      Book train tickets, check PNR status,
                      <br />
                      and manage your journeys —
                      all in one place.
                    </p>

                  </div>

                  <div className="home-grid">

                    <BookingCard
                        form={form}
                        updateForm={updateForm}
                        passengers={passengers}
                        updatePassenger={updatePassenger}
                        addPassenger={addPassenger}
                        removePassenger={removePassenger}
                        swap={swap}
                        submit={submitBooking}
                        loading={loading}
                    />

                    <PnrCard
                        pnr={pnr}
                        setPnr={setPnr}
                        search={searchPnr}
                        loading={pnrLoading}
                    />

                  </div>

                </section>

                <section className="dashboard">

                  <BenefitsCard />

                  <ActiveCard
                      tickets={active}
                      go={go}
                  />

                  <RecentCard
                      recent={recent}
                      go={go}
                  />

                </section>

                {pnrResult && (
                    <section className="result-wrap">

                      <div className="section-title">
                  <span>
                    PNR RESULT
                  </span>

                        <h2>
                          Journey details
                        </h2>
                      </div>

                      <TicketCard
                          ticket={pnrResult}
                          onDelete={handleDeleteTicket}
                      />

                    </section>
                )}

              </>
          )}

          {/* =================================================
            BOOK
        ================================================= */}

          {view === 'book' && (
              <Page
                  title="Book your ticket"
                  eyebrow="RESERVATION"
                  subtitle="Choose your route, journey time and passengers."
              >

                <BookingCard
                    form={form}
                    updateForm={updateForm}
                    passengers={passengers}
                    updatePassenger={updatePassenger}
                    addPassenger={addPassenger}
                    removePassenger={removePassenger}
                    swap={swap}
                    submit={submitBooking}
                    loading={loading}
                    wide
                />

                {pnrResult && (
                    <TicketCard
                        ticket={pnrResult}
                        onDelete={handleDeleteTicket}
                    />
                )}

              </Page>
          )}

          {/* =================================================
            MY JOURNEYS
        ================================================= */}

          {view === 'active' && (
              <Page
                  title="My Journeys"
                  eyebrow="MY JOURNEYS"
                  subtitle="Your upcoming booked tickets."
              >

                <div className="ticket-page-toolbar">

                  <div>
                    <strong>
                      {active.length}
                    </strong>

                    <span>
                  Upcoming Ticket
                      {active.length === 1
                          ? ''
                          : 's'}
                </span>
                  </div>

                  <button
                      className="refresh-button"
                      onClick={loadTickets}
                  >
                    <RefreshCw size={17} />
                    Refresh
                  </button>

                </div>

                <div className="ticket-list">

                  {active.length ? (
                      active.map(ticket => (
                          <TicketCard
                              key={
                                  ticket.ticketId ||
                                  ticket.pnrNumber
                              }
                              ticket={ticket}
                              onDelete={handleDeleteTicket}
                          />
                      ))
                  ) : (
                      <Empty
                          text="No active tickets found."
                      />
                  )}

                </div>

              </Page>
          )}

          {/* =================================================
            TICKET HISTORY
        ================================================= */}

          {view === 'history' && (
              <Page
                  title="Ticket History"
                  eyebrow="TICKET HISTORY"
                  subtitle="Your completed journey records."
              >

                <div className="ticket-page-toolbar">

                  <div>
                    <strong>
                      {history.length}
                    </strong>

                    <span>
                  Completed Ticket
                      {history.length === 1
                          ? ''
                          : 's'}
                </span>
                  </div>

                  <button
                      className="refresh-button"
                      onClick={loadTickets}
                  >
                    <RefreshCw size={17} />
                    Refresh
                  </button>

                </div>

                <div className="ticket-list">

                  {history.length ? (
                      history.map(ticket => (
                          <TicketCard
                              key={
                                  ticket.ticketId ||
                                  ticket.pnrNumber
                              }
                              ticket={ticket}
                              onDelete={handleDeleteTicket}
                              history
                          />
                      ))
                  ) : (
                      <Empty
                          text="No history tickets found."
                      />
                  )}

                </div>

              </Page>
          )}

          {/* =================================================
            PNR
        ================================================= */}

          {view === 'pnr' && (
              <Page
                  title="Check PNR status"
                  eyebrow="LIVE LOOKUP"
                  subtitle="Enter the 10-digit PNR from your ticket."
              >

                <PnrCard
                    pnr={pnr}
                    setPnr={setPnr}
                    search={searchPnr}
                    loading={pnrLoading}
                    large
                />

                {pnrResult && (
                    <TicketCard
                        ticket={pnrResult}
                        onDelete={handleDeleteTicket}
                    />
                )}

              </Page>
          )}

        </main>

        {/* ===================================================
          FOOTER
      =================================================== */}

        <footer className="footer">

          <Stats />

          <div className="footer-bottom">

          <span>
            © 2026 IRCTC Express · Indian Railways
          </span>

            <span>
            About Us · Terms & Conditions ·
            Privacy Policy · Contact Us
          </span>

          </div>

        </footer>

      </div>
  )
}

/* =========================================================
   BOOKING CARD
========================================================= */

function BookingCard({
                       form,
                       updateForm,
                       passengers,
                       updatePassenger,
                       addPassenger,
                       removePassenger,
                       swap,
                       submit,
                       loading,
                       wide = false
                     }) {

  return (
      <form
          className={`booking glass ${
              wide ? 'wide' : ''
          }`}
          onSubmit={submit}
      >

        <div className="card-title">

        <span className="icon orange">
          <TrainFront />
        </span>

          <div>
            <small>
              RESERVATION
            </small>

            <h3>
              Book your ticket
            </h3>
          </div>

        </div>

        <div className="route-fields">

          <Field
              label="From"
              icon={<MapPin />}
          >
            <select
                value={form.from}
                onChange={e =>
                    updateForm(
                        'from',
                        e.target.value
                    )
                }
            >
              <option value="">
                Select origin
              </option>

              {stations.map(station => (
                  <option
                      key={station}
                      value={station}
                  >
                    {station}
                  </option>
              ))}

            </select>
          </Field>

          <button
              type="button"
              className="swap"
              onClick={swap}
              title="Swap stations"
          >
            <ArrowLeftRight />
          </button>

          <Field
              label="To"
              icon={<MapPin />}
          >
            <select
                value={form.to}
                onChange={e =>
                    updateForm(
                        'to',
                        e.target.value
                    )
                }
            >
              <option value="">
                Select destination
              </option>

              {stations.map(station => (
                  <option
                      key={station}
                      value={station}
                  >
                    {station}
                  </option>
              ))}

            </select>
          </Field>

        </div>

        <div className="three-fields">

          <Field
              label="Train Number"
              icon={<TrainFront />}
          >
            <input
                value={form.trainNumber}
                onChange={e =>
                    updateForm(
                        'trainNumber',
                        e.target.value
                    )
                }
                placeholder="e.g. 12626"
            />
          </Field>

          <Field
              label="Journey Date"
              icon={<CalendarDays />}
          >
            <input
                type="date"
                value={form.journeyDate}
                min={
                  new Date()
                      .toISOString()
                      .split('T')[0]
                }
                onChange={e =>
                    updateForm(
                        'journeyDate',
                        e.target.value
                    )
                }
            />
          </Field>

          <Field
              label="Departure Time"
              icon={<Clock3 />}
          >
            <input
                type="time"
                value={form.departureTime}
                onChange={e =>
                    updateForm(
                        'departureTime',
                        e.target.value
                    )
                }
            />
          </Field>

        </div>

        <div className="passenger-head">

        <span>
          <Users />
          PASSENGERS
        </span>

          <button
              type="button"
              onClick={addPassenger}
              disabled={passengers.length >= 6}
          >
            <Plus />
            Add Passenger
          </button>

        </div>

        <div className="passengers">

          {passengers.map(
              (passenger, index) => (

                  <div
                      className="passenger"
                      key={index}
                  >

              <span className="passenger-no">
                {index + 1}
              </span>

                    <input
                        placeholder="Full Name"
                        value={passenger.name}
                        onChange={e =>
                            updatePassenger(
                                index,
                                'name',
                                e.target.value
                            )
                        }
                    />

                    <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="Age"
                        value={passenger.age}
                        onChange={e =>
                            updatePassenger(
                                index,
                                'age',
                                e.target.value
                            )
                        }
                    />

                    <select
                        value={passenger.gender}
                        onChange={e =>
                            updatePassenger(
                                index,
                                'gender',
                                e.target.value
                            )
                        }
                    >
                      <option>
                        Male
                      </option>

                      <option>
                        Female
                      </option>

                      <option>
                        Other
                      </option>

                    </select>

                    <select
                        value={
                          passenger.berthPreference
                        }
                        onChange={e =>
                            updatePassenger(
                                index,
                                'berthPreference',
                                e.target.value
                            )
                        }
                    >
                      <option>
                        Lower
                      </option>

                      <option>
                        Middle
                      </option>

                      <option>
                        Upper
                      </option>

                      <option>
                        Side Lower
                      </option>

                      <option>
                        Side Upper
                      </option>

                    </select>

                    {passengers.length > 1 && (
                        <button
                            type="button"
                            className="remove"
                            onClick={() =>
                                removePassenger(index)
                            }
                            title="Remove passenger"
                        >
                          <Minus />
                        </button>
                    )}

                  </div>

              )
          )}

        </div>

        <button
            className="search-trains"
            disabled={loading}
        >
          {loading ? (
              <>
                <span className="spinner" />
                Booking...
              </>
          ) : (
              <>
                Book Train
                <ArrowRight />
              </>
          )}
        </button>

      </form>
  )
}

/* =========================================================
   FIELD
========================================================= */

function Field({
                 label,
                 icon,
                 children
               }) {
  return (
      <label className="field">

      <span>
        {icon}
        {label}
      </span>

        {children}

      </label>
  )
}

/* =========================================================
   PNR CARD
========================================================= */

function PnrCard({
                   pnr,
                   setPnr,
                   search,
                   loading,
                   large = false
                 }) {

  return (
      <aside
          className={`pnr glass ${
              large ? 'large' : ''
          }`}
      >

        <div className="card-title">

        <span className="icon orange">
          <Search />
        </span>

          <div>

            <small>
              LIVE LOOKUP
            </small>

            <h3>
              Check PNR status
            </h3>

          </div>

        </div>

        <form
            onSubmit={search}
            className="pnr-form"
        >

          <input
              value={pnr}
              onChange={e =>
                  setPnr(
                      e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 10)
                  )
              }
              placeholder="Enter 10 digit PNR"
              inputMode="numeric"
          />

          <button disabled={loading}>
            {loading
                ? 'Checking'
                : 'Check Status'}
          </button>

        </form>

        <div className="pnr-points">

          <Point
              c="orange"
              icon={<RotateCcw />}
          >
            Get instant PNR status
          </Point>

          <Point
              c="blue"
              icon={<Ticket />}
          >
            View journey details
          </Point>

          <Point
              c="green"
              icon={<CheckCircle2 />}
          >
            Check seat & ticket info
          </Point>

          <Point
              c="purple"
              icon={<TrainFront />}
          >
            Live train running status
          </Point>

        </div>

      </aside>
  )
}

/* =========================================================
   POINT
========================================================= */

function Point({
                 c,
                 icon,
                 children
               }) {
  return (
      <div>

      <span
          className={`point ${c}`}
      >
        {icon}
      </span>

        {children}

      </div>
  )
}

/* =========================================================
   BENEFITS
========================================================= */

function BenefitsCard() {
  return (
      <article className="benefits glass">

        <div className="mini-title">
          <ShieldCheck />
          WHY BOOK WITH IRCTC?
        </div>

        <div className="benefits-grid">

          <Benefit
              icon="⚙"
              text="Official partner of Indian Railways"
          />

          <Benefit
              icon="♧"
              text="Secure & easy booking"
          />

          <Benefit
              icon="▤"
              text="Multiple payment options"
          />

          <Benefit
              icon="♧"
              text="24x7 customer support"
          />

          <Benefit
              icon="✣"
              text="Trusted by millions of travelers"
          />

        </div>

      </article>
  )
}

function Benefit({
                   icon,
                   text
                 }) {
  return (
      <div>
        <b>{icon}</b>
        <span>{text}</span>
      </div>
  )
}

/* =========================================================
   ACTIVE CARD
========================================================= */

function ActiveCard({
                      tickets,
                      go
                    }) {

  const ticket = tickets[0]

  return (
      <article className="active-card glass">

        <div className="mini-title">

          <TrainFront />

          ACTIVE JOURNEYS

          <button
              onClick={() => go('active')}
          >
            View All
          </button>

        </div>

        {ticket ? (
            <TicketCard
                ticket={ticket}
                compact
            />
        ) : (
            <Empty
                text="No active tickets found."
            />
        )}

      </article>
  )
}

/* =========================================================
   RECENT BOOKINGS
========================================================= */

function RecentCard({
                      recent,
                      go
                    }) {

  return (
      <article className="recent-card glass">

        <div className="mini-title">

          <Ticket />

          RECENT BOOKINGS

          <button
              onClick={() => go('history')}
          >
            View All
          </button>

        </div>

        {recent.length ? (

            <div className="recent-list">

              {recent.map(ticket => (

                  <div
                      className="recent-row"
                      key={
                          ticket.ticketId ||
                          ticket.pnrNumber
                      }
                  >

                    <div>

                      <strong>
                        {ticket.pnrNumber}
                      </strong>

                      <span>
                  {ticket.trainNumber}
                        {' · '}
                        {ticket.fromStation ||
                            'Origin'}
                        {' → '}
                        {ticket.toStation ||
                            'Destination'}
                </span>

                      <small>
                        {formatDate(
                            ticket.journeyDate
                        )}
                        {' · '}
                        {formatTime(
                            ticket.departureTime
                        )}
                      </small>

                    </div>

                    <em
                        className={
                          isJourneyOver(ticket)
                              ? 'history-status'
                              : 'ok'
                        }
                    >
                      {isJourneyOver(ticket)
                          ? 'HISTORY'
                          : ticket.status ||
                          'BOOKED'}
                    </em>

                  </div>

              ))}

            </div>

        ) : (
            <Empty
                text="No recent bookings."
            />
        )}

      </article>
  )
}

/* =========================================================
   STATS
========================================================= */

function Stats() {
  return (
      <div className="stats">

        <div>
          <TrainFront />
          <strong>
            15000+
          </strong>
          <span>
          Daily Trains
        </span>
        </div>

        <div>
          <Users />
          <strong>
            500000+
          </strong>
          <span>
          Happy Customers
        </span>
        </div>

        <div>
          <ShieldCheck />
          <strong>
            100%
          </strong>
          <span>
          Secure Booking
        </span>
        </div>

        <div>
          <Headphones />
          <strong>
            24×7
          </strong>
          <span>
          Customer Support
        </span>
        </div>

        <blockquote>
          “The journey is the reward.”
          <small>
            — Indian Railways
          </small>
        </blockquote>

      </div>
  )
}

/* =========================================================
   TICKET CARD
========================================================= */

function TicketCard({
                      ticket,
                      onDelete,
                      compact = false,
                      history = false
                    }) {

  const passengersList =
      ticket?.passengers || []

  return (
      <article
          className={`journey-card glass ${
              compact
                  ? 'compact-ticket'
                  : ''
          } ${
              history
                  ? 'history-ticket'
                  : ''
          }`}
      >

        {/* ===============================================
          TOP
      =============================================== */}

        <div className="journey-top">

          <div>

            <small>
              PNR
            </small>

            <strong className="pnr-green">
              {ticket.pnrNumber}
            </strong>

          </div>

          <div className="ticket-actions">

            <em className="confirmed">

              <CheckCircle2 />

              {history ||
              isJourneyOver(ticket)
                  ? 'COMPLETED'
                  : ticket.status ||
                  'BOOKED'}

            </em>

            {!compact &&
                onDelete &&
                ticket.ticketId && (
                    <button
                        type="button"
                        className="delete-ticket"
                        onClick={() =>
                            onDelete(ticket)
                        }
                        title="Delete ticket"
                    >
                      <Trash2
                          size={17}
                      />

                      Delete Ticket
                    </button>
                )}

          </div>

        </div>

        {/* ===============================================
          ROUTE
      =============================================== */}

        <div className="route-summary">

          <div>

            <strong>
              {ticket.fromStation ||
                  'Origin'}
            </strong>

            <small>
              Departure
            </small>

          </div>

          <div className="route-mid">

          <span>
            {ticket.trainNumber}
          </span>

            <i />

            <span>
            TRAIN
          </span>

          </div>

          <div className="right">

            <strong>
              {ticket.toStation ||
                  'Destination'}
            </strong>

            <small>
              Arrival
            </small>

          </div>

        </div>

        {/* ===============================================
          META
      =============================================== */}

        <div className="meta">

          <div>

            <CalendarDays />

            <strong>
              {formatDate(
                  ticket.journeyDate
              )}
            </strong>

            <small>
              Journey
            </small>

          </div>

          <div>

            <Clock3 />

            <strong>
              {formatTime(
                  ticket.departureTime
              )}
            </strong>

            <small>
              Departure
            </small>

          </div>

          <div>

            <Ticket />

            <strong>
              {ticket.trainNumber}
            </strong>

            <small>
              Train
            </small>

          </div>

          <div>

            <Users />

            <strong>
              {passengersList.length}
            </strong>

            <small>
              Passengers
            </small>

          </div>

        </div>

        {/* ===============================================
          PASSENGERS
      =============================================== */}

        {passengersList.length > 0 && (

            <div className="passenger-names">

              <Users />

              <span>

            <strong>
              Passengers:
            </strong>

                {passengersList.map(
                    (passenger, index) => (
                        <span
                            key={
                                passenger.passengerId ||
                                index
                            }
                        >
                  {passenger.name}

                          {index <
                          passengersList.length - 1
                              ? ', '
                              : ''}
                </span>
                    )
                )}

          </span>

            </div>

        )}

        {/* ===============================================
          HISTORY LABEL
      =============================================== */}

        {(history ||
            isJourneyOver(ticket)) && (

            <div className="completed-banner">

              <History size={17} />

              Journey completed —
              moved to Ticket History

            </div>

        )}

      </article>
  )
}

/* =========================================================
   EMPTY
========================================================= */

function Empty({
                 text
               }) {
  return (
      <div className="empty">

        <Info />

        {text}

      </div>
  )
}

/* =========================================================
   PAGE
========================================================= */

function Page({
                eyebrow,
                title,
                subtitle,
                children
              }) {

  return (
      <section className="page">

        <div className="page-head">

        <span>
          {eyebrow}
        </span>

          <h2>
            {title}
          </h2>

          <p>
            {subtitle}
          </p>

        </div>

        {children}

      </section>
  )
}

export default App