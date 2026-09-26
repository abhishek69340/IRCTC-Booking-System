# IRCTC BackEnd

## Version matrix
- Java: 17+
- Spring Boot: 4.1.0
- Maven: 3.9.16
- MySQL: 8.x recommended

## Run
1. Start MySQL.
2. The default connection is `root` / `tiger` and database `irctc`.
3. If your credentials differ, set `DB_USERNAME` and `DB_PASSWORD`.
4. Run `mvnw.cmd spring-boot:run` on Windows or `./mvnw spring-boot:run` on Linux/macOS.

The application creates/updates the `irctc` schema through Hibernate.

## Test
`mvnw.cmd test` (Windows) or `./mvnw test`.

Tests use an in-memory H2 database, so MySQL is not required for the test phase.

## API
- POST `/api/v1/tickets/book`
- GET `/api/v1/tickets/active`
- GET `/api/v1/tickets/history`
- GET `/api/v1/tickets/{pnr}`


# Razorpay TEST Payment Integration

The booking flow is now:

1. User selects From, To, train, date, time and passengers.
2. React calls `POST /api/v1/payments/order`.
3. Spring Boot calculates the fare and creates a Razorpay TEST order.
4. Razorpay TEST Checkout opens.
5. After successful payment, React sends the Razorpay response to `POST /api/v1/payments/verify`.
6. Spring Boot verifies the Razorpay signature and checks the server-side order amount.
7. Only after successful verification is the ticket stored in MySQL.

## Environment variables

Set these on the backend/Railway service:

```text
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

Do not put `RAZORPAY_KEY_SECRET` in the React frontend.

The uploaded `rzp-key.csv` contains test credentials. Use those values only as backend environment variables; do not commit the CSV or the secret to GitHub.

## Test fare model

Because the current UI has no travel-class, quota, concession, or exact railway-distance inputs, this project uses an IRCTC-style demo fare engine:

- selected route changes the fare;
- passenger count multiplies the route fare;
- ₹20 booking-level service fee is added;
- the final amount is converted to paise before creating the Razorpay order.

These fares are application/demo fares, not an official IRCTC fare quotation. For an exact official fare, the application would need the train, class, quota, passenger concessions and actual fare data.

## Railway deployment

Add the two Razorpay variables to the Railway backend service.

The React frontend does not need the secret. The backend returns only the public Razorpay test key ID when creating an order.
