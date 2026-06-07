
import React, { useState } from 'react';
import { Card, Form, Input, Button, Rate, message, Space, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

const { TextArea } = Input;

export default function ReviewForm({ bookId, onSuccess }) {
  const { t } = useTranslation();
  const { addReview, currentUser, fetchBookReviews } = useStore();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const availableTags = [
    t('tags.recommended'),
    t('tags.mustRead'),
    t('tags.classic'),
    t('tags.touching'),
    t('tags.profound'),
    t('tags.interesting'),
    t('tags.practical'),
    t('tags.eyeOpening'),
    t('tags.sciFi'),
    t('tags.art'),
    t('tags.history'),
    t('tags.philosophy')
  ];

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    if (!currentUser) {
      message.warning(t('review.loginToReview'));
      return;
    }

    form.validateFields().then(async values => {
      if (values.content.length < 10) {
        message.warning(t('review.contentTooShort'));
        return;
      }

      setIsSubmitting(true);
      try {
        await addReview({
          bookId,
          ...values,
          tags: selectedTags
        });
        message.success(t('review.submitPending'));
        form.resetFields();
        setSelectedTags([]);
        if (bookId) {
          fetchBookReviews(bookId);
        }
        onSuccess?.();
      } catch (e) {
        message.error(e.message || t('review.submitFailed'));
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Card title={t('review.submit')} style={{ marginBottom: 24 }}>
      <Form form={form} layout="vertical">
        <Form.Item name="rating" label={t('review.rating')} rules={[{ required: true, message: t('review.rating') }]}>
          <Rate style={{ fontSize: 24 }} />
        </Form.Item>

        <Form.Item name="content" label={t('review.content')} rules={[{ required: true, message: t('review.content') }]}>
          <TextArea 
            rows={5} 
            placeholder={t('review.contentPlaceholder')}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item label={t('review.tags')}>
          <Space wrap>
            {availableTags.map(tag => (
              <Tag
                key={tag}
                color={selectedTags.includes(tag) ? 'blue' : 'default'}
                onClick={() => handleTagToggle(tag)}
                style={{ cursor: 'pointer', fontSize: 14, padding: '4px 12px' }}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        </Form.Item>

        <Form.Item>
          <Button type="primary" size="large" onClick={handleSubmit} loading={isSubmitting} block>
            {t('review.submit')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
