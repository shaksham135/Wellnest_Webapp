package com.wellnest.app.service;

import com.wellnest.app.model.User;
import com.wellnest.app.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @org.springframework.beans.factory.annotation.Value("${admin.username:admin123@gmail.com}")
    private String adminUsername;

    @org.springframework.beans.factory.annotation.Value("${admin.password:admin123}")
    private String adminPassword;

    private final UserRepository repo;

    public CustomUserDetailsService(UserRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        if (adminUsername != null && email.equals(adminUsername)) {
            return new org.springframework.security.core.userdetails.User(
                    adminUsername,
                    new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(adminPassword),
                    List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        }

        User user = repo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        String role = user.getRole();
        if (role != null && !role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                !user.isSuspended(),
                true,
                true,
                !user.isSuspended(),
                List.of(new SimpleGrantedAuthority(role != null ? role : "ROLE_USER")));
    }
}
