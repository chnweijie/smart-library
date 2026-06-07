
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Modal, Form, Input, Select, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import * as userApi from '../api/user';
import { normalizeRole, normalizeStatus } from '../utils/userDisplay';

export default function AdminUsers() {
  const { t } = useTranslation();
  const { users, fetchUsers, toggleUserStatus } = useStore();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    setLoading(true);
    fetchUsers().finally(() => setLoading(false));
  }, [fetchUsers]);

  const mappedUsers = users.map((u) => ({
    ...u,
    roleKey: normalizeRole(u.role),
    statusKey: normalizeStatus(u.status),
  }));

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 1 });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      nickname: record.nickname,
      email: record.email,
      phone: record.phone,
      role: record.role === 'ADMIN' || record.role === 2 ? 2 : 1,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingUser) {
        await userApi.updateUser(editingUser.id, values);
        message.success(t('admin.updateSuccess'));
      } else {
        await userApi.createUser(values);
        message.success(t('admin.addSuccess'));
      }
      setModalOpen(false);
      fetchUsers();
    } catch (e) {
      if (e.message) message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userApi.deleteUser(id);
      message.success(t('admin.deleteSuccess'));
      fetchUsers();
    } catch (e) {
      message.error(e.message || t('common.error'));
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      await toggleUserStatus(record.id);
      message.success(
        record.statusKey === 'normal' ? t('admin.userDisabled') : t('admin.userEnabled')
      );
    } catch (e) {
      message.error(e.message || t('common.error'));
    }
  };

  const columns = [
    { title: t('common.id'), dataIndex: 'id', key: 'id', width: 80 },
    { title: t('auth.username'), dataIndex: 'username', key: 'username' },
    { title: t('profile.nickname'), dataIndex: 'nickname', key: 'nickname' },
    { title: t('profile.email'), dataIndex: 'email', key: 'email' },
    {
      title: t('profile.role'),
      dataIndex: 'roleKey',
      key: 'role',
      render: (roleKey) => (
        <Tag color={roleKey === 'admin' ? 'red' : 'blue'}>{t(`common.role.${roleKey}`)}</Tag>
      ),
    },
    {
      title: t('profile.accountStatus'),
      dataIndex: 'statusKey',
      key: 'status',
      render: (statusKey) => (
        <Tag color={statusKey === 'normal' ? 'green' : 'orange'}>{t(`common.status.${statusKey}`)}</Tag>
      ),
    },
    {
      title: t('admin.userManagement'),
      key: 'action',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            {t('common.edit')}
          </Button>
          <Button type="link" size="small" onClick={() => handleToggleStatus(record)}>
            {record.statusKey === 'normal' ? t('common.disable') : t('common.enable')}
          </Button>
          <Popconfirm title={t('admin.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">{t('common.delete')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('admin.userManagement')}</h2>
        <Button type="primary" onClick={openCreate}>{t('admin.addUser')}</Button>
      </div>
      <Spin spinning={loading}>
        <Table
          dataSource={mappedUsers}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      <Modal
        title={editingUser ? t('admin.editUser') : t('admin.addUser')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label={t('auth.username')} rules={[
            { required: true, message: t('auth.usernameRequired') || '请输入用户名' },
            { min: 3, message: t('auth.usernameMin') || '用户名至少3个字符' },
            { max: 20, message: t('auth.usernameMax') || '用户名不超过20个字符' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: t('auth.usernamePattern') || '用户名只能包含字母、数字和下划线' },
          ]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label={t('auth.password')} rules={[
              { required: true, message: t('auth.passwordRequired') || '请输入密码' },
              { min: 6, message: t('auth.passwordMin') || '密码至少6个字符' },
            ]}>
              <Input.Password />
            </Form.Item>
          )}
          {editingUser && (
            <Form.Item name="password" label={t('profile.newPassword')} rules={[
              { min: 6, message: t('auth.passwordMin') || '密码至少6个字符' },
            ]}>
              <Input.Password placeholder={t('admin.passwordOptional')} />
            </Form.Item>
          )}
          <Form.Item name="nickname" label={t('profile.nickname')} rules={[
            { required: true, message: t('auth.nicknameRequired') || '请输入昵称' },
            { max: 30, message: t('auth.nicknameMax') || '昵称不超过30个字符' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t('profile.email')} rules={[
            { type: 'email', message: t('auth.invalidEmail') || '请输入有效的邮箱' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('profile.phone')} rules={[
            { pattern: /^$|^\d{7,15}$/, message: t('auth.invalidPhone') || '请输入有效的手机号' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label={t('profile.role')} rules={[{ required: true }]}>
            <Select
              options={[
                { value: 1, label: t('common.role.user') },
                { value: 2, label: t('common.role.admin') },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
