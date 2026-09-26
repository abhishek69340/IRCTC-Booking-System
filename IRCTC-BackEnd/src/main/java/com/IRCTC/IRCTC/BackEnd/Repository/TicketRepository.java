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
public interface TicketRepository
        extends JpaRepository<Ticket, Long> {


    /*
     * ============================================================
     * FIND BY PNR
     * ============================================================
     */

    @EntityGraph(
            attributePaths = "passengers"
    )
    Optional<Ticket> findByPnrNumber(
            String pnrNumber
    );


    /*
     * ============================================================
     * ACTIVE TICKETS
     * ============================================================
     *
     * Journey date is future
     *
     * OR
     *
     * Journey date is today and departure time
     * has not passed.
     */
    @EntityGraph(
            attributePaths = "passengers"
    )
    @Query("""
            SELECT t
            FROM Ticket t
            WHERE t.journeyDate > :currentDate
               OR (
                    t.journeyDate = :currentDate
                    AND t.departureTime >= :currentTime
               )
            ORDER BY t.journeyDate ASC,
                     t.departureTime ASC
            """)
    List<Ticket> findActiveTickets(
            @Param("currentDate")
            LocalDate currentDate,

            @Param("currentTime")
            LocalTime currentTime
    );


    /*
     * ============================================================
     * HISTORY TICKETS
     * ============================================================
     *
     * Journey date is in the past
     *
     * OR
     *
     * Journey is today but departure time has passed.
     */
    @EntityGraph(
            attributePaths = "passengers"
    )
    @Query("""
            SELECT t
            FROM Ticket t
            WHERE t.journeyDate < :currentDate
               OR (
                    t.journeyDate = :currentDate
                    AND t.departureTime < :currentTime
               )
            ORDER BY t.journeyDate DESC,
                     t.departureTime DESC
            """)
    List<Ticket> findInactiveTickets(
            @Param("currentDate")
            LocalDate currentDate,

            @Param("currentTime")
            LocalTime currentTime
    );
}