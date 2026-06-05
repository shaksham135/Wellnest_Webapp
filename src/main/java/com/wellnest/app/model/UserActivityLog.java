package com.wellnest.app.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Setter
@Getter
@Entity
@Table(name = "user_activity_logs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "active_date"})
})
public class UserActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "active_date", nullable = false)
    private LocalDate activeDate;

    public UserActivityLog() {
    }

    public UserActivityLog(Long userId, LocalDate activeDate) {
        this.userId = userId;
        this.activeDate = activeDate;
    }
}
