const mockS3Send = jest.fn();

jest.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    send(command) {
      return mockS3Send(command);
    }
  }

  class PutObjectCommand {
    constructor(input) {
      this.input = input;
    }
  }

  class DeleteObjectCommand {
    constructor(input) {
      this.input = input;
    }
  }

  return {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
  };
});

const loadR2Service = () => {
  let service;

  jest.isolateModules(() => {
    service = require("../services/r2Service");
  });

  return service;
};

beforeEach(() => {
  jest.resetModules();
  mockS3Send.mockReset();
  process.env.R2_ACCOUNT_ID = "test-account-id";
  process.env.R2_ACCESS_KEY_ID = "test-access-key-id";
  process.env.R2_SECRET_ACCESS_KEY = "test-secret-access-key";
  process.env.R2_BUCKET_NAME = "test-bucket";
  process.env.R2_PUBLIC_BASE_URL = "https://pub-test-bucket.r2.dev";
});

describe("checkR2Health", () => {
  it("reports healthy when the probe write and delete succeed", async () => {
    mockS3Send.mockResolvedValue({
      $metadata: {
        httpStatusCode: 200,
      },
    });

    const r2Service = loadR2Service();
    const result = await r2Service.checkR2Health({ forceRefresh: true });

    expect(result.ok).toBe(true);
    expect(result.code).toBe("R2_OK");
    expect(mockS3Send).toHaveBeenCalledTimes(2);
    expect(mockS3Send.mock.calls[0][0].input.Key).toMatch(
      /^healthchecks\/uploads\//
    );
  });

  it("reports unauthorized when Cloudflare rejects the configured credentials", async () => {
    mockS3Send.mockRejectedValue({
      name: "Unauthorized",
      Code: "Unauthorized",
      $metadata: {
        httpStatusCode: 401,
      },
    });

    const r2Service = loadR2Service();
    const result = await r2Service.checkR2Health({ forceRefresh: true });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("R2_UNAUTHORIZED");
  });

  it("reports unavailable for non-auth storage failures", async () => {
    mockS3Send.mockRejectedValue(new Error("socket hang up"));

    const r2Service = loadR2Service();
    const result = await r2Service.checkR2Health({ forceRefresh: true });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("R2_UNAVAILABLE");
  });

  it("reuses the cached health result within the cache TTL", async () => {
    mockS3Send.mockResolvedValue({
      $metadata: {
        httpStatusCode: 200,
      },
    });

    const r2Service = loadR2Service();
    const firstResult = await r2Service.checkR2Health();
    const secondResult = await r2Service.checkR2Health();

    expect(mockS3Send).toHaveBeenCalledTimes(2);
    expect(secondResult).toEqual(firstResult);
  });
});
