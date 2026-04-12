/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
  },
};

module.exports = config;
