# IRCTC Booking System — Localhost Setup

## 1. MySQL

Install/start MySQL and make sure the MySQL server is running.

This project is configured for:

```text
Host: localhost
Port: 3306
Database: irctc
Username: root
Password: tiger
```

You do NOT need to manually create the `irctc` database because the JDBC URL contains:

```text
createDatabaseIfNotExist=true
```

Spring Boot/Hibernate will create/update the tables when the application starts.

If your MySQL root password is not `tiger`, change:

```properties
spring.datasource.password=tiger
```

in:

```text
IRCTC-BackEnd/src/main/resources/application.properties
```

---

## 2. Razorpay TEST credentials

The project uses Razorpay TEST mode.

Set these two environment variables in IntelliJ:

```text
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

Use the TEST credentials from your Razorpay account / supplied key file.

### IntelliJ

Go to:

```text
Run
→ Edit Configurations
→ IRCTC BackEnd
→ Environment variables
```

Add:

```text
RAZORPAY_KEY_ID=your_test_key
RAZORPAY_KEY_SECRET=your_test_secret
```

Do NOT put `RAZORPAY_KEY_SECRET` in React.

---

## 3. Start Spring Boot

Open:

```text
IRCTC-BackEnd
```

Run the Spring Boot main application.

Expected backend URL:

```text
http://localhost:8080
```

If your application is configured for another port, update the React API URL accordingly.

---

## 4. Start React

Open another terminal:

```bash
cd IRCTC-FrontEnd
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 5. Booking + payment flow

The application now follows:

```text
Search/select journey
        ↓
Enter passenger details
        ↓
Pay & Book Ticket
        ↓
Spring Boot calculates route fare
        ↓
Spring Boot creates Razorpay TEST order
        ↓
Razorpay TEST Checkout opens
        ↓
Complete TEST payment
        ↓
React sends Razorpay payment details
        ↓
Spring Boot verifies signature + amount
        ↓
Ticket is saved to MySQL
        ↓
PNR is returned
```

A ticket is NOT created just because the user clicked the booking button. The backend creates the ticket only after successful Razorpay signature and amount verification.

---

## 6. Fare calculation

The application uses route-dependent demo fares and passenger count.

Example:

```text
Bengaluru City → Chennai Central
₹430 per passenger

2 passengers:
₹860 base fare
+ ₹20 booking service fee
= ₹880 total
```

Different From/To selections produce different amounts.

Important: these are demo/IRCTC-style application fares. They are NOT live official IRCTC fare quotes. Exact official railway pricing depends on train, class, quota, concessions, distance, railway charges and other factors.

---

## 7. Important files changed

### Backend

```text
Dto/PaymentOrderResponseDTO.java
Dto/PaymentVerificationRequestDTO.java
IrctcService/FareService.java
IrctcService/RazorpayService.java
Controller/PaymentController.java
Entity/Ticket.java
application.properties
```

### Frontend

```text
src/api.js
src/App.jsx
src/styles.css
index.html
```

---

## 8. Do not upload secrets

Do NOT commit:

```text
rzp-key.csv
```

to GitHub.

Do NOT put the Razorpay secret in:

```text
React
Vite
.env exposed to frontend
```

Only the Razorpay TEST key ID is returned to the browser. The secret remains in Spring Boot.

