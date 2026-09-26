# IRCTC Booking System - GitHub + Vercel + Railway

This repository contains both the React frontend and Spring Boot backend.

## Folder structure

- `IRCTC-FrontEnd` -> React/Vite application deployed on Vercel
- `IRCTC-BackEnd` -> Spring Boot application deployed on Railway

## 1. GitHub

Create/open one GitHub repository and upload the contents of this folder. Do not upload `.env` files, `node_modules`, `dist`, or real secrets.

## 2. Railway

Use the same GitHub repository for the existing Railway backend service.

Railway service settings:

- Root Directory: `/IRCTC-BackEnd`
- Build Command: `./mvnw clean package -DskipTests`
- Start Command: `java -jar target/IRCTC-BackEnd-0.0.1-SNAPSHOT.jar`

Add these Railway Variables:

- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLDATABASE`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `CORS_ALLOWED_ORIGINS`

`CORS_ALLOWED_ORIGINS` must contain the exact Vercel frontend origin, for example:

`https://your-project.vercel.app`

Do not put `RAZORPAY_KEY_SECRET` in the frontend or GitHub.

## 3. Vercel

Use the same GitHub repository for the existing Vercel frontend project.

Vercel Project Settings:

- Root Directory: `IRCTC-FrontEnd`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Add this Vercel Environment Variable:

`VITE_API_URL=https://YOUR-RAILWAY-DOMAIN`

Use the actual Railway public domain, without a trailing slash.

Redeploy Vercel after changing the variable.

## 4. Razorpay flow

The payment gateway is intentionally retained:

1. Frontend calls `/api/v1/payments/order`.
2. Backend creates the Razorpay order.
3. Razorpay Checkout opens in the browser.
4. Frontend sends the Razorpay payment details to `/api/v1/payments/verify`.
5. Backend verifies the Razorpay signature.
6. Backend saves the ticket after successful verification.

Use Razorpay TEST credentials while testing.

## 5. Important URLs

Frontend: `https://YOUR-VERCEL-DOMAIN`
Backend: `https://YOUR-RAILWAY-DOMAIN`

Do not use `localhost` in production environment variables.
