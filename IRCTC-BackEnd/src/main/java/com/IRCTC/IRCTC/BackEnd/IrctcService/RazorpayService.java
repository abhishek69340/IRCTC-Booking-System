package com.IRCTC.IRCTC.BackEnd.IrctcService;

import com.IRCTC.IRCTC.BackEnd.Dto.BookingRequestDTO;
import com.IRCTC.IRCTC.BackEnd.Dto.PaymentOrderResponseDTO;
import com.IRCTC.IRCTC.BackEnd.Dto.PaymentVerificationRequestDTO;
import com.IRCTC.IRCTC.BackEnd.Entity.Ticket;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final ObjectMapper objectMapper;

    private final TicketService ticketService;

    private final FareService fareService;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    private final HttpClient httpClient =
            HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

    public PaymentOrderResponseDTO createOrder(
            BookingRequestDTO request
    ) {

        validateBookingRequest(request);

        int passengerCount =
                request.getPassengers().size();

        long farePerPassenger =
                fareService.calculateFarePerPassenger(
                        request.getFrom(),
                        request.getTo()
                );

        long baseFare =
                fareService.calculateBaseFare(
                        request.getFrom(),
                        request.getTo(),
                        passengerCount
                );

        long serviceFee =
                fareService.calculateServiceFee(
                        passengerCount
                );

        long totalFare =
                baseFare + serviceFee;

        /*
         * Razorpay expects the amount in the smallest
         * currency unit. For INR, this is paise.
         */
        long amountInPaise =
                totalFare * 100L;

        String receipt =
                "IRCTC-" + System.currentTimeMillis();

        String payload =
                "{"
                        + "\"amount\":" + amountInPaise + ","
                        + "\"currency\":\"INR\","
                        + "\"receipt\":\"" + receipt + "\","
                        + "\"notes\":{"
                        + "\"from\":\""
                        + escapeJson(request.getFrom())
                        + "\","
                        + "\"to\":\""
                        + escapeJson(request.getTo())
                        + "\","
                        + "\"passengers\":\""
                        + passengerCount
                        + "\""
                        + "}"
                        + "}";

        try {

            JsonNode order =
                    razorpayRequest(
                            "POST",
                            "/v1/orders",
                            payload
                    );

            return PaymentOrderResponseDTO.builder()
                    .orderId(
                            order.path("id").asText()
                    )
                    .keyId(keyId)
                    .amount(amountInPaise)
                    .currency("INR")
                    .passengerCount(passengerCount)
                    .farePerPassenger(farePerPassenger)
                    .baseFare(baseFare)
                    .serviceFee(serviceFee)
                    .totalFare(totalFare)
                    .build();

        } catch (Exception e) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to create Razorpay test order: "
                            + e.getMessage()
            );
        }
    }

    public Ticket verifyAndBook(
            PaymentVerificationRequestDTO request
    ) {

        validateVerificationRequest(request);

        long expectedFare =
                fareService.calculateBaseFare(
                        request.getFrom(),
                        request.getTo(),
                        request.getPassengers().size()
                );

        long expectedTotal =
                expectedFare
                        + fareService.calculateServiceFee(
                        request.getPassengers().size()
                );

        try {

            /*
             * Razorpay's order is fetched from the server so the
             * browser cannot change the payable amount.
             */
            JsonNode razorpayOrder =
                    razorpayRequest(
                            "GET",
                            "/v1/orders/"
                                    + request.getRazorpayOrderId(),
                            null
                    );

            long razorpayAmount =
                    razorpayOrder
                            .path("amount")
                            .asLong();

            String razorpayCurrency =
                    razorpayOrder
                            .path("currency")
                            .asText();

            if (razorpayAmount
                    != expectedTotal * 100L) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Payment amount does not match booking fare"
                );
            }

            if (!"INR".equalsIgnoreCase(
                    razorpayCurrency
            )) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid payment currency"
                );
            }

            /*
             * Verify:
             *
             * HMAC_SHA256(
             *     razorpay_order_id + "|" + razorpay_payment_id,
             *     key_secret
             * )
             */
            String generatedSignature =
                    generateSignature(
                            request.getRazorpayOrderId()
                                    + "|"
                                    + request.getRazorpayPaymentId(),
                            keySecret
                    );

            if (!constantTimeEquals(
                    generatedSignature,
                    request.getRazorpaySignature()
            )) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid Razorpay payment signature"
                );
            }

            /*
             * Only after signature + amount validation do we
             * create the actual railway ticket.
             */
            return ticketService.bookTicket(
                    BookingRequestDTO.builder()
                            .trainNumber(
                                    request.getTrainNumber()
                            )
                            .from(request.getFrom())
                            .to(request.getTo())
                            .journeyDate(
                                    request.getJourneyDate()
                            )
                            .departureTime(
                                    request.getDepartureTime()
                            )
                            .passengers(
                                    request.getPassengers()
                            )
                            .build()
            );

        } catch (ResponseStatusException e) {

            throw e;

        } catch (Exception e) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to verify Razorpay payment: "
                            + e.getMessage()
            );
        }
    }

    private JsonNode razorpayRequest(
            String method,
            String path,
            String body
    ) throws Exception {

        String credentials =
                keyId + ":" + keySecret;

        String basicAuth =
                Base64.getEncoder()
                        .encodeToString(
                                credentials.getBytes(
                                        StandardCharsets.UTF_8
                                )
                        );

        HttpRequest.Builder builder =
                HttpRequest.newBuilder()
                        .uri(
                                URI.create(
                                        "https://api.razorpay.com"
                                                + path
                                )
                        )
                        .header(
                                "Authorization",
                                "Basic " + basicAuth
                        )
                        .header(
                                "Content-Type",
                                "application/json"
                        )
                        .header("Accept", "application/json")
                        .timeout(Duration.ofSeconds(30));

        if ("POST".equalsIgnoreCase(method)) {

            builder.POST(
                    HttpRequest.BodyPublishers.ofString(
                            body == null ? "" : body
                    )
            );

        } else {

            builder.GET();
        }

        HttpResponse<String> response =
                httpClient.send(
                        builder.build(),
                        HttpResponse.BodyHandlers.ofString()
                );

        if (response.statusCode() < 200
                || response.statusCode() >= 300) {

            String errorMessage =
                    response.body();

            try {
                JsonNode error =
                        objectMapper.readTree(
                                response.body()
                        );

                if (error.path("error")
                        .path("description")
                        .isTextual()) {

                    errorMessage =
                            error.path("error")
                                    .path("description")
                                    .asText();
                }
            } catch (Exception ignored) {
                // Keep the raw response when it is not JSON.
            }

            throw new IllegalStateException(
                    "Razorpay API "
                            + response.statusCode()
                            + ": "
                            + errorMessage
            );
        }

        return objectMapper.readTree(
                response.body()
        );
    }

    private String generateSignature(
            String payload,
            String secret
    ) throws Exception {

        Mac mac =
                Mac.getInstance("HmacSHA256");

        mac.init(
                new SecretKeySpec(
                        secret.getBytes(
                                StandardCharsets.UTF_8
                        ),
                        "HmacSHA256"
                )
        );

        byte[] digest =
                mac.doFinal(
                        payload.getBytes(
                                StandardCharsets.UTF_8
                        )
                );

        StringBuilder hex =
                new StringBuilder();

        for (byte value : digest) {

            hex.append(
                    String.format(
                            "%02x",
                            value
                    )
            );
        }

        return hex.toString();
    }

    private boolean constantTimeEquals(
            String left,
            String right
    ) {

        if (left == null || right == null) {
            return false;
        }

        return java.security.MessageDigest
                .isEqual(
                        left.getBytes(StandardCharsets.UTF_8),
                        right.getBytes(StandardCharsets.UTF_8)
                );
    }

    private void validateBookingRequest(
            BookingRequestDTO request
    ) {

        if (request == null
                || request.getPassengers() == null
                || request.getPassengers().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one passenger is required"
            );
        }

        if (isBlank(request.getTrainNumber())
                || isBlank(request.getFrom())
                || isBlank(request.getTo())
                || request.getJourneyDate() == null
                || request.getDepartureTime() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Complete journey details are required"
            );
        }
    }

    private void validateVerificationRequest(
            PaymentVerificationRequestDTO request
    ) {

        if (request == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment verification request is empty"
            );
        }

        validateBookingRequest(
                BookingRequestDTO.builder()
                        .trainNumber(
                                request.getTrainNumber()
                        )
                        .from(request.getFrom())
                        .to(request.getTo())
                        .journeyDate(
                                request.getJourneyDate()
                        )
                        .departureTime(
                                request.getDepartureTime()
                        )
                        .passengers(
                                request.getPassengers()
                        )
                        .build()
        );

        if (isBlank(request.getRazorpayOrderId())
                || isBlank(request.getRazorpayPaymentId())
                || isBlank(request.getRazorpaySignature())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Razorpay payment details are required"
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null
                || value.trim().isEmpty();
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}
