package com.deliveriq.backend.service;

import com.deliveriq.backend.model.User;
import com.deliveriq.backend.repository.UserRepository;
import com.deliveriq.backend.util.HashUtil;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Verifies username and password. Returns the User object if valid, otherwise empty.
     */
    public Optional<User> login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (HashUtil.verify(password, user.getPassword())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }
}
