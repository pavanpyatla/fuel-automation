package com.deliveriq.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.deliveriq.backend.model.DailyClosing;
import com.deliveriq.backend.repository.DailyClosingRepository;

@Service
public class DailyClosingService {

    private final DailyClosingRepository dailyClosingRepository;

    public DailyClosingService(DailyClosingRepository dailyClosingRepository) {
        this.dailyClosingRepository = dailyClosingRepository;
    }

    /**
     * Retrieve the previous day's closing readings to populate the opening readings for a new entry.
     */
    public DailyClosing getPreviousClosingReadings(LocalDate date) {
        Optional<DailyClosing> previousOpt = dailyClosingRepository.findFirstByDateBeforeOrderByDateDesc(date);
        if (previousOpt.isPresent()) {
            return previousOpt.get();
        }
        // Return a mock/empty object indicating no previous entry
        DailyClosing empty = new DailyClosing();
        empty.setClosingMs1(BigDecimal.ZERO);
        empty.setClosingMs2(BigDecimal.ZERO);
        empty.setClosingMs3(BigDecimal.ZERO);
        empty.setClosingHsd1(BigDecimal.ZERO);
        empty.setClosingHsd2(BigDecimal.ZERO);
        empty.setClosingHsd3(BigDecimal.ZERO);
        // Cash and Due ledger defaults for first entry
        empty.setClosingCash(BigDecimal.ZERO);
        empty.setClosingDueBalance(BigDecimal.ZERO);
        return empty;
    }

