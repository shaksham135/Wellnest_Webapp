package com.wellnest.app.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                String firebaseJson = System.getenv("FIREBASE_JSON");
                GoogleCredentials credentials;

                if (firebaseJson != null && !firebaseJson.isBlank()) {
                    System.out.println("Initializing Firebase using FIREBASE_JSON environment variable...");
                    credentials = GoogleCredentials.fromStream(
                        new java.io.ByteArrayInputStream(firebaseJson.getBytes())
                    );
                } else {
                    System.out.println("Initializing Firebase using Application Default Credentials...");
                    credentials = GoogleCredentials.getApplicationDefault();
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("Firebase Application has been initialized successfully.");
            }
        } catch (IOException e) {
            System.err.println("Firebase initialization failed: " + e.getMessage());
            System.err.println("Push notifications will be disabled. To fix this on Render, set the FIREBASE_JSON environment variable.");
        }
    }
}
