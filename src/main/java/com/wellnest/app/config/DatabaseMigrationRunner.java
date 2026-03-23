package com.wellnest.app.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        // SleepLogs
        try { jdbcTemplate.execute("ALTER TABLE sleep_logs ADD COLUMN created_at DATETIME(6)"); } catch (Exception e) {}
        try { jdbcTemplate.execute("ALTER TABLE sleep_logs ADD COLUMN notes TEXT"); } catch (Exception e) {}

        // Workouts
        try { jdbcTemplate.execute("ALTER TABLE workouts ADD COLUMN notes TEXT"); } catch (Exception e) {}

        // Meals
        try { jdbcTemplate.execute("ALTER TABLE meals ADD COLUMN notes TEXT"); } catch (Exception e) {}

        // WaterIntake
        try { jdbcTemplate.execute("ALTER TABLE water_intake ADD COLUMN notes TEXT"); } catch (Exception e) {}
        
        System.out.println("✅ Custom Database Schema Migrations Completed.");
    }
}
