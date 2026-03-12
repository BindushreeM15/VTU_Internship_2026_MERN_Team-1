# Smart Plot Investment Portal

A MERN stack application for smart plot investments with role-based access control.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Testing with Postman](#testing-with-postman)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git
- Postman (for API testing)

## Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/VTU_Internship_2026_MERN_Team-1.git
    cd VTU_Internship_2026_MERN_Team-1
    ```

2. **Navigate to the backend directory:**

    ```bash
    cd Smart-Plot-Investment-Portal/backend
    ```

3. **Install dependencies:**
    ```bash
    npm install
    ```

## Environment Setup

1. **Create a `.env` file in the backend directory:**

    ```bash
    cp .env.example .env
    ```

2. **Update the environment variables in `.env`:**

    ```env
    # MongoDB connection strings for separate databases
    ADMIN_MONGO_URI=mongodb://username:password@host:port/admin_db
    SNIP_MONGO_URI=mongodb://username:password@host:port/snip_db

    # JWT secret used for signing tokens (keep this secret in production)
    JWT_SECRET=your_jwt_secret_here

    # Optional port override
    PORT=5000
    ```

    - Replace `username`, `password`, `host`, `port` with your MongoDB credentials.
    - Use different database names (e.g., `admin_db` and `snip_db`) to avoid Atlas restrictions.
    - Generate a secure `JWT_SECRET`.

    **Note:** For Vercel deployment, set these same environment variables in your Vercel project settings.

3. **Start the development server:**

    ```bash
    npm run dev
    ```

4. **Verify the server is running:**
    - Open your browser and go to `http://localhost:5000`
    - You should see: "Smart Plot Investment Portal API Running"
    - Check console for: "Admin DB Connected" and "Snip DB Connected"

## API Endpoints

### Authentication Routes

- **POST** `/api/auth/signup` - User registration
    - Body: `{ "name": "string", "email": "string", "password": "string", "phone": "string", "role": "investor|builder|admin" }`
    - Response: `{ "message": "User created successfully" }`

- **POST** `/api/auth/login` - User login
    - Body: `{ "email": "string", "password": "string", "role": "investor|builder|admin" }`
    - Response: `{ "message": "Login successful", "token": "jwt_token", "user": {...} }`

### Test Routes

- **GET** `/api/public` - Public endpoint (no authentication required)
    - Response: `{ "message": "This is a public endpoint" }`

- **GET** `/api/protected` - Protected endpoint (requires JWT token)
    - Headers: `Authorization: Bearer <jwt_token>`
    - Response: `{ "message": "You accessed a protected endpoint", "user": {...} }`

- **GET** `/api/admin` - Admin-only endpoint (requires admin role)
    - Headers: `Authorization: Bearer <jwt_token>`
    - Response: `{ "message": "Hello Admin", "user": {...} }`

## Testing with Postman

1. **Set up Postman Environment:**
    - Create a new environment named "SPIP-Backend"
    - Add variables:
        - `baseUrl`: `http://localhost:5000`
        - `jwtToken`: (leave blank, will be set automatically)

2. **Test Signup:**
    - Method: POST
    - URL: `{{baseUrl}}/api/auth/signup`
    - Body (raw JSON):
        ```json
        {
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
            "phone": "1234567890",
            "role": "investor"
        }
        ```

---

## Frontend setup

The repository includes a React frontend located at `Smart-Plot-Investment-Portal/frontend`.

1. **Change to the frontend folder:**
   ```bash
   cd Smart-Plot-Investment-Portal/frontend
   ```
2. **Install packages:**
   ```bash
   npm install
   ```
3. **Create `.env` or update the existing one:**
   ```env
   VITE_API_URL=http://localhost:5001
   # or https://smart-plot-investment-backend.vercel.app
   ```
4. **Run the dev server:**
   ```bash
   npm run dev
   ```

> If the browser shows "localhost refused to connect", make sure the dev script above is running in the frontend directory and look at the terminal output – Vite should report:
>
> ```
>   VITE v3.x.x  ready in xxx ms
>   ➜  Local:   http://localhost:3000/
>   ➜  Network: use --host to expose
> ```
>
> The server listens on port 3000 (configured in `vite.config.js`); adjust your address accordingly.

The UI will open at `http://localhost:3000` by default. It includes signup, login, home, and a protected dashboard page; it uses TailwindCSS, Shadcn-style components, toast notifications, and basic form validation.

---

## Deployment

The application is deployed on Vercel. Access it here: [Smart Plot Investment Backend](https://smart-plot-investment-backend.vercel.app)

For backend deployment, consider platforms like Heroku, Railway, or Vercel Functions.

3. **Test Login:**
    - Method: POST
    - URL: `{{baseUrl}}/api/auth/login`
    - Body (raw JSON):
        ```json
        {
            "email": "test@example.com",
            "password": "password123",
            "role": "investor"
        }
        ```
    - Add this to Tests tab to auto-save token:
        ```javascript
        if (pm.response.code === 200 && pm.response.json().token) {
            pm.environment.set("jwtToken", pm.response.json().token);
        }
        ```

4. **Test Protected Routes:**
    - For `/api/protected` and `/api/admin`:
        - Authorization: Bearer Token
        - Token: `{{jwtToken}}`

5. **Test Public Route:**
    - GET `{{baseUrl}}/api/public` (no auth needed)

## Deployment

The application is deployed on Vercel. Access it here: [Smart Plot Investment Backend](https://smart-plot-investment-backend.vercel.app)

For backend deployment, consider platforms like Heroku, Railway, or Vercel Functions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
