# FantasyWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Google Sheets Integration (MCP)

This project includes a Model-Code-Prompt (MCP) integration with Google Sheets to manage fantasy league data. The MCP is configured in the `.cursor` directory.

### Setup

1. Install the googleapis package:
```bash
npm install googleapis
```

2. Ensure you have a valid `credentials.json` file in the project root with appropriate Google Sheets API access.
   - **IMPORTANT**: The `credentials.json` file is ignored by git for security reasons. You must create this file locally.
   - Do not commit this file to version control.

3. The MCP is configured to access the Google Spreadsheet with ID: `1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI`

### Scripts

- **analyze_sheet.js**: Analyzes and displays the structure of all sheets in the spreadsheet
- **sheets_mcp_server.js**: MCP server implementation for Google Sheets integration

### Running Analysis

To analyze the spreadsheet structure:

```bash
cd .cursor
node analyze_sheet.js
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
