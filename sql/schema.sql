-- ============================================================
--  Creative Task Manager — MySQL Schema + Seed Data
--  Run: mysql -u root -p < sql/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS creative_task_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE creative_task_manager;

-- ── USERS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(120)  NOT NULL,
  email               VARCHAR(180)  NOT NULL UNIQUE,
  password_hash       VARCHAR(255)  NOT NULL,
  phone               VARCHAR(20)   DEFAULT '',
  role                ENUM('super_admin','admin','team_lead','designer','video_editor','viewer') DEFAULT 'designer',
  department          ENUM('Design','Video','Marketing','Management') DEFAULT 'Design',
  employee_id         VARCHAR(50)   DEFAULT '',
  reporting_manager   VARCHAR(120)  DEFAULT '',
  joining_date        DATE          DEFAULT (CURDATE()),
  status              ENUM('active','disabled') DEFAULT 'active',
  profile_picture_url VARCHAR(500)  DEFAULT NULL,
  created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── TASKS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  description       TEXT         DEFAULT '',
  assigned_user_id  INT          DEFAULT NULL,
  priority          ENUM('high','medium','low') DEFAULT 'medium',
  due_date          DATE         DEFAULT NULL,
  category          VARCHAR(100) DEFAULT 'Miscellaneous',
  status            ENUM('pending','completed') DEFAULT 'pending',
  completion_note   TEXT         DEFAULT NULL,
  completed_at      DATETIME     DEFAULT NULL,
  attachments       TEXT         DEFAULT NULL,
  created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── OKRs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS okrs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  objective   VARCHAR(500) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── KEY RESULTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS key_results (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  okr_id   INT NOT NULL,
  title    VARCHAR(300) NOT NULL,
  target   INT DEFAULT 100,
  current  INT DEFAULT 0,
  FOREIGN KEY (okr_id) REFERENCES okrs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── OKR ASSIGNMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS okr_assignments (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  okr_id   INT NOT NULL,
  user_id  INT DEFAULT NULL,
  role     VARCHAR(50) DEFAULT '',
  FOREIGN KEY (okr_id)  REFERENCES okrs(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── ACTIVITIES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         DEFAULT NULL,
  user_name  VARCHAR(120) DEFAULT 'System',
  action     VARCHAR(100) NOT NULL,
  details    TEXT         DEFAULT '',
  timestamp  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  message      TEXT NOT NULL,
  read_status  TINYINT(1) DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── BACKUPS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backups (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  filename    VARCHAR(255) NOT NULL,
  size        BIGINT       DEFAULT 0,
  created_by  VARCHAR(120) DEFAULT 'System',
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- Password for all users: Admin@123
-- Hash generated with bcryptjs rounds=10
-- ============================================================

INSERT INTO users (name, email, password_hash, phone, role, department, employee_id, reporting_manager, joining_date, status) VALUES
('Super Admin',   'admin@creative.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', '9000000001', 'super_admin', 'Management', 'EMP001', 'Self',          '2023-01-01', 'active'),
('Priya Sharma',  'priya@creative.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', '9000000002', 'designer',    'Design',     'EMP002', 'Super Admin',   '2023-03-15', 'active'),
('Rahul Verma',   'rahul@creative.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', '9000000003', 'video_editor','Video',      'EMP003', 'Super Admin',   '2023-04-01', 'active'),
('Ananya Singh',  'ananya@creative.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', '9000000004', 'designer',    'Design',     'EMP004', 'Super Admin',   '2023-06-10', 'active'),
('Karthik Rao',   'karthik@creative.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', '9000000005', 'video_editor','Video',      'EMP005', 'Super Admin',   '2024-01-20', 'active'),
('Meera Nair',    'meera@creative.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', '9000000006', 'team_lead',   'Management', 'EMP006', 'Super Admin',   '2023-02-01', 'active');

INSERT INTO tasks (title, description, assigned_user_id, priority, due_date, category, status, completion_note, completed_at) VALUES
('Diwali Campaign Banner',        'Create festive banner for Diwali 2024 sale campaign',      2, 'high',   DATE_ADD(CURDATE(), INTERVAL 2 DAY),  'Banner Design',      'pending',   NULL, NULL),
('Product Reel — Summer Sale',    'Edit 30-second reel for summer collection launch',          3, 'high',   DATE_ADD(CURDATE(), INTERVAL 1 DAY),  'Reel Editing',       'pending',   NULL, NULL),
('Instagram Story Series',        'Design 5-slide story for new product line',                 4, 'medium', DATE_ADD(CURDATE(), INTERVAL 3 DAY),  'Instagram Story',    'pending',   NULL, NULL),
('YouTube Thumbnail Pack',        'Create 3 thumbnails for upcoming YouTube videos',           5, 'medium', DATE_ADD(CURDATE(), INTERVAL 4 DAY),  'Thumbnail Creation', 'pending',   NULL, NULL),
('Brand Logo Refresh',            'Revamp company logo with modern design language',           2, 'low',    DATE_ADD(CURDATE(), INTERVAL 7 DAY),  'Branding',           'pending',   NULL, NULL),
('Holi Poster Design',            'Colorful poster design for Holi celebration post',          4, 'high',   DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'Poster Design',      'completed', 'Completed with vibrant gradients and festive typography', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('Festival Video Edit',           'Edit 60-second video for Independence Day campaign',        3, 'high',   DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'Video Campaign',     'completed', 'Final video delivered with color grading',                DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Brand Guidelines PDF',          'Compile full brand guidelines document',                    2, 'medium', DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'Branding',           'completed', 'PDF delivered with all brand colors and fonts',            DATE_SUB(NOW(), INTERVAL 3 DAY));

INSERT INTO okrs (objective) VALUES
('Increase Creative Output by 40% in Q3'),
('Achieve 95% On-Time Task Delivery');

INSERT INTO key_results (okr_id, title, target, current) VALUES
(1, 'Complete 120 design tasks',          120, 67),
(1, 'Complete 60 video editing tasks',    60,  28),
(1, 'Launch 3 major brand campaigns',     3,   1),
(2, 'Reduce overdue tasks to under 5%',   100, 82),
(2, 'Submit daily updates 100% of days',  30,  24);

INSERT INTO okr_assignments (okr_id, user_id) VALUES
(1, 2), (1, 4), (2, 2), (2, 3), (2, 4), (2, 5);

INSERT INTO activities (user_id, user_name, action, details) VALUES
(1, 'Super Admin', 'login',         'Super Admin logged in'),
(1, 'Super Admin', 'user_created',  'User "Priya Sharma" created'),
(1, 'Super Admin', 'user_created',  'User "Rahul Verma" created'),
(1, 'Super Admin', 'task_created',  'Task "Diwali Campaign Banner" assigned to Priya Sharma'),
(2, 'Priya Sharma','login',         'Priya Sharma logged in'),
(2, 'Priya Sharma','task_completed','Task "Holi Poster Design" marked as completed'),
(3, 'Rahul Verma', 'task_completed','Task "Festival Video Edit" marked as completed'),
(1, 'Super Admin', 'okr_created',   'OKR "Increase Creative Output by 40% in Q3" created'),
(1, 'Super Admin', 'okr_updated',   'Key result "Complete 120 design tasks" updated to 67/120'),
(1, 'Super Admin', 'backup_created','Backup "backup-initial.json" created');

INSERT INTO notifications (user_id, message, read_status) VALUES
(2, 'New task assigned to you: "Diwali Campaign Banner" (high priority)', 0),
(3, 'New task assigned to you: "Product Reel — Summer Sale" (high priority)', 0),
(4, 'New task assigned to you: "Instagram Story Series" (medium priority)', 0),
(5, 'New task assigned to you: "YouTube Thumbnail Pack" (medium priority)', 0),
(1, '"Holi Poster Design" was completed by Priya Sharma', 0),
(1, '"Festival Video Edit" was completed by Rahul Verma', 1),
(2, 'Welcome to Creative Task Manager, Priya Sharma!', 1);
