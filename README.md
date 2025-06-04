# Football Field Finder

## Overview
Football Field Finder is a web application that allows users to search for soccer fields in their area. The application includes user authentication features, enabling users to register and log in before accessing the search functionality.

## Project Structure
```
football-field-finder
├── frontend
│   ├── index.html        # Main HTML document with login and registration modals
│   ├── css
│   │   └── style.css     # Styles for the frontend application
│   └── js
│       └── script.js     # JavaScript for handling user interactions
├── backend
│   ├── server.js         # Entry point for the backend application
│   ├── routes
│   │   ├── auth.js       # Routes for user authentication
│   │   └── fields.js     # Routes for managing soccer fields
│   ├── models
│   │   ├── User.js       # User model for the application
│   │   └── Field.js      # Field model for the application
│   ├── middleware
│   │   └── auth.js       # Middleware for authenticating users
│   └── config
│       └── database.js    # Database configuration
├── package.json           # npm configuration file
└── README.md              # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/football-field-finder.git
   ```

2. Navigate to the project directory:
   ```
   cd football-field-finder
   ```

3. Install the dependencies for both frontend and backend:
   - For the frontend, navigate to the `frontend` directory and install any necessary packages (if applicable).
   - For the backend, run:
   ```
   npm install
   ```

## Usage

1. Start the backend server:
   ```
   node backend/server.js
   ```

2. Open `frontend/index.html` in your web browser to access the application.

3. Users can register for an account or log in to access the soccer field search functionality.

## Features
- User registration and login
- Search for soccer fields based on location
- Responsive design for mobile and desktop users

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.