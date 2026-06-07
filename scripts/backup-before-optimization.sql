-- =============================================
-- 数据库优化备份脚本
-- 生成时间: 2026-06-07
-- 说明: 在删除冗余字段和表之前，先备份相关数据
-- =============================================

USE library_system;

-- 1. 备份 file_uploads 表数据（整表将被删除）
-- CREATE TABLE file_uploads_backup AS SELECT * FROM file_uploads;

-- 2. 备份 users.face_updated_at 字段
-- ALTER TABLE users ADD COLUMN face_updated_at_backup DATETIME COMMENT '人脸信息更新时间(备份)';
-- UPDATE users SET face_updated_at_backup = face_updated_at WHERE face_updated_at IS NOT NULL;

-- 3. 备份 borrow_records.audit_user_id 和 audit_time 字段
-- ALTER TABLE borrow_records ADD COLUMN audit_user_id_backup BIGINT COMMENT '审核管理员ID(备份)';
-- ALTER TABLE borrow_records ADD COLUMN audit_time_backup DATETIME COMMENT '审核时间(备份)';
-- UPDATE borrow_records SET audit_user_id_backup = audit_user_id WHERE audit_user_id IS NOT NULL;
-- UPDATE borrow_records SET audit_time_backup = audit_time WHERE audit_time IS NOT NULL;

-- =============================================
-- 如需恢复，执行以下语句
-- =============================================

-- 恢复 face_updated_at
-- ALTER TABLE users ADD COLUMN face_updated_at DATETIME COMMENT '人脸信息更新时间';
-- UPDATE users SET face_updated_at = face_updated_at_backup;

-- 恢复 audit_user_id 和 audit_time
-- ALTER TABLE borrow_records ADD COLUMN audit_user_id BIGINT COMMENT '审核管理员ID';
-- ALTER TABLE borrow_records ADD COLUMN audit_time DATETIME COMMENT '审核时间';
-- UPDATE borrow_records SET audit_user_id = audit_user_id_backup;
-- UPDATE borrow_records SET audit_time = audit_time_backup;

-- 恢复 file_uploads 表
-- CREATE TABLE file_uploads AS SELECT * FROM file_uploads_backup;
