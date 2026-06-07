
import React, { useState } from 'react';
import { Card, Avatar, Typography, Button, Space, Tag, Input, message, Rate, Popconfirm } from 'antd';
import { LikeOutlined, LikeFilled, CommentOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { formatDateTime } from '../utils/userDisplay';
import request from '../api/request';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function BookReview({ review, onReply }) {
  const { t } = useTranslation();
  const { voteHelpful, addReviewComment, currentUser, fetchBookReviews } = useStore();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localHasVoted, setLocalHasVoted] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(review.likeCount || 0);

  const handleVote = async () => {
    if (!currentUser) {
      message.warning(t('review.loginToVote'));
      return;
    }
    try {
      const resultKey = await voteHelpful(review.id);
      if (resultKey === 'review.voteSuccess') {
        setLocalHasVoted(true);
        setLocalLikeCount(prev => prev + 1);
      } else {
        setLocalHasVoted(false);
        setLocalLikeCount(prev => Math.max(0, prev - 1));
      }
      message.success(t(resultKey));
    } catch (e) {
      message.error(e.message || t('review.voteFailed'));
    }
  };

  const [replyToUser, setReplyToUser] = useState(null);
  const [replyToUserId, setReplyToUserId] = useState(null);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      message.warning(t('review.contentTooShort'));
      return;
    }
    setIsSubmitting(true);
    try {
      const resultKey = await addReviewComment(review.id, replyText, replyToUserId);
      message.success(t(resultKey));
      setReplyText('');
      setShowReply(false);
      setReplyToUser(null);
      setReplyToUserId(null);
      if (review.bookId) {
        fetchBookReviews(review.bookId);
      }
    } catch (e) {
      message.error(e.message || t('review.commentFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const replies = review.replies || [];

  const handleDeleteReply = async (replyId) => {
    try {
      await request.delete(`/reviews/reply/${replyId}/admin`);
      message.success(t('common.deleteSuccess'));
      if (review.bookId) {
        fetchBookReviews(review.bookId);
      }
    } catch (e) {
      message.error(e.message || t('common.deleteFailed'));
    }
  };

  const handleDeleteReview = async () => {
    try {
      await request.delete(`/reviews/${review.id}/admin`);
      message.success(t('common.deleteSuccess'));
      if (review.bookId) {
        fetchBookReviews(review.bookId);
      }
    } catch (e) {
      message.error(e.message || t('common.deleteFailed'));
    }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Avatar
              size={48}
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.username || ''}`}
              icon={<UserOutlined />}
            />
            <Space orientation="vertical" size={0}>
              <Text strong style={{ fontSize: 16 }}>{review.nickname || review.username || ''}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(review.createdAt)}</Text>
            </Space>
          </Space>
          <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
          {currentUser?.role === 2 && (
            <Popconfirm title={t('common.confirmDelete')} onConfirm={handleDeleteReview}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>

        <Paragraph style={{ fontSize: 15, lineHeight: 1.6 }}>{review.content}</Paragraph>

        {review.tags && review.tags.length > 0 && (
          <Space wrap>
            {review.tags.map(tag => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
          </Space>
        )}

        <Space>
          <Button 
            type="text" 
            icon={localHasVoted ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />}
            onClick={handleVote}
          >
            {localHasVoted ? t('review.helped') : t('review.helpful')} ({localLikeCount})
          </Button>
          <Button
            type="text"
            icon={<CommentOutlined />}
            onClick={() => {
              if (!currentUser) {
                message.warning(t('auth.loginToReview'));
                return;
              }
              setShowReply(!showReply);
            }}
          >
            {t('review.reply')} ({review.replyCount || replies.length})
          </Button>
        </Space>

        {showReply && (
          <Space orientation="vertical" style={{ width: '100%', paddingLeft: 16, borderLeft: '3px solid #f0f0f0' }}>
            <TextArea
              placeholder={replyToUser ? `${t('review.reply')} @${replyToUser}...` : t('review.replyPlaceholder')}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              style={{ resize: 'none' }}
            />
            <Space style={{ alignSelf: 'flex-end' }}>
              <Button onClick={() => { setShowReply(false); setReplyToUser(null); setReplyToUserId(null); }}>{t('common.cancel')}</Button>
              <Button type="primary" onClick={handleSubmitReply} loading={isSubmitting}>
                {t('review.reply')}
              </Button>
            </Space>
          </Space>
        )}

        {replies.length > 0 && (
          <Space orientation="vertical" style={{ width: '100%', paddingLeft: 16, borderLeft: '3px solid #f0f0f0' }}>
            {replies.map(reply => (
              <Card size="small" type="inner" key={reply.id}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Avatar size={24} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.username || ''}`} />
                    <Text strong>{reply.nickname || reply.username || ''}</Text>
                    {reply.replyToNickname && (
                      <Text type="secondary" style={{ fontSize: 12 }}>回复 @{reply.replyToNickname}</Text>
                    )}
                  </Space>
                  <Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(reply.createdAt)}</Text>
                    {currentUser?.role === 2 && (
                      <Popconfirm title={t('common.confirmDelete')} onConfirm={() => handleDeleteReply(reply.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    )}
                  </Space>
                </Space>
                <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{reply.content}</Paragraph>
                <Button
                  type="link"
                  size="small"
                  icon={<CommentOutlined />}
                  style={{ padding: 0, marginTop: 4 }}
                  onClick={() => {
                    if (!currentUser) {
                      message.warning(t('auth.loginToReview'));
                      return;
                    }
                    setReplyToUser(reply.nickname || reply.username);
                    setReplyToUserId(reply.userId);
                    setShowReply(true);
                  }}
                >
                  {t('review.reply')}
                </Button>
              </Card>
            ))}
          </Space>
        )}
      </Space>
    </Card>
  );
}
