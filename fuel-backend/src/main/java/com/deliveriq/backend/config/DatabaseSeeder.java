package com.deliveriq.backend.config;

import com.deliveriq.backend.model.User;
import com.deliveriq.backend.repository.UserRepository;
import com.deliveriq.backend.util.HashUtil;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    public DatabaseSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Seed Manager
            User manager = new User();
            manager.setUsername("manager");
            manager.setPassword(HashUtil.hash("manager123"));
            manager.setRole("MANAGER");
            manager.setFullName("HP Fuel Station Manager");
            userRepository.save(manager);

            // Seed Owner
            User owner = new User();
            owner.setUsername("owner");
            owner.setPassword(HashUtil.hash("owner123"));
            owner.setRole("OWNER");
            owner.setFullName("Fuel Station Owner");
            userRepository.save(owner);

            System.out.println("==================================================================");
            System.out.println("DATABASE SEEDED WITH DEFAULT ACCOUNTS:");
            System.out.println("  1. Manager: username='manager', password='manager123'");
            System.out.println("  2. Owner:   username='owner',   password='owner123'");
            System.out.println("==================================================================");
        }
    }
}
