
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Modal, Form, Input, Select, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { formatDateTime } from '../utils/userDisplay';

export default function AdminAnnouncements() {
  const { t } = useTranslation();
  const { announcements, fetchAnnouncements, deleteAnnouncement, addAnnouncement } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    setLoading(true);
    fetchAnnouncements().finally(() => setLoading(false));
  }, [fetchAnnouncements]);

  const columns = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('admin.announcementTitle'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('admin.announcementContent'),
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: t('admin.publishDate'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => formatDateTime(v),
    },
    {
      title: t('admin.announcementPriority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority === 1 ? 'red' : priority === 2 ? 'orange' : 'blue'}>
          {priority === 1 ? t('admin.priorityHigh') : priority === 2 ? t('admin.priorityMedium') : t('admin.priorityLow')}
        </Tag>
      ),
    },
    {
      title: t('admin.reviewManagement'),
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title={t('admin.deleteConfirm')}
            onConfirm={async () => {
              try {
                await deleteAnnouncement(record.id);
                message.success(t('admin.deleteSuccess'));
              } catch (e) {
                message.error(e.message || t('common.error'));
              }
            }}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" danger size="small">{t('common.delete')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await addAnnouncement(values);
      message.success(t('admin.addSuccess'));
      setIsModalOpen(false);
      form.resetFields();
    } catch (e) {
      if (e.message) {
        message.error(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>{t('admin.announcementManagement')}</h2>
        <Button type="primary" onClick={() => {
          form.resetFields();
          setIsModalOpen(true);
        }}>
          {t('admin.addAnnouncement')}
        </Button>
      </div>
      <Spin spinning={loading}>
      <Table 
        dataSource={announcements} 
        columns={columns} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
      </Spin>

      <Modal
        title={t('admin.addAnnouncement')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label={t('admin.announcementTitle')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label={t('admin.announcementContent')} rules={[{ required: true }]}>
            <Input.TextArea rows={6} />
          </Form.Item>
          <Form.Item name="priority" label={t('admin.announcementPriority')} initialValue={3}>
            <Select style={{ width: '100%' }}>
              <Select.Option value={1}>{t('admin.priorityHigh')}</Select.Option>
              <Select.Option value={2}>{t('admin.priorityMedium')}</Select.Option>
              <Select.Option value={3}>{t('admin.priorityLow')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
