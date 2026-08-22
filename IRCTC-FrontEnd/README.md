# IRCTC Express Frontend

React + Vite frontend for the IRCTC Spring Boot backend.

## Run
1. Install Node.js 20.19+ or 22.12+.
2. `npm install`
3. `npm run dev`

Frontend: http://localhost:5173
Backend expected: http://localhost:8080

Optional `.env`:
`VITE_API_BASE_URL=http://localhost:8080/api/v1/tickets`

The UI includes From/To station booking fields, PNR search, Active journeys and History, and uses the supplied/generated orange-train visual as its background.
