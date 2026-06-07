import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Modal, Form, Input, InputNumber, Select, DatePicker, Upload, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useStore } from '../store/useStore';
import { uploadCover } from '../api/upload';

export default function AdminBooks() {
  const { t } = useTranslation();
  const { books, categories, fetchBooks, fetchCategories, deleteBook, updateBook, addBook } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBooks({ page: 1, size: 100 });
    fetchCategories();
  }, [fetchBooks, fetchCategories]);

  const columns = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('admin.bookTitle'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('admin.bookAuthor'),
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: t('admin.bookCategory'),
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: (categoryId) => {
        const cat = categories.find(c => c.id === categoryId);
        return <Tag color="blue">{cat ? t(`categories.${cat.name}`, { defaultValue: cat.name }) : categoryId}</Tag>;
      },
    },
    {
      title: t('admin.bookAvailable'),
      dataIndex: 'totalCount',
      key: 'totalCount',
    },
    {
      title: t('book.publishDate'),
      dataIndex: 'publishDate',
      key: 'publishDate',
      width: 120,
    },
    {
      title: t('book.location'),
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: t('admin.bookManagement'),
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditingBook(record);
              setCoverUrl(record.coverUrl || '');
              form.setFieldsValue({
                ...record,
                publishDate: record.publishDate ? dayjs(record.publishDate) : undefined,
              });
              setIsModalOpen(true);
            }}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('admin.deleteConfirm')}
            onConfirm={async () => {
              try {
                await deleteBook(record.id);
                message.success(t('admin.deleteSuccess'));
              } catch (e) {
                message.error(e.message || t('common.error'));
              }
            }}
            okText={t('common.okText')}
            cancelText={t('common.cancelText')}
          >
            <Button type="link" danger size="small">{t('common.delete')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCoverUpload = async (options) => {
    const { file } = options;
    setUploading(true);
    try {
      const res = await uploadCover(file);
      const url = res.data.url;
      setCoverUrl(url);
      form.setFieldsValue({ coverUrl: url });
      message.success(t('admin.uploadSuccess') || '封面上传成功');
    } catch (e) {
      message.error(e.message || t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.coverUrl = coverUrl;
      if (values.publishDate) {
        values.publishDate = values.publishDate.format('YYYY-MM-DD');
      }
      setSubmitting(true);
      if (editingBook) {
        await updateBook(editingBook.id, values);
        message.success(t('admin.updateSuccess'));
      } else {
        await addBook(values);
        message.success(t('admin.addSuccess'));
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingBook(null);
      setCoverUrl('');
    } catch (e) {
      if (e.message) {
        message.error(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditingBook(null);
    setCoverUrl('');
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>{t('admin.bookManagement')}</h2>
        <Button type="primary" onClick={() => {
          setEditingBook(null);
          setCoverUrl('');
          form.resetFields();
          setIsModalOpen(true);
        }}>
          {t('admin.addBook')}
        </Button>
      </div>
      <Table
        dataSource={books}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingBook ? t('admin.editBook') : t('admin.addBook')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label={t('admin.bookTitle')} rules={[
            { required: true, message: '请输入书名' },
            { max: 200, message: '书名不超过200个字符' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="author" label={t('admin.bookAuthor')} rules={[
            { required: true, message: '请输入作者' },
            { max: 100, message: '作者不超过100个字符' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="categoryId" label={t('admin.bookCategory')} rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder={t('admin.bookCategory')}>
              {categories.map(cat => (
                <Select.Option key={cat.id} value={cat.id}>{t(`categories.${cat.name}`, { defaultValue: cat.name })}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="totalCount" label={t('admin.bookAvailable')} rules={[
            { required: true, message: '请输入库存数量' },
          ]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isbn" label="ISBN" rules={[
            { max: 20, message: 'ISBN不超过20个字符' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="publisher" label={t('admin.bookPublisher')} rules={[
            { max: 100, message: '出版社不超过100个字符' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="publishDate" label={t('book.publishDate')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label={t('book.location')} rules={[
            { max: 100, message: '书架位置不超过100个字符' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('admin.bookDescription')} rules={[
            { max: 2000, message: '简介不超过2000个字符' },
          ]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label={t('admin.bookCover') || '图书封面'}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={handleCoverUpload}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {uploading ? (t('admin.uploading') || '上传中...') : (t('admin.uploadCover') || '上传封面')}
                </Button>
              </Upload>
              {coverUrl && (
                <Image
                  src={coverUrl}
                  alt="cover"
                  width={120}
                  height={160}
                  style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #d9d9d9' }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk2iMa1AAAAABJRU5ErkJggg=="
                />
              )}
            </Space>
          </Form.Item>
          <Form.Item name="coverUrl" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
