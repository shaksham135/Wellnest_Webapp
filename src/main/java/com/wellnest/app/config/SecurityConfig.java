package com.wellnest.app.config;

import com.wellnest.app.security.JwtAuthenticationFilter;
import com.wellnest.app.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
            JwtAuthenticationFilter jwtFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.csrf(csrf -> csrf.disable())
                // wire our CorsConfigurationSource bean into Spring Security
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll() // PRIORITIZE AUTH
                        .requestMatchers("/health", "/error").permitAll()
                        // Blog endpoints - allow public reading
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/blog/**").permitAll()
                        // Trainer endpoints - allow public reading
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/trainers/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/blog/posts/{id}/comments")
                        .permitAll()
                        .requestMatchers("/api/contact/**").permitAll() // Contact form public access
                        .requestMatchers("/api/chat/**").permitAll() // Chatbot public access
                        .requestMatchers("/api/activity/**").authenticated() // For mobile sync
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                        .anyRequest().authenticated() // rest require token
                )
                .authenticationProvider(authProvider())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS configuration source used by Spring Security.
     * IMPORTANT:
     * - Use the exact frontend origin (http://localhost:3000) — do NOT return
     * multiple origins in the header.
     * - If you set allowCredentials(true), Access-Control-Allow-Origin cannot be
     * "*".
     */
    @org.springframework.beans.factory.annotation.Value("${app.frontend.base-url:http://localhost:3000}")
    private String allowedOrigin;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Use restricted origins for production + native mobile safety
        // Use restricted origin patterns for production + native mobile safety
        // setAllowedOriginPatterns allows wildcards while still permitting credentials
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "capacitor://*",
            "http://localhost",
            "https://*.vercel.app",
            "https://*.onrender.com"
        ));

        // Fallback for the specific allowedOrigin environment variable if it's set 
        if (allowedOrigin != null && !allowedOrigin.isEmpty()) {
            config.addAllowedOrigin(allowedOrigin);
            if (allowedOrigin.endsWith("/")) {
                config.addAllowedOrigin(allowedOrigin.substring(0, allowedOrigin.length() - 1));
            } else {
                config.addAllowedOrigin(allowedOrigin + "/");
            }
        }
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // apply to all API paths
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
