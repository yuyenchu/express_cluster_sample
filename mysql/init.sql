CREATE DATABASE userDB;
USE userDB;
CREATE TABLE users (
    `username` varchar(80) NOT NULL,
    `password` varchar(41) NOT NULL,
    PRIMARY KEY (`username`)
);

CREATE TABLE memos (
    `id` int NOT NULL AUTO_INCREMENT, 
    `member` varchar(80) NOT NULL, 
    `task` varchar(100) NOT NULL,
    `done` BOOLEAN NOT NULL DEFAULT False,
    `priority` ENUM('low','middle', 'high') NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`member`) REFERENCES users(`username`)
);

