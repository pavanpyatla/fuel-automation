package com.deliveriq.backend.controller;

import com.deliveriq.backend.model.User;
import com.deliveriq.backend.service.UserService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userService.login(request.getUsername(), request.getPassword());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Generate a simple token: "username:role" encoded in Base64
            String tokenData = user.getUsername() + ":" + user.getRole();
            String token = Base64.getEncoder().encodeToString(tokenData.getBytes());
            
            return ResponseEntity.ok(new LoginResponse(
                    token,
                    user.getUsername(),
                    user.getRole(),
                    user.getFullName()
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginResponse {
        private String token;
        private String username;
        private String role;
        private String fullName;
    }
}
