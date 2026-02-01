package com.wellnest.app.service;

import com.wellnest.app.model.User;
import com.wellnest.app.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @org.springframework.beans.factory.annotation.Value("${admin.username}")
    private String adminUsername;

    @org.springframework.beans.factory.annotation.Value("${admin.password}")
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

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(user.getRole())));
    }
}
