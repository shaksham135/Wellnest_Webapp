package com.wellnest.app.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @org.springframework.beans.factory.annotation.Value("${app.jwt.secret:this_is_a_very_long_secret_key_change_it_to_secure_one_123456}")
    private String secretKey;

    private Key getSignInKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        final Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String generateToken(UserDetails userDetails) {
        long now = System.currentTimeMillis();
        long expiry = now + 1000L * 60 * 60 * 24 * 30; // 30 days

        // Extract role
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .orElse("USER");

        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .claim("role", role)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(expiry))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}
