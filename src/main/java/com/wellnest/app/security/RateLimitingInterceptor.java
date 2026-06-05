package com.wellnest.app.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    @Value("${rate-limit.auth.capacity:2000}")
    private int authCapacity;

    @Value("${rate-limit.anon.capacity:300}")
    private int anonCapacity;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket createNewBucket(boolean isAuthenticated) {
        int capacity = isAuthenticated ? authCapacity : anonCapacity;
        Bandwidth limit = Bandwidth.classic(capacity, Refill.greedy(capacity, Duration.ofHours(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = false;
        String limitKey;

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            limitKey = "user:" + auth.getName();
            isAuthenticated = true;
        } else {
            // Retrieve actual client IP if behind reverse proxy/load balancer
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            } else {
                ip = ip.split(",")[0].trim();
            }
            limitKey = "ip:" + ip;
        }

        final boolean finalIsAuth = isAuthenticated;
        Bucket bucket = buckets.computeIfAbsent(limitKey, k -> createNewBucket(finalIsAuth));

        if (bucket.tryConsume(1)) {
            return true;
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Too many requests\", \"message\": \"Neural bandwidth exceeded. Please try again later.\"}");
            return false;
        }
    }
}