    /**
     * Performs calculations and saves the daily closing record.
     */
    @Transactional
    public DailyClosing calculateAndSave(DailyClosing closing, String username) {
        // Enforce opening readings from the previous day's closing readings if available
        Optional<DailyClosing> previousOpt = dailyClosingRepository.findFirstByDateBeforeOrderByDateDesc(closing.getDate());
        if (previousOpt.isPresent()) {
            DailyClosing prev = previousOpt.get();
            closing.setOpeningMs1(prev.getClosingMs1());
            closing.setOpeningMs2(prev.getClosingMs2());
            closing.setOpeningMs3(prev.getClosingMs3());
            closing.setOpeningHsd1(prev.getClosingHsd1());
            closing.setOpeningHsd2(prev.getClosingHsd2());
            closing.setOpeningHsd3(prev.getClosingHsd3());
        } else {
            // If it is the first entry, use the opening readings provided by the user, defaulting to 0 if null
            if (closing.getOpeningMs1() == null) closing.setOpeningMs1(BigDecimal.ZERO);
            if (closing.getOpeningMs2() == null) closing.setOpeningMs2(BigDecimal.ZERO);
            if (closing.getOpeningMs3() == null) closing.setOpeningMs3(BigDecimal.ZERO);
            if (closing.getOpeningHsd1() == null) closing.setOpeningHsd1(BigDecimal.ZERO);
            if (closing.getOpeningHsd2() == null) closing.setOpeningHsd2(BigDecimal.ZERO);
            if (closing.getOpeningHsd3() == null) closing.setOpeningHsd3(BigDecimal.ZERO);
        }

        // Validate closing readings are not less than opening readings
        validateReadings(closing);

        // Standardize null fields to ZERO for calculations
        sanitizeInputFields(closing);

        // 1. Sold Litres per nozzle
        BigDecimal ms1Sold = closing.getClosingMs1().subtract(closing.getOpeningMs1());
        BigDecimal ms2Sold = closing.getClosingMs2().subtract(closing.getOpeningMs2());
        BigDecimal ms3Sold = closing.getClosingMs3().subtract(closing.getOpeningMs3());
        
        BigDecimal hsd1Sold = closing.getClosingHsd1().subtract(closing.getOpeningHsd1());
        BigDecimal hsd2Sold = closing.getClosingHsd2().subtract(closing.getOpeningHsd2());
        BigDecimal hsd3Sold = closing.getClosingHsd3().subtract(closing.getOpeningHsd3());

        // 2. MS Total Litres & HSD Total Litres
        BigDecimal msTotal = ms1Sold.add(ms2Sold).add(ms3Sold);
        BigDecimal hsdTotal = hsd1Sold.add(hsd2Sold).add(hsd3Sold);
        closing.setMsTotalLitres(msTotal);
        closing.setHsdTotalLitres(hsdTotal);

        // 3. Net MS Litres & Net HSD Litres (subtract testing)
        BigDecimal netMs = msTotal.subtract(closing.getMsTestLitres());
        BigDecimal netHsd = hsdTotal.subtract(closing.getHsdTestLitres());
        // Do not allow net litres to be negative
        closing.setNetMsLitres(netMs.max(BigDecimal.ZERO));
        closing.setNetHsdLitres(netHsd.max(BigDecimal.ZERO));

        // 4. Amounts
        BigDecimal msAmount = closing.getNetMsLitres().multiply(closing.getMsRate()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal hsdAmount = closing.getNetHsdLitres().multiply(closing.getHsdRate()).setScale(2, RoundingMode.HALF_UP);
        closing.setMsAmount(msAmount);
        closing.setHsdAmount(hsdAmount);

        // 5. Total Sales
        BigDecimal totalSales = msAmount.add(hsdAmount).setScale(2, RoundingMode.HALF_UP);
        closing.setTotalSales(totalSales);

        // 6. Expected Cash
        // Formula: Expected Cash = Total Sales - PhonePe - HP Pay - Swipe - Due Given + Due Paid (Cash Only) - Jump
        BigDecimal expectedCash = totalSales
                .subtract(closing.getPhonePeAmount())
                .subtract(closing.getHpPayAmount())
                .subtract(closing.getSwipeAmount())
                .subtract(closing.getDueGiven())
                .add(closing.getDuePaidCash())
                .subtract(closing.getJumpAmount())
                .setScale(2, RoundingMode.HALF_UP);
        closing.setExpectedCash(expectedCash);

        // 7. Cash Ledger (Running Balance)
        // Opening Cash = Previous Day's Closing Cash
        if (previousOpt.isPresent()) {
            closing.setOpeningCash(previousOpt.get().getClosingCash() != null ? previousOpt.get().getClosingCash() : BigDecimal.ZERO);
        } else {
            if (closing.getOpeningCash() == null) closing.setOpeningCash(BigDecimal.ZERO);
        }
        // Total Cash Available = Opening Cash + Expected Cash
        BigDecimal totalCashAvailable = closing.getOpeningCash().add(expectedCash);
        // Closing Cash = Total Cash Available - Bank Deposit
        if (closing.getBankDepositAmount() == null) closing.setBankDepositAmount(BigDecimal.ZERO);
        BigDecimal closingCash = totalCashAvailable.subtract(closing.getBankDepositAmount()).setScale(2, RoundingMode.HALF_UP);
        closing.setClosingCash(closingCash);

        // 8. Cash Difference = Actual Cash Counted - Closing Cash
        BigDecimal difference = closing.getActualCashCounted().subtract(closingCash).setScale(2, RoundingMode.HALF_UP);
        closing.setCashDifference(difference);

        // 9. Due Ledger (Running Balance)
        // Opening Due Balance = Previous Day's Closing Due Balance
        if (previousOpt.isPresent()) {
            closing.setOpeningDueBalance(previousOpt.get().getClosingDueBalance() != null ? previousOpt.get().getClosingDueBalance() : BigDecimal.ZERO);
        } else {
            if (closing.getOpeningDueBalance() == null) closing.setOpeningDueBalance(BigDecimal.ZERO);
        }
        
        // Total Due Paid = Cash + PhonePe + HP Pay + Swipe
        BigDecimal totalDuePaid = closing.getDuePaidCash()
                .add(closing.getDuePaidPhonePe())
                .add(closing.getDuePaidHpPay())
                .add(closing.getDuePaidSwipe())
                .setScale(2, RoundingMode.HALF_UP);
        closing.setTotalDuePaid(totalDuePaid);
        
        // Closing Due Balance = Opening Due Balance + Due Given - Total Due Paid
        BigDecimal closingDueBalance = closing.getOpeningDueBalance()
                .add(closing.getDueGiven())
                .subtract(totalDuePaid)
                .setScale(2, RoundingMode.HALF_UP);
        closing.setClosingDueBalance(closingDueBalance);

        // Set metadata
        closing.setCreatedBy(username);
        closing.setCreatedAt(LocalDateTime.now());

        // Check if there is already an entry for this date to support updates/overwrites
        Optional<DailyClosing> existingOpt = dailyClosingRepository.findByDate(closing.getDate());
        if (existingOpt.isPresent()) {
            closing.setId(existingOpt.get().getId());
        }

        // Ensure numeric magnitudes fit expected DB ranges to avoid SQL errors
        validateNumericMagnitudes(closing);

        return dailyClosingRepository.save(closing);
    }

    private void validateNumericMagnitudes(DailyClosing closing) {
        // Match frontend client-side limits; also keep within typical DECIMAL(12,2) ranges
        final BigDecimal MAX = new BigDecimal("9999999999.99");
        Map<String, BigDecimal> toCheck = new LinkedHashMap<>();
        toCheck.put("actualCashCounted", closing.getActualCashCounted());
        toCheck.put("bankDepositAmount", closing.getBankDepositAmount());
        toCheck.put("openingCash", closing.getOpeningCash());
        toCheck.put("phonePeAmount", closing.getPhonePeAmount());
        toCheck.put("hpPayAmount", closing.getHpPayAmount());
        toCheck.put("swipeAmount", closing.getSwipeAmount());
        toCheck.put("dueGiven", closing.getDueGiven());
        toCheck.put("duePaidCash", closing.getDuePaidCash());
        toCheck.put("msRate", closing.getMsRate());
        toCheck.put("hsdRate", closing.getHsdRate());

        for (Map.Entry<String, BigDecimal> e : toCheck.entrySet()) {
            BigDecimal v = e.getValue() == null ? BigDecimal.ZERO : e.getValue();
            if (v.abs().compareTo(MAX) > 0) {
                throw new IllegalArgumentException("Value too large for field '" + e.getKey() + "': " + v.toPlainString());
            }
        }
    }

    public List<DailyClosing> getHistory(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return dailyClosingRepository.findByDateBetweenOrderByDateDesc(startDate, endDate);
        }
        return dailyClosingRepository.findAllByOrderByDateDesc();
    }

