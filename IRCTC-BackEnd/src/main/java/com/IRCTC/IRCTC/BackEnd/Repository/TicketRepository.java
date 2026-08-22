package com.IRCTC.IRCTC.BackEnd.Repository;

import com.IRCTC.IRCTC.BackEnd.Entity.Ticket;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @EntityGraph(attributePaths = "passengers")
    Optional<Ticket> findByPnrNumber(String pnrNumber);

    // Active Tickets (Date/time in future)
    @EntityGraph(attributePaths = "passengers")
    @Query("SELECT t FROM Ticket t WHERE t.journeyDate > :currentDate OR " +
            "(t.journeyDate = :currentDate AND t.departureTime >= :currentTime)")
    List<Ticket> findActiveTickets(@Param("currentDate") LocalDate currentDate,
                                   @Param("currentTime") LocalTime currentTime);

    // Inactive/History Tickets (Date/time in past)
    @EntityGraph(attributePaths = "passengers")
    @Query("SELECT t FROM Ticket t WHERE t.journeyDate < :currentDate OR " +
            "(t.journeyDate = :currentDate AND t.departureTime < :currentTime)")
    List<Ticket> findInactiveTickets(@Param("currentDate") LocalDate currentDate,
                                     @Param("currentTime") LocalTime currentTime);
}