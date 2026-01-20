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

        } catch (Exception e) {
            // Ignore errors (e.g., if table doesn't exist yet, though ddl-auto runs before
            // this)
            System.out.println("Database fix skipped or failed (might already be correct): " + e.getMessage());
        }
    }
}
