CREATE DATABASE userDB;
USE userDB;
CREATE TABLE users (
    `username` varchar(80) NOT NULL,
    `password` varchar(41) NOT NULL,
    `secret` char(32),
    PRIMARY KEY (`username`)
);
INSERT INTO users 
    (`username`, `password`)
VALUES 
    ('root', 'root'),
    ('user1', 'pass1'),
    ('user2', 'pass2'),
    ('user3', 'pass3');

CREATE TABLE memos (
    `id` int NOT NULL AUTO_INCREMENT, 
    `member` varchar(80) NOT NULL, 
    `task` varchar(100) NOT NULL,
    `done` BOOLEAN NOT NULL DEFAULT False,
    `priority` ENUM('low','middle', 'high') NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`member`) REFERENCES users(`username`)
);
INSERT INTO memos 
    (`member`, `task`, `done`, `priority`)
VALUES 
    ('root', 'Call Sam For payments', True, 'high'),
    ('user1', 'Office rent', False, 'middle'),
    ('user2', 'Office grocery shopping', False, 'low'),
    ('user3', 'Ask for Lunch to Clients', True, 'low'),
    ('root', 'Make payment to Bluedart', False, 'middle');
