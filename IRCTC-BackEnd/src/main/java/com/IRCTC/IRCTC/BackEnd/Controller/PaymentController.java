package com.IRCTC.IRCTC.BackEnd.Controller;

import com.IRCTC.IRCTC.BackEnd.Dto.BookingRequestDTO;
import com.IRCTC.IRCTC.BackEnd.Dto.PaymentOrderResponseDTO;
import com.IRCTC.IRCTC.BackEnd.Dto.PaymentVerificationRequestDTO;
import com.IRCTC.IRCTC.BackEnd.Entity.Ticket;
import com.IRCTC.IRCTC.BackEnd.IrctcService.RazorpayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final RazorpayService razorpayService;

    /*
     * Creates the Razorpay TEST order.
     *
     * The amount is calculated on the backend.
     * Never trust an amount sent by React.
     */
    @PostMapping("/order")
    public ResponseEntity<PaymentOrderResponseDTO> createOrder(
            @RequestBody BookingRequestDTO request
    ) {

        return ResponseEntity.ok(
                razorpayService.createOrder(request)
        );
    }

    /*
     * Verifies Razorpay's payment signature and only then
     * creates the railway ticket in MySQL.
     */
    @PostMapping("/verify")
    public ResponseEntity<Ticket> verifyPayment(
            @RequestBody PaymentVerificationRequestDTO request
    ) {

        return ResponseEntity.ok(
                razorpayService.verifyAndBook(request)
        );
    }
}
