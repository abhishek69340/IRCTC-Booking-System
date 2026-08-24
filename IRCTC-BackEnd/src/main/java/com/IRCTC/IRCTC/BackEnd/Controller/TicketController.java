package com.IRCTC.IRCTC.BackEnd.Controller;

import com.IRCTC.IRCTC.BackEnd.Dto.BookingRequestDTO;
import com.IRCTC.IRCTC.BackEnd.Entity.Ticket;
import com.IRCTC.IRCTC.BackEnd.IrctcService.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    /*
     * ============================================================
     * BOOK TICKET
     * ============================================================
     *
     * Supports:
     *
     * POST /api/v1/tickets
     * POST /api/v1/tickets/book
     *
     * This keeps the backend compatible with both versions
     * of the frontend.
     */
    @PostMapping({
            "",
            "/book"
    })
    public ResponseEntity<Ticket> bookTicket(
            @RequestBody BookingRequestDTO request
    ) {

        Ticket ticket = ticketService.bookTicket(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ticket);
    }


    /*
     * ============================================================
     * ACTIVE TICKETS
     * ============================================================
     *
     * GET /api/v1/tickets/active
     */
    @GetMapping("/active")
    public ResponseEntity<List<Ticket>> getActiveTickets() {

        return ResponseEntity.ok(
                ticketService.getActiveTickets()
        );
    }


    /*
     * ============================================================
     * TICKET HISTORY
     * ============================================================
     *
     * GET /api/v1/tickets/history
     */
    @GetMapping("/history")
    public ResponseEntity<List<Ticket>> getHistoryTickets() {

        return ResponseEntity.ok(
                ticketService.getInactiveTickets()
        );
    }


    /*
     * ============================================================
     * PNR STATUS
     * ============================================================
     *
     * GET /api/v1/tickets/pnr/{pnr}
     *
     * Example:
     *
     * GET /api/v1/tickets/pnr/9867319982
     */
    @GetMapping("/pnr/{pnr}")
    public ResponseEntity<Ticket> getTicketByPnr(
            @PathVariable String pnr
    ) {

        String normalizedPnr =
                pnr == null
                        ? ""
                        : pnr.trim();

        if (!normalizedPnr.matches("\\d{10}")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PNR must be exactly 10 digits"
            );
        }

        return ticketService
                .findTicketByPnr(normalizedPnr)
                .map(ResponseEntity::ok)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Ticket not found for PNR: "
                                        + normalizedPnr
                        )
                );
    }


    /*
     * ============================================================
     * DELETE TICKET
     * ============================================================
     *
     * DELETE /api/v1/tickets/{ticketId}
     *
     * Example:
     *
     * DELETE /api/v1/tickets/4
     */
    @DeleteMapping("/{ticketId}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long ticketId
    ) {

        ticketService.deleteTicket(ticketId);

        return ResponseEntity.noContent().build();
    }
}