    public Optional<DailyClosing> getByDate(LocalDate date) {
        return dailyClosingRepository.findByDate(date);
    }

    /**
     * Aggregates dashboard metrics:
     * - Today's Sales (most recent record)
     * - Today's MS Litres
     * - Today's HSD Litres
     * - Expected Cash
     * - Cash Difference
     * - Historical charts data
     */
    public Map<String, Object> getDashboardStats(int days) {
        Map<String, Object> stats = new HashMap<>();
        List<DailyClosing> all = dailyClosingRepository.findAllByOrderByDateDesc();
        
        if (all.isEmpty()) {
            stats.put("todaySales", BigDecimal.ZERO);
            stats.put("todayMsSales", BigDecimal.ZERO);
            stats.put("todayHsdSales", BigDecimal.ZERO);
            stats.put("todayMsLitres", BigDecimal.ZERO);
            stats.put("todayHsdLitres", BigDecimal.ZERO);
            stats.put("expectedCash", BigDecimal.ZERO);
            stats.put("closingCash", BigDecimal.ZERO);
            stats.put("openingCash", BigDecimal.ZERO);
            stats.put("bankDeposit", BigDecimal.ZERO);
            stats.put("cashDifference", BigDecimal.ZERO);
            stats.put("outstandingDueBalance", BigDecimal.ZERO);
            stats.put("dueGivenToday", BigDecimal.ZERO);
            stats.put("totalDuePaidToday", BigDecimal.ZERO);
            stats.put("recentEntries", Collections.emptyList());
            return stats;
        }

        DailyClosing latest = all.get(0);
        stats.put("todaySales", latest.getTotalSales());
        stats.put("todayMsSales", latest.getMsAmount());
        stats.put("todayHsdSales", latest.getHsdAmount());
        stats.put("todayMsLitres", latest.getNetMsLitres());
        stats.put("todayHsdLitres", latest.getNetHsdLitres());
        stats.put("expectedCash", latest.getExpectedCash());
        stats.put("closingCash", latest.getClosingCash() != null ? latest.getClosingCash() : BigDecimal.ZERO);
        stats.put("openingCash", latest.getOpeningCash() != null ? latest.getOpeningCash() : BigDecimal.ZERO);
        stats.put("bankDeposit", latest.getBankDepositAmount() != null ? latest.getBankDepositAmount() : BigDecimal.ZERO);
        stats.put("cashDifference", latest.getCashDifference());
        stats.put("outstandingDueBalance", latest.getClosingDueBalance() != null ? latest.getClosingDueBalance() : BigDecimal.ZERO);
        stats.put("dueGivenToday", latest.getDueGiven());
        stats.put("totalDuePaidToday", latest.getTotalDuePaid() != null ? latest.getTotalDuePaid() : BigDecimal.ZERO);
        stats.put("todayDate", latest.getDate());

        // We want the specified number of entries in chronological order for the trend chart
        List<DailyClosing> chartList = new ArrayList<>(all.subList(0, Math.min(days, all.size())));
        Collections.reverse(chartList);
        
        List<Map<String, Object>> trendData = new ArrayList<>();
        for (DailyClosing c : chartList) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", c.getDate().toString());
            point.put("sales", c.getTotalSales());
            point.put("difference", c.getCashDifference());
            point.put("msLitres", c.getNetMsLitres());
            point.put("hsdLitres", c.getNetHsdLitres());
            trendData.add(point);
        }
        stats.put("recentEntries", trendData);

