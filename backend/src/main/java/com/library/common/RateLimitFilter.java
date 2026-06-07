package com.library.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 简易限流过滤器
 * 基于IP地址进行请求限流，默认每分钟100次请求
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_SIZE_MS = 60_000L; // 1分钟时间窗口
    private static final long MAX_REQUESTS_PER_WINDOW = 100; // 每个窗口最大请求数

    private final ConcurrentHashMap<String, RequestCounter> counterMap = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 请求计数器
     */
    static class RequestCounter {
        private final AtomicLong count = new AtomicLong(0);
        private volatile long windowStart;

        public RequestCounter() {
            this.windowStart = System.currentTimeMillis();
        }

        public long incrementAndGet() {
            long now = System.currentTimeMillis();
            if (now - windowStart >= WINDOW_SIZE_MS) {
                synchronized (this) {
                    if (now - windowStart >= WINDOW_SIZE_MS) {
                        windowStart = now;
                        count.set(0);
                    }
                }
            }
            return count.incrementAndGet();
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String clientIp = getClientIpAddress(request);
        RequestCounter counter = counterMap.computeIfAbsent(clientIp, k -> new RequestCounter());

        long requestCount = counter.incrementAndGet();
        if (requestCount > MAX_REQUESTS_PER_WINDOW) {
            log.warn("IP {} 请求频率超限: {}/分钟", clientIp, requestCount);
            sendTooManyRequestsResponse(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 获取客户端真实IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多个代理时取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * 返回429 Too Many Requests响应
     */
    private void sendTooManyRequestsResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_REQUEST_TIMEOUT);
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Result<Object> result = Result.error(429, "请求过于频繁，请稍后再试");
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}
