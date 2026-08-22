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
