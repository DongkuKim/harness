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
      name: "types-do-not-import-upwards",
      severity: "error",
      from: {
        path: "^src/types/",
      },
      to: {
        path: "^src/(config|repo|service|runtime|providers|ui|utils)/",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
    {
      name: "config-does-not-import-upwards",
      severity: "error",
      from: {
        path: "^src/config/",
      },
      to: {
        path: "^src/(repo|service|runtime|providers|ui|utils)/",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
    {
      name: "repo-does-not-import-upwards",
      severity: "error",
      from: {
        path: "^src/repo/",
      },
      to: {
        path: "^src/(service|runtime|providers|ui|utils)/",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
    {
      name: "service-does-not-import-upwards",
      severity: "error",
      from: {
        path: "^src/service/",
      },
      to: {
        path: "^src/(runtime|ui|utils)/",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
    {
      name: "runtime-does-not-import-ui",
      severity: "error",
      from: {
        path: "^src/runtime/",
      },
      to: {
        path: "^src/(providers|ui|utils)/",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
    {
      name: "providers-only-import-types-and-utils",
      severity: "error",
      from: {
        path: "^src/providers/",
      },
      to: {
        path: "^src/(config|repo|service|runtime|ui)/",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
    {
      name: "utils-do-not-import-domain",
      severity: "error",
      from: {
        path: "^src/utils/",
      },
      to: {
        path: "^src/(types|config|repo|service|runtime|providers|ui)/",
        dependencyTypesNot: ["npm", "npm-dev", "core"],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    includeOnly:
      "^(src/types|src/config|src/repo|src/service|src/runtime|src/providers|src/ui|src/utils)",
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
}
