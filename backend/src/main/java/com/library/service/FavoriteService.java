package com.library.service;

import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.entity.Book;
import com.library.entity.Favorite;
import com.library.repository.BookRepository;
import com.library.repository.FavoriteRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 收藏服务
 */
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    /**
     * 切换收藏状态
     *
     * @return true=添加收藏, false=取消收藏
     */
    @Transactional
    public boolean toggleFavorite(Long userId, Long bookId) {
        userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        bookRepository.findById(bookId)
                .orElseThrow(() -> BusinessException.notFound("图书不存在"));

        if (favoriteRepository.existsByUserIdAndBookId(userId, bookId)) {
            // 取消收藏
            favoriteRepository.deleteByUserIdAndBookId(userId, bookId);
            return false;
        } else {
            // 添加收藏
            Favorite favorite = new Favorite();
            favorite.setUserId(userId);
            favorite.setBookId(bookId);
            userRepository.findById(userId).ifPresent(favorite::setUser);
            bookRepository.findById(bookId).ifPresent(favorite::setBook);
            favoriteRepository.save(favorite);
            return true;
        }
    }

    /**
     * 获取用户收藏列表
     */
    @Transactional(readOnly = true)
    public PageResult<Favorite> getUserFavorites(Long userId, int page, int size) {
        userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("用户不存在"));

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Favorite> favoritePage = favoriteRepository.findByUserId(userId, pageable);
        return PageResult.of(favoritePage.getContent(), favoritePage.getTotalElements(), page, size);
    }

    /**
     * 检查是否已收藏
     */
    @Transactional(readOnly = true)
    public boolean isFavorite(Long userId, Long bookId) {
        return favoriteRepository.existsByUserIdAndBookId(userId, bookId);
    }
}
