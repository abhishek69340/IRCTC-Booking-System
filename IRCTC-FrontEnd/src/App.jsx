import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight, ArrowRight, BadgeCheck, CalendarDays, CheckCircle2, ChevronDown,
  Clock3, Headphones, Home, Info, MapPin, Menu, Search, ShieldCheck, Sparkles,
  Ticket, TrainFront, UserRound, Users, X, Plus, Minus, RotateCcw
} from 'lucide-react'
import { bookTicket, getActiveTickets, getHistoryTickets, getTicketByPnr } from './api'
import railwayLogo from './assets/railway-logo.png';

const stations = [
  'Bengaluru City', 'Chennai Central', 'New Delhi', 'Mumbai Central',
  'Hyderabad Deccan', 'Pune Junction', 'Mysuru Junction', 'Kochi',
  'Jaipur', 'Manali', 'Shimla', 'Amritsar', 'Goa', 'Kolkata'
]
const emptyPassenger = { name: '', age: '', gender: 'Male', berthPreference: 'Lower' }

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`))
}
function formatTime(value) {
  if (!value) return '—'
  const [h, m] = value.split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0, 0)
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(d)
}

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
  const [form, setForm] = useState({ trainNumber: '', from: '', to: '', journeyDate: '', departureTime: '' })
  const [passengers, setPassengers] = useState([{ ...emptyPassenger }])
  const recent = useMemo(() => [...active, ...history].slice(0, 3), [active, history])

  useEffect(() => { loadTickets() }, [])
  async function loadTickets() {
    try {
      const [a, h] = await Promise.all([getActiveTickets(), getHistoryTickets()])
      setActive(Array.isArray(a) ? a : []); setHistory(Array.isArray(h) ? h : [])
    } catch (e) { setNotice({ type: 'error', text: e.message || 'Unable to load journeys.' }) }
  }
  function updateForm(key, value) { setForm(p => ({ ...p, [key]: value })) }
  function updatePassenger(i, key, value) { setPassengers(p => p.map((x, n) => n === i ? { ...x, [key]: value } : x)) }
  function addPassenger() { if (passengers.length < 6) setPassengers(p => [...p, { ...emptyPassenger }]) }
  function removePassenger(i) { if (passengers.length > 1) setPassengers(p => p.filter((_, n) => n !== i)) }
  function swap() { setForm(p => ({ ...p, from: p.to, to: p.from })) }
  function go(next) { setView(next); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  async function submitBooking(e) {
    e.preventDefault(); setNotice(null)
    if (!form.from || !form.to) return setNotice({ type: 'error', text: 'Please select both From and To stations.' })
    if (form.from === form.to) return setNotice({ type: 'error', text: 'From and To stations must be different.' })
    if (!form.trainNumber || !form.journeyDate || !form.departureTime) return setNotice({ type: 'error', text: 'Please complete train number, date and departure time.' })
    if (passengers.some(p => !p.name.trim() || !p.age)) return setNotice({ type: 'error', text: 'Please complete every passenger name and age.' })
    setLoading(true)
    try {
      const result = await bookTicket({
        trainNumber: form.trainNumber.trim(), from: form.from, to: form.to,
        journeyDate: form.journeyDate, departureTime: form.departureTime,
        passengers: passengers.map(p => ({ ...p, name: p.name.trim(), age: Number(p.age) }))
      })
      setPnrResult(result)
      setNotice({ type: 'success', text: `Ticket booked successfully! PNR: ${result.pnrNumber}` })

      // Clear every booking/PNR input after a successful booking.
      // Keep the booked ticket in pnrResult so the confirmation can still be shown.
      setForm({ trainNumber: '', from: '', to: '', journeyDate: '', departureTime: '' })
      setPassengers([{ ...emptyPassenger }])
      setPnr('')

      await loadTickets()
    } catch (e) { setNotice({ type: 'error', text: e.message || 'Booking failed.' }) }
    finally { setLoading(false) }
  }
  async function searchPnr(e) {
    e.preventDefault(); const value = pnr.trim()
    if (!/^\d{10}$/.test(value)) return setNotice({ type: 'error', text: 'PNR must be exactly 10 digits.' })
    setPnrLoading(true); setNotice(null)
    try { setPnrResult(await getTicketByPnr(value)); setNotice({ type: 'success', text: `PNR ${value} found successfully.` }) }
    catch (e) { setPnrResult(null); setNotice({ type: 'error', text: e.message || 'PNR lookup failed.' }) }
    finally { setPnrLoading(false) }
  }

  return <div className="app-shell">
    <div className="background-image" aria-hidden="true" />
    <div className="background-shade" aria-hidden="true" />
    <header className="topbar">
      <button className="brand" onClick={() => go('home')}>
        <span className="railway-emblem"><img src={railwayLogo} alt="Indian Railways Logo" /></span>
        <span><strong>IRCTC <b>EXPRESS</b></strong><small>INDIAN RAILWAYS</small></span>
      </button>
      <button className="mobile-menu" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
      <nav className={menu ? 'nav open' : 'nav'}>
        <button className={view === 'home' ? 'active' : ''} onClick={() => go('home')}><Home/> Home</button>
        <button className={view === 'book' ? 'active' : ''} onClick={() => go('book')}><Ticket/> Book Ticket</button>
        <button className={view === 'active' ? 'active' : ''} onClick={() => go('active')}><TrainFront/> My Journeys</button>
        <button className={view === 'pnr' ? 'active' : ''} onClick={() => go('pnr')}><Search/> PNR Status</button>
        <button onClick={() => setNotice({ type: 'info', text: 'Railway enquiry: 139' })}><Headphones/> Helpline</button>
      </nav>
      <button className="login" onClick={() => setNotice({ type: 'info', text: 'Login / Sign Up can be connected when authentication is added.' })}><UserRound/> Login / Sign Up</button>
    </header>

    {notice && <div className={`toast ${notice.type}`}><span>{notice.type === 'success' ? <BadgeCheck/> : notice.type === 'error' ? <X/> : <Info/>}</span><span>{notice.text}</span><button onClick={() => setNotice(null)}><X/></button></div>}

    <main className="content">
      {view === 'home' && <>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles/> INDIA'S JOURNEY, REIMAGINED</div>
            <h1>Travel smarter.<br/><span>Journey</span> with confidence.</h1>
            <div className="accent-line" />
            <p>Book train tickets, check PNR status,<br/>and manage your journeys — all in one place.</p>
          </div>
          <div className="home-grid">
            <BookingCard form={form} updateForm={updateForm} passengers={passengers} updatePassenger={updatePassenger} addPassenger={addPassenger} removePassenger={removePassenger} swap={swap} submit={submitBooking} loading={loading}/>
            <PnrCard pnr={pnr} setPnr={setPnr} search={searchPnr} loading={pnrLoading}/>
          </div>
        </section>
        <section className="dashboard">
          <BenefitsCard/>
          <ActiveCard tickets={active} go={go}/>
          <RecentCard recent={recent} go={go}/>
        </section>
        <Stats/>
        {pnrResult && <section className="result-wrap"><div className="section-title"><span>PNR RESULT</span><h2>Journey details</h2></div><TicketCard ticket={pnrResult}/></section>}
      </>}

      {view === 'book' && <Page title="Book your ticket" eyebrow="RESERVATION" subtitle="Choose your route, journey time and passengers."><BookingCard form={form} updateForm={updateForm} passengers={passengers} updatePassenger={updatePassenger} addPassenger={addPassenger} removePassenger={removePassenger} swap={swap} submit={submitBooking} loading={loading} wide/>{pnrResult && <TicketCard ticket={pnrResult}/>}</Page>}
      {view === 'active' && <Page title="Active journeys" eyebrow="MY JOURNEYS" subtitle="Your upcoming booked tickets."><div className="ticket-list">{active.length ? active.map(t => <TicketCard key={t.ticketId || t.pnrNumber} ticket={t}/>) : <Empty text="No active tickets found."/>}</div></Page>}
      {view === 'history' && <Page title="Booking history" eyebrow="MY JOURNEYS" subtitle="Your completed journey records."><div className="ticket-list">{history.length ? history.map(t => <TicketCard key={t.ticketId || t.pnrNumber} ticket={t}/>) : <Empty text="No history tickets found."/>}</div></Page>}
      {view === 'pnr' && <Page title="Check PNR status" eyebrow="LIVE LOOKUP" subtitle="Enter the 10-digit PNR from your ticket."><PnrCard pnr={pnr} setPnr={setPnr} search={searchPnr} loading={pnrLoading} large/>{pnrResult && <TicketCard ticket={pnrResult}/>}</Page>}
    </main>
    <footer className="footer"><Stats/><div className="footer-bottom"><span>© 2026 IRCTC Express · Indian Railways</span><span>About Us · Terms & Conditions · Privacy Policy · Contact Us</span></div></footer>
  </div>
}

function BookingCard({ form, updateForm, passengers, updatePassenger, addPassenger, removePassenger, swap, submit, loading, wide=false }) {
  return <form className={`booking glass ${wide ? 'wide' : ''}`} onSubmit={submit}>
    <div className="card-title"><span className="icon orange"><TrainFront/></span><div><small>RESERVATION</small><h3>Book your ticket</h3></div></div>
    <div className="route-fields">
      <Field label="From" icon={<MapPin/>}><select value={form.from} onChange={e=>updateForm('from',e.target.value)}><option value="">Select origin</option>{stations.map(s=><option key={s}>{s}</option>)}</select></Field>
      <button type="button" className="swap" onClick={swap}><ArrowLeftRight/></button>
      <Field label="To" icon={<MapPin/>}><select value={form.to} onChange={e=>updateForm('to',e.target.value)}><option value="">Select destination</option>{stations.map(s=><option key={s}>{s}</option>)}</select></Field>
    </div>
    <div className="three-fields">
      <Field label="Train Number" icon={<TrainFront/>}><input value={form.trainNumber} onChange={e=>updateForm('trainNumber',e.target.value)} placeholder="e.g. 12626"/></Field>
      <Field label="Journey Date" icon={<CalendarDays/>}><input type="date" value={form.journeyDate} onChange={e=>updateForm('journeyDate',e.target.value)}/></Field>
      <Field label="Departure Time" icon={<Clock3/>}><input type="time" value={form.departureTime} onChange={e=>updateForm('departureTime',e.target.value)}/></Field>
    </div>
    <div className="passenger-head"><span><Users/> PASSENGERS</span><button type="button" onClick={addPassenger}><Plus/> Add Passenger</button></div>
    <div className="passengers">{passengers.map((p,i)=><div className="passenger" key={i}><span className="passenger-no">{i+1}</span><input placeholder="Full Name" value={p.name} onChange={e=>updatePassenger(i,'name',e.target.value)}/><input type="number" min="1" max="120" placeholder="Age" value={p.age} onChange={e=>updatePassenger(i,'age',e.target.value)}/><select value={p.gender} onChange={e=>updatePassenger(i,'gender',e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select><select value={p.berthPreference} onChange={e=>updatePassenger(i,'berthPreference',e.target.value)}><option>Lower</option><option>Middle</option><option>Upper</option><option>Side Lower</option><option>Side Upper</option></select>{passengers.length>1 && <button type="button" className="remove" onClick={()=>removePassenger(i)}><Minus/></button>}</div>)}</div>
    <button className="search-trains" disabled={loading}>{loading ? <><span className="spinner"/> Booking...</> : <>Book Train <ArrowRight/></>}</button>
  </form>
}
function Field({label,icon,children}) { return <label className="field"><span>{icon}{label}</span>{children}</label> }
function PnrCard({pnr,setPnr,search,loading,large=false}) { return <aside className={`pnr glass ${large?'large':''}`}><div className="card-title"><span className="icon orange"><Search/></span><div><small>LIVE LOOKUP</small><h3>Check PNR status</h3></div></div><form onSubmit={search} className="pnr-form"><input value={pnr} onChange={e=>setPnr(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Enter 10 digit PNR" inputMode="numeric"/><button disabled={loading}>{loading?'Checking':'Check Status'}</button></form><div className="pnr-points"><Point c="orange" icon={<RotateCcw/>}>Get instant PNR status</Point><Point c="blue" icon={<Ticket/>}>View journey details</Point><Point c="green" icon={<CheckCircle2/>}>Check seat & ticket info</Point><Point c="purple" icon={<TrainFront/>}>Live train running status</Point></div></aside> }
function Point({c,icon,children}) { return <div><span className={`point ${c}`}>{icon}</span>{children}</div> }
function BenefitsCard(){ return <article className="benefits glass"><div className="mini-title"><ShieldCheck/> WHY BOOK WITH IRCTC?</div><div className="benefits-grid"><Benefit icon="⚙" text="Official partner of Indian Railways"/><Benefit icon="♧" text="Secure & easy booking"/><Benefit icon="▤" text="Multiple payment options"/><Benefit icon="♧" text="24x7 customer support"/><Benefit icon="✣" text="Trusted by millions of travelers"/></div></article> }
function Benefit({icon,text}) { return <div><b>{icon}</b><span>{text}</span></div> }
function ActiveCard({tickets,go}){ const t=tickets[0]; return <article className="active-card glass"><div className="mini-title"><TrainFront/> ACTIVE JOURNEYS <button onClick={()=>go('active')}>View All</button></div>{t?<TicketCard ticket={t} compact/>:<Empty text="No active tickets found."/>}</article> }
function RecentCard({recent,go}){ return <article className="recent-card glass"><div className="mini-title"><Ticket/> RECENT BOOKINGS <button onClick={()=>go('history')}>View All</button></div>{recent.length?recent.map(t=><div className="recent-row" key={t.ticketId||t.pnrNumber}><div><strong>{t.pnrNumber}</strong><span>{t.trainNumber} · {t.fromStation||'Origin'} → {t.toStation||'Destination'}</span><small>{formatDate(t.journeyDate)} · {formatTime(t.departureTime)}</small></div><em className={t.status?.toLowerCase()==='booked'?'ok':'bad'}>{t.status||'BOOKED'}</em></div>):<Empty text="No recent bookings."/>}</article> }
function Stats(){ return <div className="stats"><div><TrainFront/><strong>15000+</strong><span>Daily Trains</span></div><div><Users/><strong>500000+</strong><span>Happy Customers</span></div><div><ShieldCheck/><strong>100%</strong><span>Secure Booking</span></div><div><Headphones/><strong>24×7</strong><span>Customer Support</span></div><blockquote>“The journey is the reward.” <small>— Indian Railways</small></blockquote></div> }
function TicketCard({ticket}){ const ps=ticket.passengers||[]; return <article className="journey-card glass"><div className="journey-top"><div><small>PNR</small><strong className="pnr-green">{ticket.pnrNumber}</strong></div><em className="confirmed"><CheckCircle2/> {ticket.status||'BOOKED'}</em></div><div className="route-summary"><div><strong>{ticket.fromStation||'Origin'}</strong><small>Departure</small></div><div className="route-mid"><span>{ticket.trainNumber}</span><i></i><span>TRAIN</span></div><div className="right"><strong>{ticket.toStation||'Destination'}</strong><small>Arrival</small></div></div><div className="meta"><div><CalendarDays/><strong>{formatDate(ticket.journeyDate)}</strong><small>Journey</small></div><div><Clock3/><strong>{formatTime(ticket.departureTime)}</strong><small>Departure</small></div><div><Ticket/><strong>{ticket.trainNumber}</strong><small>Train</small></div><div><Users/><strong>{ps.length}</strong><small>Passengers</small></div></div></article> }
function Empty({text}){ return <div className="empty"><Info/> {text}</div> }
function Page({eyebrow,title,subtitle,children}){ return <section className="page"><div className="page-head"><span>{eyebrow}</span><h2>{title}</h2><p>{subtitle}</p></div>{children}</section> }

export default App
