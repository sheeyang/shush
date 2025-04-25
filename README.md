# Shush App

Shush is a web-based application that brings command-line utilities to the browser. It provides a user-friendly interface for managing processes, executing commands, and interacting with various utilities like TikTok and Ping tools.

## Features

- **Command Management**: Add, run, and manage command-line processes with real-time output streaming.
- **Sidebar Navigation**: A collapsible sidebar for easy navigation between different utilities.
- **TikTok Utility**: Tools for interacting with TikTok-related functionalities (currently under development).
- **Ping Utility**: A feature to execute and monitor ping commands.
- **Authentication**: Secure login and admin account setup using `better-auth`.
- **Theming**: Light and dark mode support with customizable themes.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Project Structure

The project is organized into the following key directories:

- **`src/app`**: Contains the main application pages like `signin`, `setup`, `ping`, and `tiktok`.
- **`src/components`**: Reusable UI components such as buttons, cards, sidebar, dropdown menus, and more.
- **`src/lib`**: Utility functions and backend logic, including process management and stream handling.
- **`src/stores`**: State management for processes and other application data.

## Key Components

### Sidebar

The sidebar provides navigation and is collapsible. It includes:

- Application links (e.g., Ping, TikTok).
- A mode toggle for switching between light and dark themes.

### Command Management

- **Command Cards**: Display individual processes with options to start, stop, and remove them.
- **Command Output**: Real-time streaming of process output in a resizable scroll area.

### Authentication

- **Sign In**: Login functionality with "Remember Me" support.
- **Setup**: Admin account creation with automatic login.

## Technologies Used

- **React**: Frontend framework.
- **Next.js**: Server-side rendering and routing.
- **Radix UI**: Accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Zustand**: State management.
- **Lucide Icons**: Icon library.
- **Sonner**: Toast notifications.
- **Prisma**: Database ORM for managing process data.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (preferred package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd shush
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running the Application

1. Start the development server:
   ```bash
   pnpm dev
   ```
2. Open your browser and navigate to `http://localhost:3000`.

### Building for Production

1. Build the application:
   ```bash
   pnpm build
   ```
2. Start the production server:
   ```bash
   pnpm start
   ```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
