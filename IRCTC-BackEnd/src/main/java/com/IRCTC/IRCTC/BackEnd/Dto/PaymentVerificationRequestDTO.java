package com.IRCTC.IRCTC.BackEnd.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentVerificationRequestDTO {

    private String trainNumber;

    private String from;

    private String to;

    private LocalDate journeyDate;

    private LocalTime departureTime;

    private List<BookingRequestDTO.PassengerDTO> passengers;

    private String razorpayOrderId;

    private String razorpayPaymentId;

    private String razorpaySignature;
}
