package com.wellnest.app.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, String> root() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("message", "Wellnest Backend is Live and Running!");
        status.put("api_base", "/api");
        return status;
    }
}
