package com.deliveriq.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_closings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyClosing {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private LocalDate date;
    
    // Nozzle Opening Readings (MS = Petrol, HSD = Diesel)
    @Column(name = "opening_ms1", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingMs1;
    
    @Column(name = "opening_ms2", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingMs2;
    
    @Column(name = "opening_ms3", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingMs3;
    
    @Column(name = "opening_hsd1", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingHsd1;
    
    @Column(name = "opening_hsd2", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingHsd2;
    
    @Column(name = "opening_hsd3", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingHsd3;
    
    // Nozzle Closing Readings
    @Column(name = "closing_ms1", nullable = false, precision = 12, scale = 2)
    private BigDecimal closingMs1;
    
    @Column(name = "closing_ms2", nullable = false, precision = 12, scale = 2)
    private BigDecimal closingMs2;
    
    @Column(name = "closing_ms3", nullable = false, precision = 12, scale = 2)
    private BigDecimal closingMs3;
    
    @Column(name = "closing_hsd1", nullable = false, precision = 12, scale = 2)
    private BigDecimal closingHsd1;
    
    @Column(name = "closing_hsd2", nullable = false, precision = 12, scale = 2)
    private BigDecimal closingHsd2;
    
    @Column(name = "closing_hsd3", nullable = false, precision = 12, scale = 2)
    private BigDecimal closingHsd3;
    
    // Fuel Rates (per litre)
    @Column(name = "ms_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal msRate;
    
    @Column(name = "hsd_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hsdRate;
    
    // Testing Litres
    @Column(name = "ms_test_litres", nullable = false, precision = 10, scale = 2)
    private BigDecimal msTestLitres;
    
    @Column(name = "hsd_test_litres", nullable = false, precision = 10, scale = 2)
    private BigDecimal hsdTestLitres;
    
    // Payments
    @Column(name = "phonepe_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal phonePeAmount;
    
    @Column(name = "hp_pay_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal hpPayAmount;
    
    @Column(name = "swipe_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal swipeAmount;
    
    // Credit
    @Column(name = "due_given", nullable = false, precision = 12, scale = 2)
    private BigDecimal dueGiven;
    
    @Column(name = "due_paid_cash", nullable = false, precision = 12, scale = 2)
    private BigDecimal duePaidCash;
    
    @Column(name = "due_paid_phonepe", nullable = false, precision = 12, scale = 2)
    private BigDecimal duePaidPhonePe;
    
    @Column(name = "due_paid_hppay", nullable = false, precision = 12, scale = 2)
    private BigDecimal duePaidHpPay;
    
    @Column(name = "due_paid_swipe", nullable = false, precision = 12, scale = 2)
    private BigDecimal duePaidSwipe;
    
    // Adjustments
    @Column(name = "jump_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal jumpAmount;
    
    // Cash Ledger (Running Balance)
    @Column(name = "opening_cash", precision = 12, scale = 2)
    private BigDecimal openingCash;
    
    @Column(name = "actual_cash_counted", nullable = false, precision = 12, scale = 2)
    private BigDecimal actualCashCounted;
    
    @Column(name = "bank_deposit_amount", precision = 12, scale = 2)
    private BigDecimal bankDepositAmount;
    
    @Column(name = "closing_cash", precision = 12, scale = 2)
    private BigDecimal closingCash;
    
    // Due Ledger (Running Balance)
    @Column(name = "opening_due_balance", precision = 12, scale = 2)
    private BigDecimal openingDueBalance;
    
    @Column(name = "closing_due_balance", precision = 12, scale = 2)
    private BigDecimal closingDueBalance;
    
    // CALCULATED FIELDS (Calculated by service before saving)
    @Column(name = "ms_total_litres", precision = 12, scale = 2)
    private BigDecimal msTotalLitres;
    
    @Column(name = "hsd_total_litres", precision = 12, scale = 2)
    private BigDecimal hsdTotalLitres;
    
    @Column(name = "net_ms_litres", precision = 12, scale = 2)
    private BigDecimal netMsLitres;
    
    @Column(name = "net_hsd_litres", precision = 12, scale = 2)
    private BigDecimal netHsdLitres;
    
    @Column(name = "ms_amount", precision = 12, scale = 2)
    private BigDecimal msAmount;
    
    @Column(name = "hsd_amount", precision = 12, scale = 2)
    private BigDecimal hsdAmount;
    
    @Column(name = "total_sales", precision = 12, scale = 2)
    private BigDecimal totalSales;
    
    @Column(name = "expected_cash", precision = 12, scale = 2)
    private BigDecimal expectedCash;
    
    @Column(name = "cash_difference", precision = 12, scale = 2)
    private BigDecimal cashDifference;
    
    @Column(name = "total_due_paid", precision = 12, scale = 2)
    private BigDecimal totalDuePaid;
    
    // Metadata
    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
