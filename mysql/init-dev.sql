CREATE DATABASE userDB;
USE userDB;
CREATE TABLE users (
<<<<<<< HEAD
    `username` varchar(80) NOT NULL,
    `password` varchar(41) NOT NULL,
    PRIMARY KEY (`username`)
);
INSERT INTO users 
    (`username`, `password`)
=======
    username varchar(80) PRIMARY KEY,
    password varchar(41) NOT NULL
);
INSERT INTO users 
    (username, password)
>>>>>>> 2258311 (first commit)
VALUES 
    ('root', 'root'),
    ('user1', 'pass1'),
    ('user2', 'pass2'),
    ('user3', 'pass3');

<<<<<<< HEAD
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
=======
>>>>>>> 2258311 (first commit)
