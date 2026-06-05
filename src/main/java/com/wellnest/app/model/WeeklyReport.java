package com.wellnest.app.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "weekly_reports", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "week_start"})
})
public class WeeklyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Lob
    @Column(name = "json_content", columnDefinition = "LONGTEXT", nullable = false)
    private String jsonContent;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "last_refreshed_at", nullable = false)
    private Instant lastRefreshedAt;

    public WeeklyReport() {}

    public WeeklyReport(Long userId, String jsonContent, LocalDate weekStart, Instant lastRefreshedAt) {
        this.userId = userId;
        this.jsonContent = jsonContent;
        this.weekStart = weekStart;
        this.lastRefreshedAt = lastRefreshedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getJsonContent() { return jsonContent; }
    public void setJsonContent(String jsonContent) { this.jsonContent = jsonContent; }

    public LocalDate getWeekStart() { return weekStart; }
    public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }

    public Instant getLastRefreshedAt() { return lastRefreshedAt; }
    public void setLastRefreshedAt(Instant lastRefreshedAt) { this.lastRefreshedAt = lastRefreshedAt; }
}
