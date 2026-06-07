import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

export default function AdminComments() {
  const { t } = useTranslation();
  const { pendingReviews, fetchPendingReviews, approveReview, rejectReview } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPendingReviews().finally(() => setLoading(false));
  }, [fetchPendingReviews]);

  const handleApprove = async (id) => {
    try {
      await approveReview(id);
      message.success(t('admin.approved'));
      fetchPendingReviews();
    } catch (e) {
      message.error(e.message || t('common.error'));
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectReview(id);
      message.success(t('admin.rejected'));
      fetchPendingReviews();
    } catch (e) {
      message.error(e.message || t('common.error'));
    }
  };

  const columns = [
    { title: t('common.id'), dataIndex: 'id', key: 'id', width: 80 },
    { title: t('admin.reviewUser'), dataIndex: 'userId', key: 'userId', width: 100 },
    { title: t('admin.reviewBook'), dataIndex: 'bookId', key: 'bookId', width: 100 },
    {
      title: t('review.rating'),
      dataIndex: 'rating',
      key: 'rating',
      width: 80,
      render: (r) => <Tag color="gold">{r}</Tag>,
    },
    {
      title: t('review.content'),
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: t('admin.bookManagement'),
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Popconfirm title={t('admin.confirmApprove')} onConfirm={() => handleApprove(record.id)}>
            <Button type="link" size="small">{t('admin.approve')}</Button>
          </Popconfirm>
          <Popconfirm title={t('admin.confirmReject')} onConfirm={() => handleReject(record.id)}>
            <Button type="link" danger size="small">{t('admin.reject')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>{t('nav.adminComments')}</h2>
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={pendingReviews}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: t('common.noData') }}
        />
      </Spin>
    </div>
  );
}
