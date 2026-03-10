CREATE DATABASE spip_platform;
USE spip_platform;

CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE
);

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(120) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    role_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE builders (
    builder_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    company_name VARCHAR(150),
    registration_number VARCHAR(100),
    address TEXT,
    kyc_status ENUM('pending','verified','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE projects (
    project_id INT PRIMARY KEY AUTO_INCREMENT,
    builder_id INT,
    project_name VARCHAR(150),
    location VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    total_area DECIMAL(12,2),
    launch_date DATE,
    status ENUM('planning','active','completed'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (builder_id) REFERENCES builders(builder_id)
);

CREATE TABLE layouts (
    layout_id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    processed BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE plots (
    plot_id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    plot_number VARCHAR(50),
    area_sqft DECIMAL(10,2),
    length DECIMAL(10,2),
    width DECIMAL(10,2),
    facing_direction VARCHAR(20),
    road_width DECIMAL(10,2),
    corner_plot BOOLEAN DEFAULT FALSE,
    price DECIMAL(12,2),
    price_per_sqft DECIMAL(10,2),
    status ENUM('available','blocked','sold') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE plot_coordinates (
    coordinate_id INT PRIMARY KEY AUTO_INCREMENT,
    plot_id INT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    sequence_order INT,
    FOREIGN KEY (plot_id) REFERENCES plots(plot_id)
);

CREATE TABLE amenities (
    amenity_id INT PRIMARY KEY AUTO_INCREMENT,
    amenity_name VARCHAR(100)
);

CREATE TABLE project_amenities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    amenity_id INT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id)
);

CREATE TABLE legal_compliance (
    compliance_id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    katha_type ENUM('A','B','NA'),
    rera_number VARCHAR(100),
    dc_conversion BOOLEAN,
    encumbrance_verified BOOLEAN,
    risk_score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE legal_documents (
    document_id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    document_type VARCHAR(100),
    file_path VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE plot_bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    plot_id INT,
    user_id INT,
    booking_status ENUM('blocked','confirmed','cancelled'),
    token_amount DECIMAL(10,2),
    block_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plot_id) REFERENCES plots(plot_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT,
    user_id INT,
    amount DECIMAL(12,2),
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(150),
    payment_status ENUM('pending','success','failed','refunded'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES plot_bookings(booking_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE refunds (
    refund_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT,
    refund_amount DECIMAL(10,2),
    refund_reason TEXT,
    refund_status ENUM('initiated','completed'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
);

CREATE TABLE plot_price_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    plot_id INT,
    price DECIMAL(12,2),
    recorded_date DATE,
    FOREIGN KEY (plot_id) REFERENCES plots(plot_id)
);

CREATE TABLE infrastructure (
    infra_id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    infra_type VARCHAR(100),
    distance_km DECIMAL(5,2),
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);