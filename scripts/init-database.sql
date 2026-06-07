
-- =============================================
-- 智慧图书管理系统 - 数据库初始化脚本
-- =============================================

CREATE DATABASE IF NOT EXISTS library_system DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE library_system;

-- =============================================
-- 1. 用户表
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希(BCrypt)',
    nickname VARCHAR(50) NOT NULL COMMENT '昵称',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    role TINYINT DEFAULT 1 COMMENT '1-普通用户,2-管理员',
    face_feature TEXT COMMENT '人脸特征向量',
    status TINYINT DEFAULT 1 COMMENT '0-禁用,1-正常',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- =============================================
-- 2. 图书分类表
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书分类表';

-- =============================================
-- 3. 图书表
-- =============================================
CREATE TABLE IF NOT EXISTS books (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    isbn VARCHAR(20) COMMENT 'ISBN编号',
    title VARCHAR(200) NOT NULL COMMENT '书名',
    author VARCHAR(100) COMMENT '作者',
    publisher VARCHAR(100) COMMENT '出版社',
    publish_date DATE COMMENT '出版日期',
    cover_url VARCHAR(500) COMMENT '封面图片URL',
    category_id BIGINT COMMENT '分类ID',
    description TEXT COMMENT '内容简介',
    total_count INT DEFAULT 0 COMMENT '总库存',
    available_count INT DEFAULT 0 COMMENT '可借数量',
    location VARCHAR(100) COMMENT '书架位置',
    status TINYINT DEFAULT 1 COMMENT '0-下架,1-上架',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_isbn (isbn),
    INDEX idx_title (title),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书表';

-- =============================================
-- 4. 借阅记录表
-- =============================================
CREATE TABLE IF NOT EXISTS borrow_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    book_id BIGINT NOT NULL COMMENT '图书ID',
    borrow_date DATETIME NOT NULL COMMENT '借阅日期',
    due_date DATETIME NOT NULL COMMENT '应还日期',
    return_date DATETIME COMMENT '实际归还日期',
    status TINYINT DEFAULT 1 COMMENT '1-借阅中,2-待审核,3-已归还,4-审核拒绝,5-逾期',
    reject_reason VARCHAR(500) COMMENT '审核拒绝原因',
    audit_user_id BIGINT COMMENT '审核管理员ID',
    audit_time DATETIME COMMENT '审核时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='借阅记录表';

-- =============================================
-- 5. 图书评论表
-- =============================================
CREATE TABLE IF NOT EXISTS book_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    book_id BIGINT NOT NULL COMMENT '图书ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    rating TINYINT NOT NULL COMMENT '评分1-5',
    content TEXT COMMENT '评论内容',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    reply_count INT DEFAULT 0 COMMENT '回复数',
    is_deleted TINYINT DEFAULT 0 COMMENT '0-正常,1-已删除',
    audit_status TINYINT DEFAULT 1 COMMENT '0-待审核,1-已通过,2-已驳回',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_book_id (book_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_audit_status (audit_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书评论表';

-- =============================================
-- 6. 评论回复表
-- =============================================
CREATE TABLE IF NOT EXISTS review_replies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id BIGINT NOT NULL COMMENT '评论ID',
    user_id BIGINT NOT NULL COMMENT '回复用户ID',
    reply_to_user_id BIGINT COMMENT '回复给谁（可选）',
    content TEXT NOT NULL COMMENT '回复内容',
    is_deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_review_id (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论回复表';

-- =============================================
-- 7. 评论点赞表
-- =============================================
CREATE TABLE IF NOT EXISTS review_likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_review_user (review_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论点赞表';

-- =============================================
-- 8. 消息通知表
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '接收用户ID',
    type TINYINT NOT NULL COMMENT '1-借阅通过,2-借阅驳回,3-归还提醒,4-逾期通知,5-预约到馆,6-系统公告,7-评论回复',
    title VARCHAR(200) NOT NULL COMMENT '消息标题',
    content TEXT COMMENT '消息内容',
    related_type VARCHAR(50) COMMENT '关联类型(book/review/borrow等)',
    related_id BIGINT COMMENT '关联ID',
    is_read TINYINT DEFAULT 0 COMMENT '0-未读,1-已读',
    priority TINYINT COMMENT '公告优先级(1-高,2-中,3-低)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知表';

-- =============================================
-- 9. 系统公告表
-- =============================================
CREATE TABLE IF NOT EXISTS system_announcements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority TINYINT DEFAULT 3 COMMENT '1-高,2-中,3-低',
    created_by BIGINT COMMENT '发布管理员ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统公告表';

-- =============================================
-- 10. 情绪记录表
-- =============================================
CREATE TABLE IF NOT EXISTS emotion_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    book_id BIGINT COMMENT '关联图书ID（可选）',
    emotion VARCHAR(50) NOT NULL COMMENT '情绪类型(happy,neutral,sad,surprised,angry,fearful)',
    confidence DECIMAL(5,4) COMMENT '置信度',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='情绪记录表';

-- =============================================
-- 11. 收藏表
-- =============================================
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    book_id BIGINT NOT NULL COMMENT '图书ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_book (user_id, book_id),
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- =============================================
-- 12. 图书预约表
-- =============================================
CREATE TABLE IF NOT EXISTS book_reservations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    book_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status TINYINT DEFAULT 0 COMMENT '0-待取,1-已取,2-已取消,3-已过期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expire_at DATETIME COMMENT '过期时间',
    INDEX idx_book_id (book_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图书预约表';

-- =============================================
-- 插入初始数据
-- =============================================

-- Insert default categories
INSERT INTO categories (name) VALUES
('Literature'),
('Science & Technology'),
('History'),
('Philosophy'),
('Art')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert test books
INSERT INTO books (isbn, title, author, publisher, category_id, description, total_count, available_count, status) VALUES
('9787020002207', 'To Live', 'Yu Hua', 'Writer Publishing House', 1, 'To Live is Yu Hua''s masterpiece, telling the story of an ordinary person''s suffering and resilient life through social changes.', 5, 5, 1),
('9787536692930', 'The Three-Body Problem', 'Liu Cixin', 'Chongqing Publishing House', 2, 'The Three-Body Problem is a landmark science fiction series by Liu Cixin and a milestone in Chinese sci-fi literature.', 8, 8, 1),
('9787108012799', '1587, A Year of No Significance', 'Ray Huang', 'SDX Joint Publishing', 3, '1587, A Year of No Significance is a Ming Dynasty history book by Chinese-American historian Ray Huang.', 3, 3, 1)
ON DUPLICATE KEY UPDATE available_count = VALUES(available_count);

