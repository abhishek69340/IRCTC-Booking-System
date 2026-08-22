package com.IRCTC.IRCTC.BackEnd.Controller;

import com.IRCTC.IRCTC.BackEnd.Dto.BookingRequestDTO;
import com.IRCTC.IRCTC.BackEnd.Entity.Ticket;
import com.IRCTC.IRCTC.BackEnd.IrctcService.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/book")
    public ResponseEntity<Ticket> bookTicket(@RequestBody BookingRequestDTO request) {
        System.out.println("Received Booking Request: " + request);
        return new ResponseEntity<>(ticketService.bookTicket(request), HttpStatus.CREATED);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Ticket>> getActiveTickets() {
        return ResponseEntity.ok(ticketService.getActiveTickets());
    }

    @GetMapping("/history")
    public ResponseEntity<List<Ticket>> getInactiveTickets() {
        return ResponseEntity.ok(ticketService.getInactiveTickets());
    }

    @GetMapping("/{pnr}")
    public ResponseEntity<Ticket> getTicketByPnr(@PathVariable String pnr) {
        String normalizedPnr = pnr == null ? "" : pnr.trim();
        if (!normalizedPnr.matches("\\d{10}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PNR must be exactly 10 digits");
        }
        return ticketService.findTicketByPnr(normalizedPnr)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ticket not found for PNR: " + normalizedPnr));
    }
}