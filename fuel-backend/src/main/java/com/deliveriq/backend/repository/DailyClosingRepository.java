package com.deliveriq.backend.repository;

import com.deliveriq.backend.model.DailyClosing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyClosingRepository extends JpaRepository<DailyClosing, Long> {
    Optional<DailyClosing> findByDate(LocalDate date);
    
    // Finds the most recent closing entry prior to the given date
    Optional<DailyClosing> findFirstByDateBeforeOrderByDateDesc(LocalDate date);
    
    // Finds entries in a date range for reports and history
    List<DailyClosing> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);
    
    // Finds all entries sorted by date descending
    List<DailyClosing> findAllByOrderByDateDesc();
}
