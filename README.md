# Shush App

Shush is a web-based application that allows you to run command-line utilities on your computer through the browser. It provides a user-friendly interface for managing and executing commands.

## Features

- **Command Management**: Add, run, and manage command-line processes with real-time output streaming.
- **Sidebar Navigation**: A collapsible sidebar for easy navigation between different utilities.
- **Authentication**: Secure login and admin account setup.
- **Theming**: Light and dark mode support with customizable themes.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Settings Management**: Configure application preferences and user settings.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (preferred package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sheeyang/shush
   cd shush
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file in the project root with the following content:

   ```
   DATABASE_URL="file:./dev.db"
   ```

4. Set up the database:
   ```bash
   pnpm prisma migrate dev --name init
   ```

### Running the Application

1. Start the development server:
   ```bash
   pnpm dev
   ```
2. Open your browser and navigate to `http://localhost:3000`.
3. If this is your first time, you'll be directed to the setup page to create an admin account.

### Building for Production

1. Build the application:
   ```bash
   pnpm build
   ```
2. Start the production server:
   ```bash
   pnpm start
   ```

## Project Structure

The project is organized into the following key directories:

- **`src/app`**: Contains the main application pages like `signin`, `setup`, and `settings`.
- **`src/components`**: Reusable UI components such as buttons, cards, sidebar, dropdown menus, and more.
- **`src/lib`**: Utility functions and backend logic, including process management, stream handling, and server-side operations.
- **`src/stores`**: State management for processes and other application data using Zustand.
- **`src/hooks`**: Custom React hooks.
- **`src/interfaces`**: TypeScript type definitions and interfaces.
- **`prisma`**: Database schema and migrations for SQLite database.

## Key Components

### Sidebar

The sidebar provides navigation and is collapsible. It includes:

- Page links (e.g., Settings).
- A mode toggle for switching between light and dark themes.

### Command Management

- **Command Cards**: Display individual processes with options to start, stop, and remove them.
- **Command Output**: Real-time streaming of process output in a resizable scroll area.

### Authentication

- **Sign In**: Login functionality with "Remember Me" support.
- **Setup**: Admin account creation with automatic login.

### Settings

- Configure application preferences and user settings.

## Technologies Used

- **React**: Frontend framework.
- **Next.js**: Server-side rendering and routing.
- **Radix UI**: Accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Zustand**: State management.
- **Lucide Icons**: Icon library.
- **Sonner**: Toast notifications.
- **Prisma**: Database ORM for managing process data.
- **SQLite**: Lightweight database for storing application data.
- **TypeScript**: Type-safe JavaScript for better development experience.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
