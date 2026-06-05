package com.wellnest.app.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from.email:Wellnest <onboarding@resend.dev>}")
    private String resendFromEmail;

    @Async
    public void sendContactMessage(String userEmail, String topic, String content) {
        String subject = "Support: " + topic;
        String body = "You received a new inquiry:\n\n" +
                "From: " + userEmail + "\n" +
                "Topic: " + topic + "\n\n" +
                "Message:\n" + content;

        // Try Resend first
        if (sendViaResend(fromEmail, userEmail, subject, body)) {
            return;
        }

        // Fallback to SMTP
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true);

            // Set the "From" name to include the user's email, so it shows up in the inbox
            // e.g. "shaksham135@gmail.com (via Wellnest)"
            helper.setFrom(fromEmail, userEmail + " (via Wellnest)");
            helper.setTo(fromEmail);
            helper.setReplyTo(userEmail); // This ensures "Reply" goes to the user
            helper.setSubject(subject);
            helper.setText(body);

            mailSender.send(message);
            System.out.println("Email sent successfully via SMTP to " + fromEmail);
        } catch (Exception e) {
            System.err.println("Error sending email via SMTP: " + e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String otp) {
        String subject = "Wellnest Password Reset OTP";
        String body = "Hello,\n\n" +
                "Your One-Time Password (OTP) for password reset is: " + otp + "\n\n" +
                "This code will expire in 10 minutes. Please enter this on the website to set your new password.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Thank you,\nThe Wellnest Team";

        // Try Resend first
        if (sendViaResend(toEmail, null, subject, body)) {
            return;
        }

        // Fallback to SMTP
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            System.out.println("Password reset email sent successfully via SMTP to " + toEmail);
        } catch (Exception e) {
            System.err.println(
                    "CRITICAL ERROR: Failed to send password reset email via SMTP to " + toEmail + ". Error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private boolean sendViaResend(String toEmail, String replyToEmail, String subject, String textBody) {
        if (resendApiKey == null || resendApiKey.trim().isEmpty()) {
            return false;
        }
        try {
            // Build JSON payload manually to avoid requiring extra libraries
            String escapedTextBody = textBody.replace("\\", "\\\\")
                                             .replace("\"", "\\\"")
                                             .replace("\n", "\\n")
                                             .replace("\r", "\\r");
            
            String replyToPart = "";
            if (replyToEmail != null && !replyToEmail.trim().isEmpty()) {
                replyToPart = String.format(",\"replyTo\":\"%s\"", replyToEmail.replace("\"", "\\\""));
            }
            
            String jsonPayload = String.format(
                "{\"from\":\"%s\",\"to\":[\"%s\"],\"subject\":\"%s\",\"text\":\"%s\"%s}",
                resendFromEmail.replace("\"", "\\\""),
                toEmail.replace("\"", "\\\""),
                subject.replace("\"", "\\\""),
                escapedTextBody,
                replyToPart
            );

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, java.nio.charset.StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("Email sent successfully via Resend API to " + toEmail + ". Response: " + response.body());
                return true;
            } else {
                System.err.println("Resend API error (status: " + response.statusCode() + "): " + response.body());
                return false;
            }
        } catch (Exception e) {
            System.err.println("Exception sending email via Resend API: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
