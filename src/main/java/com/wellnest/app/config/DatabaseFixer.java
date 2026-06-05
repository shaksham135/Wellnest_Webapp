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

            // Add subscription_plan column to users table if missing
            Integer subPlanCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan' AND table_schema = DATABASE()",
                    Integer.class);
            if (subPlanCount != null && subPlanCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN subscription_plan VARCHAR(50)");
                    System.out.println("Added subscription_plan column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add subscription_plan column: " + e.getMessage());
                }
            }

            // Add subscription_status column to users table if missing
            Integer subStatusCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status' AND table_schema = DATABASE()",
                    Integer.class);
            if (subStatusCount != null && subStatusCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'INACTIVE'");
                    System.out.println("Added subscription_status column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add subscription_status column: " + e.getMessage());
                }
            }

            // Add subscription_date column to users table if missing
            Integer subDateCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_date' AND table_schema = DATABASE()",
                    Integer.class);
            if (subDateCount != null && subDateCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN subscription_date DATE");
                    System.out.println("Added subscription_date column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add subscription_date column: " + e.getMessage());
                }
            }

            // Add premium_activated_at column to users table if missing
            Integer premActCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'premium_activated_at' AND table_schema = DATABASE()",
                    Integer.class);
            if (premActCount != null && premActCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN premium_activated_at DATETIME");
                    System.out.println("Added premium_activated_at column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add premium_activated_at column: " + e.getMessage());
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

            // --- MONETIZATION: Add daily_voice_count column ---
            Integer dvCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_voice_count' AND table_schema = DATABASE()",
                    Integer.class);
            if (dvCount != null && dvCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN daily_voice_count INT DEFAULT 0");
                    System.out.println("Added daily_voice_count column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add daily_voice_count: " + e.getMessage());
                }
            }

            // --- MONETIZATION: Add last_voice_date column ---
            Integer lvdCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_voice_date' AND table_schema = DATABASE()",
                    Integer.class);
            if (lvdCount != null && lvdCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN last_voice_date DATE");
                    System.out.println("Added last_voice_date column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add last_voice_date: " + e.getMessage());
                }
            }

            // --- MONETIZATION: Add daily_scan_count column ---
            Integer dsCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_scan_count' AND table_schema = DATABASE()",
                    Integer.class);
            if (dsCount != null && dsCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN daily_scan_count INT DEFAULT 0");
                    System.out.println("Added daily_scan_count column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add daily_scan_count: " + e.getMessage());
                }
            }

            // --- MONETIZATION: Add last_scan_date column ---
            Integer lsdCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_scan_date' AND table_schema = DATABASE()",
                    Integer.class);
            if (lsdCount != null && lsdCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN last_scan_date DATE");
                    System.out.println("Added last_scan_date column to users table");
                } catch (Exception e) {
                    System.out.println("Failed to add last_scan_date: " + e.getMessage());
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

            // --- BETA PREMIUM: Add premium_access_type column to users ---
            Integer patCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'premium_access_type' AND table_schema = DATABASE()",
                Integer.class);
            if (patCount != null && patCount == 0) {
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN premium_access_type VARCHAR(50) NOT NULL DEFAULT 'FREE'");
                    System.out.println("Added premium_access_type column to users table");
                    // Migrate existing premium users
                    jdbcTemplate.execute("UPDATE users SET premium_access_type = 'PAID_PREMIUM' WHERE is_premium = true AND premium_access_type = 'FREE'");
                    System.out.println("Migrated existing premium users to PAID_PREMIUM access type");
                } catch (Exception e) {
                    System.out.println("Failed to add premium_access_type: " + e.getMessage());
                }
            }

            // --- BETA PREMIUM: Create beta_requests table ---
            Integer betaTableCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_name = 'beta_requests' AND table_schema = DATABASE()",
                Integer.class);
            if (betaTableCount != null && betaTableCount == 0) {
                try {
                    jdbcTemplate.execute("CREATE TABLE beta_requests (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                        "user_id BIGINT NOT NULL," +
                        "message TEXT NOT NULL," +
                        "status VARCHAR(50) NOT NULL DEFAULT 'PENDING'," +
                        "admin_notes TEXT," +
                        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
                        "reviewed_at DATETIME," +
                        "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                        ") ENGINE=InnoDB;");
                    System.out.println("Beta Requests table created successfully.");
                } catch (Exception e) {
                    System.out.println("Failed to create beta_requests table: " + e.getMessage());
                }
            }

            // --- DATABASE INDEXES FOR DEEP PERFORMANCE ---
            try {
                jdbcTemplate.execute("CREATE INDEX idx_workouts_user_performed ON workouts(user_id, performed_at)");
                System.out.println("Created performance index idx_workouts_user_performed");
            } catch (Exception e) {}

            try {
                jdbcTemplate.execute("CREATE INDEX idx_meals_user_logged ON meals(user_id, logged_at)");
                System.out.println("Created performance index idx_meals_user_logged");
            } catch (Exception e) {}

            try {
                jdbcTemplate.execute("CREATE INDEX idx_water_user_logged ON water_intake(user_id, logged_at)");
                System.out.println("Created performance index idx_water_user_logged");
            } catch (Exception e) {}

            try {
                jdbcTemplate.execute("CREATE INDEX idx_sleep_user_date ON sleep_logs(user_id, sleep_date)");
                System.out.println("Created performance index idx_sleep_user_date");
            } catch (Exception e) {}

            try {
                jdbcTemplate.execute("CREATE INDEX idx_activity_user_date ON daily_activity(user_id, date)");
                System.out.println("Created performance index idx_activity_user_date");
            } catch (Exception e) {}

            try {
                jdbcTemplate.execute("CREATE INDEX idx_user_activity_date ON user_activity_logs(user_id, active_date)");
                System.out.println("Created performance index idx_user_activity_date");
            } catch (Exception e) {}

        } catch (Exception e) {
            // Ignore errors (e.g., if table doesn't exist yet, though ddl-auto runs before
            // this)
            System.out.println("Database fix skipped or failed (might already be correct): " + e.getMessage());
        }
    }
}
