package com.library.service;

import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.emotion.EmotionRecordRequest;
import com.library.entity.Book;
import com.library.entity.EmotionRecord;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.EmotionRecordRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 情绪分析服务
 */
@Service
@RequiredArgsConstructor
public class EmotionService {

    private final EmotionRecordRepository emotionRecordRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    /**
     * 情绪到分类的映射关系
     */
    private static final Map<String, List<String>> EMOTION_CATEGORY_MAP = new HashMap<>();

    static {
        EMOTION_CATEGORY_MAP.put("happy", List.of("文学", "艺术", "教育"));
        EMOTION_CATEGORY_MAP.put("sad", List.of("哲学", "文学", "教育"));
        EMOTION_CATEGORY_MAP.put("angry", List.of("历史", "哲学", "艺术"));
        EMOTION_CATEGORY_MAP.put("fear", List.of("科技", "教育", "哲学"));
        EMOTION_CATEGORY_MAP.put("fearful", List.of("科技", "教育", "哲学"));
        EMOTION_CATEGORY_MAP.put("surprise", List.of("科技", "艺术", "经济"));
        EMOTION_CATEGORY_MAP.put("surprised", List.of("科技", "艺术", "经济"));
        EMOTION_CATEGORY_MAP.put("disgust", List.of("经济", "历史", "教育"));
        EMOTION_CATEGORY_MAP.put("disgusted", List.of("经济", "历史", "教育"));
        EMOTION_CATEGORY_MAP.put("neutral", List.of("文学", "科技", "历史"));
    }

    /**
     * 记录情绪
     */
    @Transactional
    public EmotionRecord recordEmotion(Long userId, EmotionRecordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        EmotionRecord record = new EmotionRecord();
        record.setUserId(userId);
        record.setUser(user);
        record.setEmotion(request.getEmotion());
        record.setConfidence(request.getConfidence());

        if (request.getBookId() != null) {
            Book book = bookRepository.findById(request.getBookId())
                    .orElseThrow(() -> BusinessException.notFound("图书不存在"));
            record.setBookId(request.getBookId());
            record.setBook(book);
        }

        return emotionRecordRepository.save(record);
    }

    /**
     * 获取用户情绪历史
     */
    @Transactional(readOnly = true)
    public PageResult<EmotionRecord> getUserEmotionHistory(Long userId, int page, int size) {
        userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<EmotionRecord> recordPage = emotionRecordRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return PageResult.of(recordPage.getContent(), recordPage.getTotalElements(), page, size);
    }

    /**
     * 更新情绪记录关联的图书
     */
    @Transactional
    public void updateEmotionBookId(Long recordId, Long userId, Long bookId) {
        bookRepository.findById(bookId)
                .orElseThrow(() -> BusinessException.notFound("图书不存在"));

        int updated = emotionRecordRepository.updateBookId(recordId, userId, bookId);
        if (updated == 0) {
            throw BusinessException.notFound("情绪记录不存在或无权修改");
        }
    }

    /**
     * 根据情绪推荐图书
     */
    @Transactional(readOnly = true)
    public List<Book> getRecommendedBooks(String emotion) {
        List<String> preferredCategories = EMOTION_CATEGORY_MAP.getOrDefault(
                emotion.toLowerCase(), List.of("文学小说"));

        List<Book> allBooks = bookRepository.findByStatus(Book.BookStatus.ON);

        List<Book> matched = allBooks.stream()
                .filter(book -> book.getCategory() != null
                        && preferredCategories.contains(book.getCategory().getName()))
                .collect(Collectors.toList());

        if (matched.isEmpty()) {
            matched = allBooks;
        }

        List<Book> shuffled = new ArrayList<>(matched);
        Collections.shuffle(shuffled);
        return shuffled.subList(0, Math.min(6, shuffled.size()));
    }
}
