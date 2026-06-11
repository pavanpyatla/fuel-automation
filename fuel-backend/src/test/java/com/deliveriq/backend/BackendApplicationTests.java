package com.deliveriq.backend;

import com.deliveriq.backend.model.DailyClosing;
import com.deliveriq.backend.repository.DailyClosingRepository;
import com.deliveriq.backend.service.DailyClosingService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
class BackendApplicationTests {

	@Autowired
	private DailyClosingService dailyClosingService;

	@MockBean
	private DailyClosingRepository dailyClosingRepository;

	@Test
void testDailyClosingCalculations() {
    // Arrange
    DailyClosing closing = new DailyClosing();
    closing.setDate(LocalDate.of(2026, 6, 4));

    // Opening readings
    closing.setOpeningMs1(BigDecimal.valueOf(100.0));
    closing.setOpeningMs2(BigDecimal.valueOf(200.0));
    closing.setOpeningMs3(BigDecimal.valueOf(300.0));

    closing.setOpeningHsd1(BigDecimal.valueOf(400.0));
    closing.setOpeningHsd2(BigDecimal.valueOf(500.0));
    closing.setOpeningHsd3(BigDecimal.valueOf(600.0));

    // Closing readings
    closing.setClosingMs1(BigDecimal.valueOf(200.0));
    closing.setClosingMs2(BigDecimal.valueOf(300.0));
    closing.setClosingMs3(BigDecimal.valueOf(400.0));

    closing.setClosingHsd1(BigDecimal.valueOf(500.0));
    closing.setClosingHsd2(BigDecimal.valueOf(600.0));
    closing.setClosingHsd3(BigDecimal.valueOf(700.0));

    // Fuel Rates
    closing.setMsRate(BigDecimal.valueOf(100.00));
    closing.setHsdRate(BigDecimal.valueOf(90.00));

    // Test Litres
    closing.setMsTestLitres(BigDecimal.valueOf(15.00));
    closing.setHsdTestLitres(BigDecimal.valueOf(15.00));

    // Payments
    closing.setPhonePeAmount(BigDecimal.valueOf(5000.00));
    closing.setHpPayAmount(BigDecimal.valueOf(1000.00));
    closing.setSwipeAmount(BigDecimal.valueOf(3000.00));

    // Credit
    closing.setDueGiven(BigDecimal.valueOf(1000.00));

    // Due Paid Modes
    closing.setDuePaidCash(BigDecimal.valueOf(500.00));
    closing.setDuePaidPhonePe(BigDecimal.valueOf(200.00));
    closing.setDuePaidHpPay(BigDecimal.valueOf(100.00));
    closing.setDuePaidSwipe(BigDecimal.valueOf(200.00));

    // Adjustments
    closing.setJumpAmount(BigDecimal.valueOf(100.00));

    // Cash Ledger
    closing.setOpeningCash(BigDecimal.valueOf(10000.00));
    closing.setBankDepositAmount(BigDecimal.valueOf(5000.00));

    // Due Ledger
    closing.setOpeningDueBalance(BigDecimal.valueOf(50000.00));

    // Physical Cash
    closing.setActualCashCounted(BigDecimal.valueOf(49550.00));

    // Mock Repository
    when(dailyClosingRepository.findFirstByDateBeforeOrderByDateDesc(any(LocalDate.class)))
            .thenReturn(Optional.empty());

    when(dailyClosingRepository.save(any(DailyClosing.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

    // Act
    DailyClosing result =
            dailyClosingService.calculateAndSave(closing, "test-user");

    // MS Total = 300
    assertEquals(
            0,
            BigDecimal.valueOf(300.00)
                    .compareTo(result.getMsTotalLitres()));

    // HSD Total = 300
    assertEquals(
            0,
            BigDecimal.valueOf(300.00)
                    .compareTo(result.getHsdTotalLitres()));

    // Net MS = 285
    assertEquals(
            0,
            BigDecimal.valueOf(285.00)
                    .compareTo(result.getNetMsLitres()));

    // Net HSD = 285
    assertEquals(
            0,
            BigDecimal.valueOf(285.00)
                    .compareTo(result.getNetHsdLitres()));

    // MS Amount = 28,500
    assertEquals(
            0,
            BigDecimal.valueOf(28500.00)
                    .compareTo(result.getMsAmount()));

    // HSD Amount = 25,650
    assertEquals(
            0,
            BigDecimal.valueOf(25650.00)
                    .compareTo(result.getHsdAmount()));

    // Total Sales = 54,150
    assertEquals(
            0,
            BigDecimal.valueOf(54150.00)
                    .compareTo(result.getTotalSales()));

    // Total Due Paid = 500 + 200 + 100 + 200 = 1000
    assertEquals(
            0,
            BigDecimal.valueOf(1000.00)
                    .compareTo(result.getTotalDuePaid()));

    // Expected Cash
    // 54150 - 5000 - 1000 - 3000 - 1000 + 500 - 100
    // = 44550
    assertEquals(
            0,
            BigDecimal.valueOf(44550.00)
                    .compareTo(result.getExpectedCash()));

    // Closing Due Balance
    // 50000 + 1000 - 1000 = 50000
    assertEquals(
            0,
            BigDecimal.valueOf(50000.00)
                    .compareTo(result.getClosingDueBalance()));

    // Total Cash Available
    // 10000 + 44550 = 54550

    // Closing Cash
    // 54550 - 5000 = 49550
    assertEquals(
            0,
            BigDecimal.valueOf(49550.00)
                    .compareTo(result.getClosingCash()));

    // Difference
    // Actual Cash = 49550
    // Closing Cash = 49550
    // Difference = 0
    assertEquals(
            0,
            BigDecimal.ZERO
                    .compareTo(result.getCashDifference()));

    assertEquals("test-user", result.getCreatedBy());
	}
}
