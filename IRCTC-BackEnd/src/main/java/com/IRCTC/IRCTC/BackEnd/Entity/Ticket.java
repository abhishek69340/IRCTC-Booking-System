package com.IRCTC.IRCTC.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;


    @Column(
            unique = true,
            nullable = false,
            length = 10
    )
    private String pnrNumber;


    @Column(nullable = false)
    private String fromStation;


    @Column(nullable = false)
    private String toStation;


    @Column(nullable = false)
    private LocalDate journeyDate;


    @Column(nullable = false)
    private LocalTime departureTime;


    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime bookingTimestamp =
            LocalDateTime.now();


    @Column(nullable = false)
    private String trainNumber;


    @Builder.Default
    @Column(nullable = false)
    private String status = "BOOKED";


    /*
     * One ticket can contain multiple passengers.
     *
     * Cascade ALL:
     * Saving ticket saves passengers.
     *
     * orphanRemoval:
     * Removing passengers from ticket removes them from DB.
     */
    @OneToMany(
            mappedBy = "ticket",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<Passenger> passengers =
            new ArrayList<>();


    public void addPassenger(
            Passenger passenger
    ) {

        passengers.add(passenger);

        passenger.setTicket(this);
    }


    public void removePassenger(
            Passenger passenger
    ) {

        passengers.remove(passenger);

        passenger.setTicket(null);
    }
}