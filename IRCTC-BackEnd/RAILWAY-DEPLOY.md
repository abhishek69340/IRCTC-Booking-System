# IRCTC Backend - Railway Deployment

This backend is configured for Railway and keeps the Razorpay TEST payment flow.

## 1. Deploy the backend folder

Upload/connect this folder to Railway:

`IRCTC-BackEnd`

Railway will use `railway.toml`:

- Build: `./mvnw clean package -DskipTests`
- Start: `java -jar target/IRCTC-BackEnd-0.0.1-SNAPSHOT.jar`

The Maven wrapper is executable for Linux/Railway.

## 2. Add a Railway MySQL service

Create a MySQL service in the same Railway project and make sure these variables are available to the backend service:

- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLDATABASE`
- `MYSQLUSER`
- `MYSQLPASSWORD`

The backend reads these variables directly. Do not put Railway database credentials in source code.

## 3. Add Razorpay TEST variables

In the backend service Variables tab add:

- `RAZORPAY_KEY_ID` = your Razorpay TEST key ID
- `RAZORPAY_KEY_SECRET` = your Razorpay TEST secret

The secret stays on the backend. The frontend receives only the public `keyId` returned by `/api/v1/payments/order`.

## 4. Configure CORS

Set:

`CORS_ALLOWED_ORIGINS=https://your-frontend.netlify.app`

If more than one frontend is used, separate origins with commas:

`https://your-frontend.netlify.app,https://your-frontend.vercel.app`

## 5. Frontend

In the React/Vite frontend hosting service, set:

`VITE_API_URL=https://YOUR-RAILWAY-BACKEND.up.railway.app`

Then redeploy the frontend.

## 6. Payment flow retained

The existing payment flow remains:

1. React calls `POST /api/v1/payments/order`.
2. Spring Boot calculates the fare.
3. Spring Boot creates a Razorpay TEST order.
4. Razorpay Checkout opens in React.
5. React sends the Razorpay payment details to `POST /api/v1/payments/verify`.
6. Spring Boot fetches the Razorpay order from Razorpay.
7. Spring Boot checks amount and currency.
8. Spring Boot verifies the HMAC signature using `RAZORPAY_KEY_SECRET`.
9. Only after successful verification is the railway ticket saved to MySQL.

## 7. Important security note

Never commit a real Razorpay secret to GitHub. If a secret was previously committed or shared publicly, rotate/regenerate it in Razorpay and update `RAZORPAY_KEY_SECRET` in Railway.
