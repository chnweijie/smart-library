
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Modal, Input, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.replace('T', ' ').substring(0, 19);
}

export default function AdminReview() {
  const { t } = useTranslation();
  const { reviewRequests, fetchReviewRequests, approveReturn, rejectReturn, fetchBooks } = useStore();
  const [loading, setLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchReviewRequests().finally(() => setLoading(false));
  }, [fetchReviewRequests]);

  const mappedRequests = reviewRequests.map(r => ({
    ...r,
    user: r.user?.username || r.user,
    book: r.book?.title || r.book,
    time: formatDate(r.createdAt),
    status: r.status ? r.status.toLowerCase() : r.status,
  }));

  const handleApprove = async (id) => {
    try {
      await approveReturn(id);
      fetchBooks({ page: 1, size: 100 });
      message.success(t('admin.approved'));
    } catch (e) {
      message.error(e.message || t('common.error'));
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      await rejectReturn(rejectingId, rejectReason);
      message.success(t('admin.rejected'));
      setRejectModalOpen(false);
      setRejectingId(null);
      setRejectReason('');
    } catch (e) {
      message.error(e.message || t('common.error'));
    }
  };

  const openRejectModal = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const columns = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('admin.reviewUser'),
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: t('admin.reviewBook'),
      dataIndex: 'book',
      key: 'book',
    },
    {
      title: t('admin.applyTime'),
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: t('profile.accountStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        let color = 'blue';
        if (status === 'pending') color = 'orange';
        if (status === 'approved') color = 'green';
        if (status === 'rejected') color = 'red';
        return (
          <Space direction="vertical" size={0}>
            <Tag color={color}>{t(`admin.status.${status}`)}</Tag>
            {record.rejectReason && <span style={{ fontSize: 12, color: '#999' }}>{record.rejectReason}</span>}
          </Space>
        );
      },
    },
    {
      title: t('admin.reviewManagement'),
      key: 'action',
      render: (_, record) => {
        if (record.status !== 'pending') {
          return <span style={{ color: '#999' }}>{t('admin.processed')}</span>;
        }
        return (
          <Space size="small">
            <Popconfirm
              title={t('admin.confirmApprove')}
              onConfirm={() => handleApprove(record.id)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button type="link" size="small">{t('admin.approve')}</Button>
            </Popconfirm>
            <Button type="link" danger size="small" onClick={() => openRejectModal(record.id)}>
              {t('admin.reject')}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>{t('admin.reviewManagement')}</h2>
      <Spin spinning={loading}>
        <Table
          dataSource={mappedRequests}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>
      <Modal
        title={t('admin.rejectReason') || '驳回原因'}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectingId(null); setRejectReason(''); }}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
      >
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('admin.rejectReasonPlaceholder') || '请输入驳回原因'}
        />
      </Modal>
    </div>
  );
}
