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

### Deploying to Vercel (with push/pull permissions only)

If you only have push and pull permissions to the repository (not admin access), you can still deploy using Vercel by forking the repository:

1. **Fork the repository:**
    - Go to the original repository on GitHub
    - Click "Fork" in the top-right corner
    - This creates a copy in your GitHub account

2. **Connect to Vercel:**
    - Go to [vercel.com](https://vercel.com) and sign in
    - Click "New Project"
    - Import your forked repository
    - Vercel will detect the `vercel.json` configuration

3. **Configure Environment Variables:**
    - In your Vercel project dashboard, go to Settings → Environment Variables
    - Add the same variables as in your `.env` file:
        - `ADMIN_MONGO_URI`
        - `SNIP_MONGO_URI`
        - `JWT_SECRET`

4. **Deploy:**
    - Click "Deploy"
    - Vercel will build and deploy your backend
    - You'll get a deployment URL (e.g., `https://your-project.vercel.app`)

5. **Update the README:**
    - Replace the deployment link in this README with your actual Vercel URL

### Alternative Deployment Options

- **Railway:** `railway login` → `railway link` → `railway up`
- **Heroku:** `heroku create` → `git push heroku main`
- **Render:** Connect GitHub repo and configure environment variables

The application is deployed on Vercel. Access it here: [Smart Plot Investment Portal](https://smart-plot-investment-portal.vercel.app)

For backend deployment, consider platforms like Heroku, Railway, or Vercel Functions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
