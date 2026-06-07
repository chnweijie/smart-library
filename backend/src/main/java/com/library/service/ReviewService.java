package com.library.service;

import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.review.ReplyResponse;
import com.library.dto.review.ReviewCreateRequest;
import com.library.dto.review.ReviewResponse;
import com.library.dto.review.ReviewUpdateRequest;
import com.library.entity.Book;
import com.library.entity.BookReview;
import com.library.entity.ReviewLike;
import com.library.entity.ReviewReply;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.BookReviewRepository;
import com.library.repository.ReviewLikeRepository;
import com.library.repository.ReviewReplyRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 评价服务
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final BookReviewRepository bookReviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final ReviewReplyRepository reviewReplyRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * 创建评价
     */
    @Transactional
    public BookReview createReview(Long userId, ReviewCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> BusinessException.notFound("图书不存在"));

        List<BookReview> existingReviews = bookReviewRepository.findByBookIdAndUserId(request.getBookId(), userId);
        if (!existingReviews.isEmpty()) {
            throw BusinessException.badRequest("您已评价过该图书，不能重复评价");
        }

        BookReview review = new BookReview();
        review.setUserId(userId);
        review.setUser(user);
        review.setBookId(request.getBookId());
        review.setBook(book);
        review.setRating(request.getRating());
        review.setContent(request.getContent());
        review.setLikeCount(0);
        review.setReplyCount(0);
        review.setIsDeleted(false);
        review.setAuditStatus(BookReview.AuditStatus.PENDING);

        return bookReviewRepository.save(review);
    }

    /**
     * 更新评价
     */
    @Transactional
    public BookReview updateReview(Long userId, Long reviewId, ReviewUpdateRequest request) {
        BookReview review = findReviewById(reviewId);

        if (!review.getUserId().equals(userId)) {
            throw BusinessException.forbidden("无权修改他人的评价");
        }

        if (request.getRating() != null) {
            review.setRating(request.getRating());
        }

        if (request.getContent() != null) {
            review.setContent(request.getContent());
        }

        return bookReviewRepository.save(review);
    }

    /**
     * 删除评价（软删除）
     */
    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        BookReview review = findReviewById(reviewId);

        if (!review.getUserId().equals(userId)) {
            throw BusinessException.forbidden("无权删除他人的评价");
        }

        review.setIsDeleted(true);
        bookReviewRepository.save(review);
    }

    /**
     * 获取图书评价列表
     */
    @Transactional(readOnly = true)
    public PageResult<ReviewResponse> getBookReviews(Long bookId, String sort, int page, int size) {
        Sort sortObj;
        if ("rating".equalsIgnoreCase(sort)) {
            sortObj = Sort.by(Sort.Direction.DESC, "rating");
        } else if ("helpful".equalsIgnoreCase(sort)) {
            sortObj = Sort.by(Sort.Direction.DESC, "likeCount");
        } else {
            sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        Pageable pageable = PageRequest.of(page - 1, size, sortObj);
        Page<BookReview> reviewPage = bookReviewRepository.findByBookIdAndIsDeletedFalseAndAuditStatus(
                bookId, BookReview.AuditStatus.APPROVED, pageable);

        Page<ReviewResponse> responsePage = reviewPage.map(this::convertToResponse);
        return PageResult.of(responsePage.getContent(), responsePage.getTotalElements(), page, size);
    }

    /**
     * 点赞/取消点赞评价
     */
    @Transactional
    public boolean voteHelpful(Long userId, Long reviewId) {
        BookReview review = findReviewById(reviewId);

        if (reviewLikeRepository.existsByReviewIdAndUserId(reviewId, userId)) {
            // 取消点赞
            reviewLikeRepository.deleteByReviewIdAndUserId(reviewId, userId);
            review.setLikeCount(Math.max(0, review.getLikeCount() - 1));
            bookReviewRepository.save(review);
            return false; // 表示取消点赞
        } else {
            // 点赞
            ReviewLike like = new ReviewLike();
            like.setReviewId(reviewId);
            like.setUserId(userId);
            like.setReview(review);
            userRepository.findById(userId).ifPresent(like::setUser);
            reviewLikeRepository.save(like);

            review.setLikeCount(review.getLikeCount() + 1);
            bookReviewRepository.save(review);

            // 通知评价作者
            if (!userId.equals(review.getUserId())) {
                notificationService.createNotification(
                        review.getUserId(),
                        7,
                        "评价被点赞",
                        "您的评价收到了一个点赞",
                        "REVIEW",
                        reviewId
                );
            }

            return true; // 表示添加点赞
        }
    }

    /**
     * 添加回复
     */
    @Transactional
    public ReplyResponse addReply(Long userId, Long reviewId, String content, Long replyToUserId) {
        BookReview review = findReviewById(reviewId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        ReviewReply reply = new ReviewReply();
        reply.setReviewId(reviewId);
        reply.setUserId(userId);
        reply.setContent(content);
        reply.setIsDeleted(false);
        reply.setReview(review);
        reply.setUser(user);
        reply.setReplyToUserId(replyToUserId);

        ReviewReply savedReply = reviewReplyRepository.save(reply);

        // 更新回复数
        review.setReplyCount(review.getReplyCount() + 1);
        bookReviewRepository.save(review);

        // 通知评价作者
        if (!userId.equals(review.getUserId())) {
            notificationService.createNotification(
                    review.getUserId(),
                    7,
                    "评价被回复",
                    "您的评价收到了一条回复",
                    "REVIEW",
                    reviewId
            );
        }

        return convertToReplyResponse(savedReply);
    }

    /**
     * 获取待审核评价列表（管理员）
     */
    @Transactional(readOnly = true)
    public PageResult<BookReview> getPendingReviews(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<BookReview> reviewPage = bookReviewRepository.findByAuditStatus(
                BookReview.AuditStatus.PENDING, pageable);
        return PageResult.of(reviewPage.getContent(), reviewPage.getTotalElements(), page, size);
    }

    /**
     * 审核通过评价（管理员）
     */
    @Transactional
    public BookReview approveReview(Long reviewId) {
        BookReview review = findReviewById(reviewId);
        review.setAuditStatus(BookReview.AuditStatus.APPROVED);
        review.setIsDeleted(false);
        return bookReviewRepository.save(review);
    }

    /**
     * 审核驳回评价（管理员）
     */
    @Transactional
    public BookReview rejectReview(Long reviewId) {
        BookReview review = findReviewById(reviewId);
        review.setAuditStatus(BookReview.AuditStatus.REJECTED);
        review.setIsDeleted(true);
        return bookReviewRepository.save(review);
    }

    /**
     * 管理员删除评价（软删除）
     */
    @Transactional
    public void adminDeleteReview(Long reviewId) {
        BookReview review = findReviewById(reviewId);
        review.setIsDeleted(true);
        bookReviewRepository.save(review);
    }

    /**
     * 管理员删除回复（软删除）
     */
    @Transactional
    public void adminDeleteReply(Long replyId) {
        ReviewReply reply = reviewReplyRepository.findById(replyId)
                .orElseThrow(() -> BusinessException.notFound("回复不存在"));
        reply.setIsDeleted(true);
        reviewReplyRepository.save(reply);
        // 更新评论的回复数
        BookReview review = findReviewById(reply.getReviewId());
        review.setReplyCount(Math.max(0, review.getReplyCount() - 1));
        bookReviewRepository.save(review);
    }

    /**
     * 根据ID查找评价
     */
    private BookReview findReviewById(Long id) {
        return bookReviewRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("评价不存在"));
    }

    /**
     * 将评价实体转换为响应DTO
     */
    private ReviewResponse convertToResponse(BookReview review) {
        List<ReviewReply> replies = reviewReplyRepository.findByReviewIdAndIsDeletedFalseOrderByCreatedAtAsc(review.getId());

        List<ReplyResponse> replyResponses = replies.stream()
                .map(this::convertToReplyResponse)
                .collect(Collectors.toList());

        return ReviewResponse.builder()
                .id(review.getId())
                .bookId(review.getBookId())
                .userId(review.getUserId())
                .username(review.getUser() != null ? review.getUser().getUsername() : null)
                .nickname(review.getUser() != null ? review.getUser().getNickname() : null)
                .rating(review.getRating())
                .content(review.getContent())
                .likeCount(review.getLikeCount())
                .replyCount(review.getReplyCount())
                .auditStatus(review.getAuditStatus() != null ? review.getAuditStatus().name() : null)
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .replies(replyResponses)
                .build();
    }

    /**
     * 将回复实体转换为响应DTO
     */
    private ReplyResponse convertToReplyResponse(ReviewReply reply) {
        String replyToNickname = null;
        if (reply.getReplyToUserId() != null) {
            replyToNickname = userRepository.findById(reply.getReplyToUserId())
                    .map(u -> u.getNickname() != null ? u.getNickname() : u.getUsername())
                    .orElse(null);
        }

        return ReplyResponse.builder()
                .id(reply.getId())
                .reviewId(reply.getReviewId())
                .userId(reply.getUserId())
                .username(reply.getUser() != null ? reply.getUser().getUsername() : null)
                .nickname(reply.getUser() != null ? reply.getUser().getNickname() : null)
                .replyToUserId(reply.getReplyToUserId())
                .replyToNickname(replyToNickname)
                .content(reply.getContent())
                .createdAt(reply.getCreatedAt())
                .build();
    }
}
