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
            // If service-account.json exists, use it. Otherwise, look for GOOGLE_APPLICATION_CREDENTIALS
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("Firebase Application has been initialized");
            }
        } catch (IOException e) {
            System.err.println("Firebase initialization failed: Default credentials not found. Push notifications will be disabled until setup.");
        }
    }
}
