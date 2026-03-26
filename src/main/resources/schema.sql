CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role VARCHAR(255),
    age INT,
    height_cm DOUBLE,
    weight_kg DOUBLE,
    gender VARCHAR(255),
    fitness_goal VARCHAR(255),
    phone VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME(6),
    target_weight_kg DOUBLE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_requested BOOLEAN NOT NULL DEFAULT FALSE,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    fcm_token VARCHAR(255),
    target_steps INT,
    target_water_liters DOUBLE,
    target_sleep_hours DOUBLE,
    target_workouts_per_week INT,
    target_active_calories DOUBLE,
    target_distance_km DOUBLE,
    created_at DATETIME(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt VARCHAR(500),
    content TEXT,
    author VARCHAR(255),
    role VARCHAR(255),
    category VARCHAR(255),
    image LONGTEXT,
    likes INT,
    user_id BIGINT,
    created_at DATETIME(6),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS post_likes (
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS blog_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    user_name VARCHAR(255),
    post_id BIGINT NOT NULL,
    user_id BIGINT,
    created_at DATETIME(6),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME(6),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS diet_plan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trainer_id BIGINT,
    user_id BIGINT,
    breakfast TEXT,
    lunch TEXT,
    dinner TEXT,
    snacks TEXT,
    additional_notes TEXT,
    workout_calories INT,
    water_liters DOUBLE,
    sleep_hours DOUBLE,
    steps_target INT,
    updated_at DATETIME(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS meals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    meal_type VARCHAR(32),
    calories INT,
    protein INT,
    carbs INT,
    fats INT,
    logged_at DATETIME(6),
    notes TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255),
    message VARCHAR(255),
    type VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sleep_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    hours DOUBLE,
    sleep_date DATE,
    quality VARCHAR(255),
    notes TEXT,
    created_at DATETIME(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trainers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    experience INT,
    rating DOUBLE,
    rating_count INT DEFAULT 0,
    location VARCHAR(255),
    bio VARCHAR(1000),
    image LONGTEXT,
    email VARCHAR(255),
    phone VARCHAR(255),
    user_id BIGINT,
    created_at DATETIME(6),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_requested BOOLEAN NOT NULL DEFAULT FALSE,
    certificate_1 LONGTEXT,
    certificate_2 LONGTEXT,
    certificate_3 LONGTEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trainer_specialties (
    trainer_id BIGINT NOT NULL,
    specialty VARCHAR(255),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trainer_availability (
    trainer_id BIGINT NOT NULL,
    day VARCHAR(255),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trainer_clients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trainer_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    status VARCHAR(255) NOT NULL,
    initial_message VARCHAR(255),
    created_at DATETIME(6),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id),
    FOREIGN KEY (client_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS water_intake (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    liters DOUBLE,
    logged_at DATETIME(6),
    notes TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS weight_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    weight_kg DOUBLE NOT NULL,
    log_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workouts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(64) NOT NULL,
    duration_minutes INT,
    calories_burned INT,
    performed_at DATETIME(6),
    notes TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS daily_activity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    steps INT DEFAULT 0,
    active_calories INT DEFAULT 0,
    distance_km DOUBLE DEFAULT 0.0,
    created_at DATETIME(6),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;


