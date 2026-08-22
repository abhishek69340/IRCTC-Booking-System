package com.IRCTC.IRCTC.BackEnd.Dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequestDTO {
    private String trainNumber;
    private String from;
    private String to;
    private LocalDate journeyDate;
    private LocalTime departureTime;
    private List<PassengerDTO> passengers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PassengerDTO {
        private String name;
        private Integer age;
        private String gender;
        private String berthPreference;
    }
}