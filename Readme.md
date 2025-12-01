# APIs – Backend REST & Real-time API

A modern, scalable, and secure backend API built with **Node.js**, **TypeScript**, **Express**, and **MongoDB**. Features user authentication, file uploads, email sending, rate limiting, real-time communication via Socket.IO, and production-ready security practices.

## Features

- **TypeScript** for type safety and better developer experience
- **Express.js** with clean, modular architecture
- **MongoDB** + **Mongoose** ODM
- JWT-based authentication (`jsonwebtoken`)
- Password hashing with `bcrypt`
- File upload with **Cloudinary** integration (`multer` + `cloudinary`)
- Email service using **Nodemailer**
- Google OAuth2 login (`google-auth-library`)
- Real-time bidirectional communication with **Socket.IO**
- Security best practices:
  - Helmet
  - CORS
  - Rate limiting (`express-rate-limit`)
  - Compression
  - Cookie parser
- Logging with **Morgan**
- Environment configuration via **dotenv**
- Pre-configured linting, formatting, and git hooks (ESLint + Prettier + Husky)

## Tech Stack

| Category            | Technology                                  |
|---------------------|---------------------------------------------|
| Runtime             | Node.js                                     |
| Language            | TypeScript                                  |
| Framework           | Express.js                                  |
| Database            | MongoDB (Mongoose)                          |
| Auth                | JWT, Bcrypt, Google OAuth                   |
| Real-time           | Socket.IO                                   |
| File Storage        | Cloudinary                                  |
| Email               | Nodemailer                                  |
| Security & Utils    | helmet, cors, rate-limit, compression, etc. |

## Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail/App password or other SMTP service (for Nodemailer)
- Google OAuth credentials (optional)

## Installation

```bash
git clone https://github.com/your-username/apis.git
cd apis
npm install