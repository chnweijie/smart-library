package com.library.service;

import com.library.common.BusinessException;
import com.library.entity.Category;
import com.library.repository.BookRepository;
import com.library.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "'all'")
    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByIdAsc();
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public Category createCategory(String name) {
        if (categoryRepository.existsByName(name)) {
            throw BusinessException.badRequest("分类名称已存在");
        }

        Category category = new Category();
        category.setName(name);

        return categoryRepository.save(category);
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public Category updateCategory(Long id, String name) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("分类不存在"));

        if (name != null && !name.equals(category.getName())) {
            if (categoryRepository.existsByName(name)) {
                throw BusinessException.badRequest("分类名称已存在");
            }
            category.setName(name);
        }

        return categoryRepository.save(category);
    }

    @Transactional
    @CacheEvict(value = {"categories", "books", "bookDetail"}, allEntries = true)
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("分类不存在"));

        long bookCount = bookRepository.countByCategoryId(id);
        if (bookCount > 0) {
            throw BusinessException.badRequest("该分类下存在图书，无法删除");
        }

        categoryRepository.delete(category);
    }
}
