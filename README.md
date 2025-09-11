# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

| File or Folder | Purpose                              |
| -------------- | ------------------------------------ |
| `app/`         | content for UI frontends goes here   |
| `db/`          | your domain models and data go here  |
| `srv/`         | your service models and code go here |
| `package.json` | project metadata and configuration   |
| `readme.md`    | this getting started guide           |

## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).

## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.

 "mocha-init": "npm install chai-as-promised@^7.1.2 chai-http@^4.4.0 chai-subset@^1.6.0 jest@^29.7.0 chai@^4.4.1 express-mock-server@^3.4.3 mocha@^10.4.0 --no-save",
    "test": "npm run mocha-init && mocha unit-test/**/*.test.js unit-test/*.test.js --timeout 240000 --exit --quiet",
    "testeclaims": "npm run mocha-init && mocha unit-test/eclaims.test.js --timeout 240000 --exit --quiet",
        "build": "mbt build -s .",
