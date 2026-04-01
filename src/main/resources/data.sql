-- Seed SystemSettings (Singleton with ID 1)
INSERT IGNORE INTO system_settings (id, ai_enabled, total_tokens_used) 
VALUES (1, true, 0);

-- Note: Admin user and other defaults are automatically handled by the application code on first run.
