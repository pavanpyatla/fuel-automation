package com.deliveriq.backend.controller;

import com.deliveriq.backend.model.DailyClosing;
import com.deliveriq.backend.service.DailyClosingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/closings")
@CrossOrigin(origins = "*")
public class ClosingController {

    private final DailyClosingService dailyClosingService;

    public ClosingController(DailyClosingService dailyClosingService) {
        this.dailyClosingService = dailyClosingService;
    }

    /**
     * Retrieves the closing readings from the previous day's record to serve as opening readings.
     */
    @GetMapping("/previous")
    public ResponseEntity<DailyClosing> getPreviousClosingReadings(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DailyClosing previousReadings = dailyClosingService.getPreviousClosingReadings(date);
        return ResponseEntity.ok(previousReadings);
    }

    /**
     * Submit a new daily closing record.
     */
    @PostMapping
    public ResponseEntity<?> submitClosing(
            @RequestBody DailyClosing closing,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        String username = getUsernameFromHeader(authHeader);
        if ("system".equals(username)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: Invalid session token");
        }

        try {
            DailyClosing saved = dailyClosingService.calculateAndSave(closing, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred while saving the closing entry: " + e.getMessage());
        }
    }

    /**
     * Fetch past daily closing records (with optional date filtering).
     */
    @GetMapping("/history")
    public ResponseEntity<List<DailyClosing>> getHistory(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<DailyClosing> history = dailyClosingService.getHistory(startDate, endDate);
        return ResponseEntity.ok(history);
    }

    /**
     * Retrieve details of a single record by its date.
     */
    @GetMapping("/by-date")
    public ResponseEntity<?> getByDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Optional<DailyClosing> closingOpt = dailyClosingService.getByDate(date);
        if (closingOpt.isPresent()) {
            return ResponseEntity.ok(closingOpt.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No closing record found for date: " + date);
        }
    }

    /**
     * Retrieve aggregated statistics for the dashboard.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @RequestParam(value = "days", defaultValue = "7") int days) {
        Map<String, Object> stats = dailyClosingService.getDashboardStats(days);
        return ResponseEntity.ok(stats);
    }

    /**
     * Utility method to extract username from token.
     */
    private String getUsernameFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "system";
        }
        try {
            String base64Token = authHeader.substring(7);
            String decoded = new String(Base64.getDecoder().decode(base64Token));
            String[] parts = decoded.split(":");
            return parts[0];
        } catch (Exception e) {
            return "system";
        }
    }
}
