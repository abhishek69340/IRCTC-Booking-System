package com.IRCTC.IRCTC.BackEnd.Repository;

import com.IRCTC.IRCTC.BackEnd.Entity.Passenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PassengerRepository
        extends JpaRepository<Passenger, Long> {


    /*
     * Delete all passengers belonging to a ticket.
     *
     * This executes BEFORE deleting the ticket itself.
     *
     * This prevents:
     *
     * Cannot delete or update a parent row:
     * a foreign key constraint fails
     */
    @Modifying
    @Query("""
            DELETE FROM Passenger p
            WHERE p.ticket.ticketId = :ticketId
            """)
    void deleteByTicketId(
            @Param("ticketId") Long ticketId
    );
}