CREATE DATABASE userDB;
USE userDB;
CREATE TABLE users (
    username varchar(80) PRIMARY KEY,
    password varchar(41) NOT NULL
);
INSERT INTO users 
    (username, password)
VALUES 
    ('root', 'root'),
    ('user1', 'pass1'),
    ('user2', 'pass2'),
    ('user3', 'pass3');

