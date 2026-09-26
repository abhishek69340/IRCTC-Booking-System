package com.IRCTC.IRCTC.BackEnd.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrderResponseDTO {

    private String orderId;

    private String keyId;

    private Long amount;

    private String currency;

    private Integer passengerCount;

    private Long farePerPassenger;

    private Long baseFare;

    private Long serviceFee;

    private Long totalFare;
}
