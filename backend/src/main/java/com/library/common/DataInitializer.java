package com.library.common;

import com.library.entity.Book;
import com.library.entity.Category;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.CategoryRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 首次启动时初始化默认管理员账号和示例数据
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("数据库中已有用户，跳过初始化");
            return;
        }

        log.info("数据库无用户，开始初始化数据...");

        // 1. 创建默认管理员
        User admin = new User();
        admin.setUsername("admin");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setNickname("管理员");
        admin.setRole(User.UserRole.ADMIN);
        admin.setStatus(User.UserStatus.NORMAL);
        userRepository.save(admin);
        log.info("管理员账号创建成功: admin / admin123");

        // 2. 创建图书分类
        Category lit = createCategory("文学");
        Category sci = createCategory("科学技术");
        Category hist = createCategory("历史");
        Category phil = createCategory("哲学");
        Category art = createCategory("艺术");
        log.info("图书分类创建成功");

        // 3. 创建示例图书
        createBook("9787020002207", "活着", "余华", "作家出版社", lit,
                "《活着》是余华的代表作，讲述了一个普通人在社会变迁中的苦难与坚韧的生命故事。", 5, 5);
        createBook("9787536692930", "三体", "刘慈欣", "重庆出版社", sci,
                "《三体》是刘慈欣创作的系列长篇科幻小说，是中国科幻文学的里程碑之作。", 8, 8);
        createBook("9787108012799", "万历十五年", "黄仁宇", "三联书店", hist,
                "《万历十五年》是美籍华裔历史学家黄仁宇的明史研究专著。", 3, 3);
        createBook("9787544253994", "百年孤独", "加西亚·马尔克斯", "南海出版公司", lit,
                "《百年孤独》是哥伦比亚作家加西亚·马尔克斯的代表作，魔幻现实主义文学的经典。", 4, 4);
        createBook("9787506365437", "苏菲的世界", "乔斯坦·贾德", "作家出版社", phil,
                "《苏菲的世界》以小说的形式，通过一名哲学导师向一个叫苏菲的女孩传授哲学知识。", 6, 6);
        log.info("示例图书创建成功");

        log.info("数据初始化完成！");
    }

    private Category createCategory(String name) {
        Category c = new Category();
        c.setName(name);
        return categoryRepository.save(c);
    }

    private void createBook(String isbn, String title, String author, String publisher,
                             Category category, String description, int total, int available) {
        Book book = new Book();
        book.setIsbn(isbn);
        book.setTitle(title);
        book.setAuthor(author);
        book.setPublisher(publisher);
        book.setCategory(category);
        book.setDescription(description);
        book.setTotalCount(total);
        book.setAvailableCount(available);
        book.setStatus(Book.BookStatus.ON);
        bookRepository.save(book);
    }
}
