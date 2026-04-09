import { describe, it, expect } from "vitest";
import { getProviderColor, providerHue } from "../provider-colors";

describe("getProviderColor", () => {
  it("returns correct hex for known providers", () => {
    expect(getProviderColor("aws")).toBe("#FF9900");
    expect(getProviderColor("azure")).toBe("#0078D4");
    expect(getProviderColor("gcp")).toBe("#4285F4");
    expect(getProviderColor("comptia")).toBe("#C8202F");
  });

  it("returns fallback for unknown providers", () => {
    expect(getProviderColor("unknown-provider")).toBe("#888888");
    expect(getProviderColor("")).toBe("#888888");
  });
});

describe("providerHue", () => {
  it("returns correct hue for known providers", () => {
    expect(providerHue("aws")).toBe(70);
    expect(providerHue("azure")).toBe(240);
    expect(providerHue("gcp")).toBe(225);
  });

  it("returns 265 fallback for unknown providers", () => {
    expect(providerHue("unknown")).toBe(265);
    expect(providerHue("")).toBe(265);
  });
});
