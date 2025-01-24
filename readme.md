# SwiftBuddies Backend

This is the backend for the SwiftBuddies application, built using Deno and MongoDB. It provides a RESTful API for managing users, posts, images, and events.

## Table of Contents

- [SwiftBuddies Backend](#swiftbuddies-backend)
  - [Table of Contents](#table-of-contents)
  - [Configuration](#configuration)
  - [Installation](#installation)
  - [Database](#database)
  - [Contributing](#contributing)
  - [License](#license)

## Configuration

1. **Environment Variables:**

   Create a `.env.local` file in the root directory and add the following environment variables:

   ```plaintext
   MONGODB_URL=<your-mongodb-url>
   SENTRY_DSN=<your-sentry-dsn>
   GCP_SERVICE_ACCOUNT_EMAIL=<your-gcp-service-account-email>
   GCP_PRIVATE_KEY=<your-gcp-private-key>
   GCP_PROJECT_ID=<your-gcp-project-id>
   GCLOUD_BUCKET_NAME=<your-gcloud-bucket-name>
   ```

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/swiftbuddies-backend.git
   cd swiftbuddies-backend
   ```

2. **Install Deno:**

   Follow the instructions on the [Deno website](https://deno.land/#installation) to install Deno.

3. **Install dependencies:**

   Deno automatically handles dependencies through imports, so no additional installation steps are required.

4. **Run the setup script:**

   ```bash
   deno task dev
   ```

   This command will start the server with file watching enabled, allowing for automatic restarts on file changes.

## Database

The application uses MongoDB for data storage. Ensure that your MongoDB instance is running and accessible via the `MONGODB_URL` environment variable.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
