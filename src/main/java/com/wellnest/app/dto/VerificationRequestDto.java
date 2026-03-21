package com.wellnest.app.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerificationRequestDto {
    private String certificate1; // base64-encoded image
    private String certificate2;
    private String certificate3;
}
