package com.IRCTC.IRCTC.BackEnd.IrctcService;

import com.IRCTC.IRCTC.BackEnd.Dto.BookingRequestDTO;
import com.IRCTC.IRCTC.BackEnd.Entity.Passenger;
import com.IRCTC.IRCTC.BackEnd.Entity.Ticket;
import com.IRCTC.IRCTC.BackEnd.Repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;

    @Transactional
    public Ticket bookTicket(BookingRequestDTO request) {
        Ticket ticket = Ticket.builder()
                .pnrNumber(generatePNR())
                .trainNumber(request.getTrainNumber())
                .fromStation(request.getFrom())
                .toStation(request.getTo())
                .journeyDate(request.getJourneyDate())
                .departureTime(request.getDepartureTime())
                .status("BOOKED")
                .build();

        for (BookingRequestDTO.PassengerDTO pDto : request.getPassengers()) {
            Passenger passenger = Passenger.builder()
                    .name(pDto.getName())
                    .age(pDto.getAge())
                    .gender(pDto.getGender())
                    .berthPreference(pDto.getBerthPreference())
                    .build();
            ticket.addPassenger(passenger);
        }

        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getActiveTickets() {
        return ticketRepository.findActiveTickets(LocalDate.now(), LocalTime.now());
    }

    @Transactional(readOnly = true)
    public List<Ticket> getInactiveTickets() {
        return ticketRepository.findInactiveTickets(LocalDate.now(), LocalTime.now());
    }

    @Transactional(readOnly = true)
    public Optional<Ticket> findTicketByPnr(String pnr) {
        return ticketRepository.findByPnrNumber(pnr);
    }

    private String generatePNR() {
        String pnr;
        do {
            pnr = String.valueOf(ThreadLocalRandom.current().nextLong(1_000_000_000L, 10_000_000_000L));
        } while (ticketRepository.findByPnrNumber(pnr).isPresent());
        return pnr;
    }
}