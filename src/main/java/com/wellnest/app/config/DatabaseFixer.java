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
            // Add is_premium column to users table if missing
            Integer premiumCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_premium' AND table_schema = DATABASE()",
                    Integer.class);

            if (premiumCount != null && premiumCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE");
                    System.out.println("Added is_premium column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add is_premium column: " + e.getMessage());
                }
            }

            // --- MONETIZATION: Add daily_chat_count column ---
            Integer dcCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_chat_count' AND table_schema = DATABASE()",
                    Integer.class);
            if (dcCount != null && dcCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN daily_chat_count INT DEFAULT 0");
                    System.out.println("Added daily_chat_count column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add daily_chat_count: " + e.getMessage());
                }
            }

            // --- MONETIZATION: Add last_chat_date column ---
            Integer lcdCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_chat_date' AND table_schema = DATABASE()",
                    Integer.class);
            if (lcdCount != null && lcdCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN last_chat_date DATE");
                    System.out.println("Added last_chat_date column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add last_chat_date: " + e.getMessage());
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

            // --- AI Briefings: Add notes column (for timeOfDay) ---
            Integer notesCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.columns WHERE table_name = 'daily_briefings' AND column_name = 'notes' AND table_schema = DATABASE()",
                Integer.class);
            if (notesCount != null && notesCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE daily_briefings ADD COLUMN notes VARCHAR(255)");
                    System.out.println("Added notes column to daily_briefings table");
                } catch (Exception e) {
                    System.out.println("Failed to add notes column: " + e.getMessage());
                }
            }

            // --- ADMINISTRATION: Add is_suspended column to users ---
            Integer suspendedCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_suspended' AND table_schema = DATABASE()",
                Integer.class);
            if (suspendedCount != null && suspendedCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT FALSE");
                    System.out.println("Added is_suspended column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add is_suspended: " + e.getMessage());
                }
            }

            // --- SYSTEM SETTINGS: Ensure table exists ---
            Integer settingsTableCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = DATABASE()",
                Integer.class);
            if (settingsTableCount != null && settingsTableCount == 0) {
                try {
                    System.out.println("Missing system_settings table. Initializing...");
                    jdbcTemplate.execute("CREATE TABLE system_settings (" +
                        "id BIGINT PRIMARY KEY," +
                        "ai_enabled BOOLEAN NOT NULL DEFAULT TRUE," +
                        "total_tokens_used BIGINT NOT NULL DEFAULT 0" +
                        ") ENGINE=InnoDB;");
                    jdbcTemplate.execute("INSERT IGNORE INTO system_settings (id, ai_enabled, total_tokens_used) VALUES (1, true, 0)");
                    System.out.println("System Settings table created and seeded.");
                } catch (Exception e) {
                    System.out.println("Failed to create system_settings: " + e.getMessage());
                }
            }

        } catch (Exception e) {
            // Ignore errors (e.g., if table doesn't exist yet, though ddl-auto runs before
            // this)
            System.out.println("Database fix skipped or failed (might already be correct): " + e.getMessage());
        }
    }
}
