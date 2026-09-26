package com.IRCTC.IRCTC.BackEnd.IrctcService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Service
public class FareService {

    /*
     * The application does not currently collect travel class,
     * quota, concession, train type, or exact railway distance.
     *
     * Therefore this is a DEMO IRCTC-style fare engine:
     * - popular routes have explicit route fares;
     * - other station pairs use a distance-band calculation.
     *
     * These are application/demo fares, not an official IRCTC fare quote.
     */

    private final Map<String, Long> routeFarePerPassenger = new HashMap<>();

    private final Map<String, double[]> stationCoordinates = new HashMap<>();

    public FareService() {

        /*
         * Explicit route fares for common routes in this project.
         * Amount is per passenger, before the booking service fee.
         */
        putRoute("Bengaluru City", "Chennai Central", 430);
        putRoute("Bengaluru City", "Mysuru Junction", 180);
        putRoute("Bengaluru City", "Hyderabad Deccan", 520);
        putRoute("Bengaluru City", "Pune Junction", 720);
        putRoute("Bengaluru City", "Mumbai Central", 780);
        putRoute("Bengaluru City", "Kochi", 520);
        putRoute("Bengaluru City", "Goa", 560);
        putRoute("Chennai Central", "Hyderabad Deccan", 500);
        putRoute("Chennai Central", "Pune Junction", 690);
        putRoute("Chennai Central", "Mumbai Central", 760);
        putRoute("Mumbai Central", "Pune Junction", 240);
        putRoute("Mumbai Central", "Goa", 550);
        putRoute("Delhi", "Jaipur", 450);
        putRoute("Jaipur", "Amritsar", 520);
        putRoute("Delhi", "Amritsar", 650);
        putRoute("Delhi", "Kolkata", 850);
        putRoute("Hyderabad Deccan", "Pune Junction", 580);
        putRoute("Hyderabad Deccan", "Goa", 600);

        /*
         * Approximate city coordinates used only to give different
         * prices for routes not listed above.
         */
        stationCoordinates.put("Bengaluru City", new double[]{12.9716, 77.5946});
        stationCoordinates.put("Chennai Central", new double[]{13.0827, 80.2707});
        stationCoordinates.put("New Delhi", new double[]{28.6139, 77.2090});
        stationCoordinates.put("Mumbai Central", new double[]{19.0760, 72.8777});
        stationCoordinates.put("Hyderabad Deccan", new double[]{17.3850, 78.4867});
        stationCoordinates.put("Pune Junction", new double[]{18.5204, 73.8567});
        stationCoordinates.put("Mysuru Junction", new double[]{12.2958, 76.6394});
        stationCoordinates.put("Kochi", new double[]{9.9312, 76.2673});
        stationCoordinates.put("Jaipur", new double[]{26.9124, 75.7873});
        stationCoordinates.put("Manali", new double[]{32.2432, 77.1892});
        stationCoordinates.put("Shimla", new double[]{31.1048, 77.1734});
        stationCoordinates.put("Amritsar", new double[]{31.6340, 74.8723});
        stationCoordinates.put("Goa", new double[]{15.2993, 74.1240});
        stationCoordinates.put("Kolkata", new double[]{22.5726, 88.3639});
    }

    public long calculateFarePerPassenger(String from, String to) {

        if (from == null || to == null
                || from.trim().isEmpty()
                || to.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "From and To stations are required"
            );
        }

        String a = from.trim();
        String b = to.trim();

        if (a.equalsIgnoreCase(b)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "From and To stations must be different"
            );
        }

        Long directFare = routeFarePerPassenger.get(routeKey(a, b));

        if (directFare != null) {
            return directFare;
        }

        double[] fromCoordinates = stationCoordinates.get(a);
        double[] toCoordinates = stationCoordinates.get(b);

        if (fromCoordinates == null || toCoordinates == null) {
            return 500L;
        }

        double distanceKm = haversine(
                fromCoordinates[0],
                fromCoordinates[1],
                toCoordinates[0],
                toCoordinates[1]
        );

        /*
         * Distance-band demo fare:
         * minimum ₹180 and increases with route distance.
         */
        long fare;

        if (distanceKm <= 150) {
            fare = 180;
        } else if (distanceKm <= 300) {
            fare = 260;
        } else if (distanceKm <= 500) {
            fare = 380;
        } else if (distanceKm <= 750) {
            fare = 520;
        } else if (distanceKm <= 1000) {
            fare = 680;
        } else if (distanceKm <= 1500) {
            fare = 850;
        } else {
            fare = 1050;
        }

        return fare;
    }

    public long calculateBaseFare(
            String from,
            String to,
            int passengerCount
    ) {
        if (passengerCount <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one passenger is required"
            );
        }

        return calculateFarePerPassenger(from, to) * passengerCount;
    }

    /*
     * One booking-level service/reservation handling fee.
     * Kept separate so the UI can show the total clearly.
     */
    public long calculateServiceFee(int passengerCount) {
        return 20L;
    }

    private void putRoute(
            String from,
            String to,
            long fare
    ) {
        routeFarePerPassenger.put(
                routeKey(from, to),
                fare
        );
    }

    private String routeKey(String from, String to) {
        if (from.compareToIgnoreCase(to) < 0) {
            return from.toLowerCase() + "||" + to.toLowerCase();
        }

        return to.toLowerCase() + "||" + from.toLowerCase();
    }

    private double haversine(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {
        double earthRadiusKm = 6371.0;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        return earthRadiusKm * c;
    }
}
