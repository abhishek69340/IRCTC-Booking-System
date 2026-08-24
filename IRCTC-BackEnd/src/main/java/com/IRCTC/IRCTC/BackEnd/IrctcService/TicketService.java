package com.IRCTC.IRCTC.BackEnd.IrctcService;

import com.IRCTC.IRCTC.BackEnd.Dto.BookingRequestDTO;
import com.IRCTC.IRCTC.BackEnd.Entity.Passenger;
import com.IRCTC.IRCTC.BackEnd.Entity.Ticket;
import com.IRCTC.IRCTC.BackEnd.Repository.PassengerRepository;
import com.IRCTC.IRCTC.BackEnd.Repository.TicketRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;

    private final PassengerRepository passengerRepository;


    /*
     * ============================================================
     * BOOK TICKET
     * ============================================================
     */

    @Transactional
    public Ticket bookTicket(
            BookingRequestDTO request
    ) {

        /*
         * Basic validation
         */

        if (request == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Booking request cannot be empty"
            );
        }


        if (isBlank(request.getTrainNumber())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Train number is required"
            );
        }


        if (isBlank(request.getFrom())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "From station is required"
            );
        }


        if (isBlank(request.getTo())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "To station is required"
            );
        }


        if (request.getFrom()
                .trim()
                .equalsIgnoreCase(
                        request.getTo().trim()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "From and To stations must be different"
            );
        }


        if (request.getJourneyDate() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Journey date is required"
            );
        }


        if (request.getDepartureTime() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Departure time is required"
            );
        }


        if (request.getPassengers() == null
                || request.getPassengers().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one passenger is required"
            );
        }


        /*
         * Prevent booking in the past.
         */

        LocalDateTime journeyDateTime =
                LocalDateTime.of(
                        request.getJourneyDate(),
                        request.getDepartureTime()
                );

        if (!journeyDateTime.isAfter(
                LocalDateTime.now()
        )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Journey date and departure time must be in the future"
            );
        }


        /*
         * Create ticket.
         */

        Ticket ticket = Ticket.builder()
                .pnrNumber(generatePNR())
                .trainNumber(
                        request.getTrainNumber().trim()
                )
                .fromStation(
                        request.getFrom().trim()
                )
                .toStation(
                        request.getTo().trim()
                )
                .journeyDate(
                        request.getJourneyDate()
                )
                .departureTime(
                        request.getDepartureTime()
                )
                .bookingTimestamp(
                        LocalDateTime.now()
                )
                .status("BOOKED")
                .build();


        /*
         * Add passengers.
         */

        for (
                BookingRequestDTO.PassengerDTO passengerDTO
                : request.getPassengers()
        ) {

            validatePassenger(passengerDTO);


            Passenger passenger =
                    Passenger.builder()
                            .name(
                                    passengerDTO
                                            .getName()
                                            .trim()
                            )
                            .age(
                                    passengerDTO.getAge()
                            )
                            .gender(
                                    passengerDTO.getGender()
                            )
                            .berthPreference(
                                    passengerDTO
                                            .getBerthPreference()
                            )
                            .build();


            /*
             * Important:
             *
             * This sets:
             *
             * passenger.ticket = ticket
             *
             * and:
             *
             * ticket.passengers.add(passenger)
             */
            ticket.addPassenger(passenger);
        }


        /*
         * Because Ticket has CascadeType.ALL,
         * passengers are saved together with ticket.
         */

        return ticketRepository.save(ticket);
    }


    /*
     * ============================================================
     * ACTIVE TICKETS
     * ============================================================
     */

    @Transactional(readOnly = true)
    public List<Ticket> getActiveTickets() {

        return ticketRepository.findActiveTickets(
                LocalDate.now(),
                LocalTime.now()
        );
    }


    /*
     * ============================================================
     * HISTORY TICKETS
     * ============================================================
     */

    @Transactional(readOnly = true)
    public List<Ticket> getInactiveTickets() {

        return ticketRepository.findInactiveTickets(
                LocalDate.now(),
                LocalTime.now()
        );
    }


    /*
     * ============================================================
     * FIND TICKET BY PNR
     * ============================================================
     */

    @Transactional(readOnly = true)
    public Optional<Ticket> findTicketByPnr(
            String pnr
    ) {

        return ticketRepository.findByPnrNumber(
                pnr
        );
    }


    /*
     * ============================================================
     * DELETE TICKET
     * ============================================================
     *
     * IMPORTANT:
     *
     * passengers.ticket_id references tickets.ticket_id.
     *
     * Therefore:
     *
     * 1. Delete passengers
     * 2. Delete ticket
     *
     * Both operations happen inside one transaction.
     */

    @Transactional
    public void deleteTicket(
            Long ticketId
    ) {

        if (ticketId == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ticket ID is required"
            );
        }


        /*
         * Check that ticket exists.
         */

        if (!ticketRepository.existsById(ticketId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Ticket not found with ID: "
                            + ticketId
            );
        }


        /*
         * STEP 1
         *
         * Delete child passenger rows.
         */

        passengerRepository.deleteByTicketId(
                ticketId
        );


        /*
         * STEP 2
         *
         * Now the parent ticket can safely be deleted.
         */

        ticketRepository.deleteById(
                ticketId
        );


        /*
         * Transaction commits here.
         *
         * If either operation fails,
         * the transaction rolls back.
         */
    }


    /*
     * ============================================================
     * GENERATE 10-DIGIT PNR
     * ============================================================
     */

    private String generatePNR() {

        String pnr;

        do {

            pnr =
                    String.valueOf(
                            ThreadLocalRandom
                                    .current()
                                    .nextLong(
                                            1_000_000_000L,
                                            10_000_000_000L
                                    )
                    );

        } while (
                ticketRepository
                        .findByPnrNumber(pnr)
                        .isPresent()
        );


        return pnr;
    }


    /*
     * ============================================================
     * PASSENGER VALIDATION
     * ============================================================
     */

    private void validatePassenger(
            BookingRequestDTO.PassengerDTO passenger
    ) {

        if (passenger == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Passenger cannot be empty"
            );
        }


        if (isBlank(passenger.getName())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Passenger name is required"
            );
        }


        if (passenger.getAge() == null
                || passenger.getAge() <= 0
                || passenger.getAge() > 120) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Passenger age must be between 1 and 120"
            );
        }


        if (isBlank(passenger.getGender())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Passenger gender is required"
            );
        }
    }


    /*
     * ============================================================
     * STRING HELPER
     * ============================================================
     */

    private boolean isBlank(
            String value
    ) {

        return value == null
                || value.trim().isEmpty();
    }
}