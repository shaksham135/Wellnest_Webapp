package com.wellnest.app.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    public void sendContactMessage(String userEmail, String topic, String content) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true);

            // Set the "From" name to include the user's email, so it shows up in the inbox
            // e.g. "shaksham135@gmail.com (via Wellnest)"
            helper.setFrom(fromEmail, userEmail + " (via Wellnest)");
            helper.setTo(fromEmail);
            helper.setReplyTo(userEmail); // This ensures "Reply" goes to the user
            helper.setSubject("Support: " + topic);
            helper.setText("You received a new inquiry:\n\n" +
                    "From: " + userEmail + "\n" +
                    "Topic: " + topic + "\n\n" +
                    "Message:\n" + content);

            mailSender.send(message);
            System.out.println("Email sent successfully to " + fromEmail);
        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Wellnest Password Reset OTP");
            message.setText("Hello,\n\n" +
                    "Your One-Time Password (OTP) for password reset is: " + otp + "\n\n" +
                    "This code will expire in 10 minutes. Please enter this on the website to set your new password.\n\n" +
                    "If you did not request this, please ignore this email.\n\n" +
                    "Thank you,\nThe Wellnest Team");

            mailSender.send(message);
            System.out.println("Password reset email sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println(
                    "CRITICAL ERROR: Failed to send password reset email to " + toEmail + ". Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
