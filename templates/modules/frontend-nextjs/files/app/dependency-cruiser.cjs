/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "app-does-not-import-upwards",
      severity: "error",
      from: {
        path: "^app/",
      },
      to: {
        path: "^(?!app/|components/|hooks/|lib/)",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
    {
      name: "components-do-not-import-app",
      severity: "error",
      from: {
        path: "^components/",
      },
      to: {
        path: "^(app/|(?!(components/|hooks/|lib/)).+)",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
    {
      name: "hooks-only-import-lib",
      severity: "error",
      from: {
        path: "^hooks/",
      },
      to: {
        path: "^(app/|components/|hooks/|(?!(lib/)).+)",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
    {
      name: "lib-does-not-import-upwards",
      severity: "error",
      from: {
        path: "^lib/",
      },
      to: {
        path: "^(app/|components/|hooks/|(?!(lib/)).+)",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules|\\.next",
    },
    exclude: {
      path: "^(next-env\\.d\\.ts|\\.next)",
    },
    includeOnly: "^(app|components|hooks|lib)",
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
}
