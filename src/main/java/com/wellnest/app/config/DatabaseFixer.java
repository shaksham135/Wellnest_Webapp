package com.wellnest.app.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println("Applying database schema fixes...");

            // Fix BlogPost image column
            jdbcTemplate.execute("ALTER TABLE blog_posts MODIFY COLUMN image LONGTEXT");
            System.out.println("Modified blog_posts.image to LONGTEXT");

            // Fix Trainer image column
            jdbcTemplate.execute("ALTER TABLE trainers MODIFY COLUMN image LONGTEXT");
            System.out.println("Modified trainers.image to LONGTEXT");

            // Add phone column to users table if missing
            // Add phone column to users table if missing
            Integer phoneCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone' AND table_schema = DATABASE()",
                    Integer.class);

            if (phoneCount != null && phoneCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(255)");
                    System.out.println("Added phone column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add phone column: " + e.getMessage());
                }
            } else {
                // Column already exists, silent continue or debug log
                // System.out.println("Phone column already exists.");
            }

            if (premiumCount != null && premiumCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE");
                    System.out.println("Added is_premium column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add is_premium column: " + e.getMessage());
                }
            }

            // --- AI Briefings Table Fix ---
            Integer briefingsTableCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_name = 'daily_briefings' AND table_schema = DATABASE()",
                Integer.class);

            if (briefingsTableCount != null && briefingsTableCount == 0) {
                try {
                    System.out.println("Missing daily_briefings table. Initializing schema...");
                    jdbcTemplate.execute("CREATE TABLE daily_briefings (" +
                            "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                            "user_id BIGINT NOT NULL," +
                            "content TEXT NOT NULL," +
                            "date DATE NOT NULL," +
                            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
                            "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                            ") ENGINE=InnoDB;");
                    System.out.println("Daily Briefings table created successfully.");
                } catch (Exception e) {
                    System.out.println("Failed to create daily_briefings table: " + e.getMessage());
                }
            }

        } catch (Exception e) {
            // Ignore errors (e.g., if table doesn't exist yet, though ddl-auto runs before
            // this)
            System.out.println("Database fix skipped or failed (might already be correct): " + e.getMessage());
        }
    }
}