        return stats;
    }

    private void validateReadings(DailyClosing closing) {
        if (closing.getClosingMs1().compareTo(closing.getOpeningMs1()) < 0) {
            throw new IllegalArgumentException("MS1 Closing reading cannot be less than Opening reading.");
        }
        if (closing.getClosingMs2().compareTo(closing.getOpeningMs2()) < 0) {
            throw new IllegalArgumentException("MS2 Closing reading cannot be less than Opening reading.");
        }
        if (closing.getClosingMs3().compareTo(closing.getOpeningMs3()) < 0) {
            throw new IllegalArgumentException("MS3 Closing reading cannot be less than Opening reading.");
        }
        if (closing.getClosingHsd1().compareTo(closing.getOpeningHsd1()) < 0) {
            throw new IllegalArgumentException("HSD1 Closing reading cannot be less than Opening reading.");
        }
        if (closing.getClosingHsd2().compareTo(closing.getOpeningHsd2()) < 0) {
            throw new IllegalArgumentException("HSD2 Closing reading cannot be less than Opening reading.");
        }
        if (closing.getClosingHsd3().compareTo(closing.getOpeningHsd3()) < 0) {
            throw new IllegalArgumentException("HSD3 Closing reading cannot be less than Opening reading.");
        }
    }

    private void sanitizeInputFields(DailyClosing closing) {
        if (closing.getMsRate() == null) closing.setMsRate(BigDecimal.ZERO);
        if (closing.getHsdRate() == null) closing.setHsdRate(BigDecimal.ZERO);
        if (closing.getMsTestLitres() == null) closing.setMsTestLitres(BigDecimal.ZERO);
        if (closing.getHsdTestLitres() == null) closing.setHsdTestLitres(BigDecimal.ZERO);
        if (closing.getPhonePeAmount() == null) closing.setPhonePeAmount(BigDecimal.ZERO);
        if (closing.getHpPayAmount() == null) closing.setHpPayAmount(BigDecimal.ZERO);
        if (closing.getSwipeAmount() == null) closing.setSwipeAmount(BigDecimal.ZERO);
        if (closing.getDueGiven() == null) closing.setDueGiven(BigDecimal.ZERO);
        if (closing.getDuePaidCash() == null) closing.setDuePaidCash(BigDecimal.ZERO);
        if (closing.getDuePaidPhonePe() == null) closing.setDuePaidPhonePe(BigDecimal.ZERO);
        if (closing.getDuePaidHpPay() == null) closing.setDuePaidHpPay(BigDecimal.ZERO);
        if (closing.getDuePaidSwipe() == null) closing.setDuePaidSwipe(BigDecimal.ZERO);
        if (closing.getJumpAmount() == null) closing.setJumpAmount(BigDecimal.ZERO);
        if (closing.getActualCashCounted() == null) closing.setActualCashCounted(BigDecimal.ZERO);
        if (closing.getBankDepositAmount() == null) closing.setBankDepositAmount(BigDecimal.ZERO);
    }
}
