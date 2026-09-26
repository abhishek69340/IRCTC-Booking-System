# IRCTC Express - Local Run

## Backend
1. Open `IRCTC-BackEnd` in IntelliJ.
2. Ensure MySQL is running and database credentials match `application.properties`.
3. Put your Razorpay TEST credentials in `src/main/resources/application.properties`:
   - `razorpay.key-id=rzp_test_...`
   - `razorpay.key-secret=...`
4. Run `IrctcBackEndApplication`.
5. Backend runs at `http://localhost:8080`.

## Frontend
```cmd
cd IRCTC-FrontEnd
npm install
npm run dev
```
Open `http://localhost:5173`.

## Payment flow
React -> `/api/v1/payments/order` -> Razorpay TEST Checkout -> `/api/v1/payments/verify` -> MySQL ticket/PNR.

Never commit the Razorpay secret to GitHub. The distributed copy intentionally contains placeholders for the secret.
