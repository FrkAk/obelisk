import { describe, test, expect } from "bun:test";
import { assertPublicUrl } from "./ssrf";

describe("assertPublicUrl", () => {
  test("allows public URLs", async () => {
    await expect(assertPublicUrl("https://example.com")).resolves.toBeUndefined();
    await expect(assertPublicUrl("https://en.wikipedia.org/wiki/Test")).resolves.toBeUndefined();
    await expect(assertPublicUrl("http://example.com:8080/path")).resolves.toBeUndefined();
  });

  test("rejects loopback addresses", async () => {
    await expect(assertPublicUrl("http://127.0.0.1")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://127.0.0.42")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://[::1]")).rejects.toThrow("Blocked private IP");
  });

  test("rejects RFC 1918 private ranges", async () => {
    await expect(assertPublicUrl("http://10.0.0.1")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://10.255.255.255")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://172.16.0.1")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://172.31.255.255")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://192.168.1.1")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://192.168.0.100")).rejects.toThrow("Blocked private IP");
  });

  test("rejects link-local and metadata addresses", async () => {
    await expect(assertPublicUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://169.254.0.1")).rejects.toThrow("Blocked private IP");
  });

  test("rejects 0.0.0.0", async () => {
    await expect(assertPublicUrl("http://0.0.0.0")).rejects.toThrow("Blocked private IP");
  });

  test("rejects localhost hostname", async () => {
    await expect(assertPublicUrl("http://localhost")).rejects.toThrow("Blocked private hostname");
    await expect(assertPublicUrl("http://localhost:8080")).rejects.toThrow("Blocked private hostname");
  });

  test("rejects cloud metadata hostname", async () => {
    await expect(assertPublicUrl("http://metadata.google.internal")).rejects.toThrow("Blocked private hostname");
  });

  test("rejects non-http schemes", async () => {
    await expect(assertPublicUrl("ftp://example.com")).rejects.toThrow("Disallowed URL scheme");
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toThrow("Disallowed URL scheme");
    await expect(assertPublicUrl("javascript:alert(1)")).rejects.toThrow("Disallowed URL scheme");
  });

  test("rejects invalid URLs", async () => {
    await expect(assertPublicUrl("not-a-url")).rejects.toThrow("Invalid URL");
    await expect(assertPublicUrl("")).rejects.toThrow("Invalid URL");
  });

  test("rejects IPv6 private addresses", async () => {
    await expect(assertPublicUrl("http://[fc00::1]")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://[fd12::1]")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://[fe80::1]")).rejects.toThrow("Blocked private IP");
  });

  test("rejects CGN range", async () => {
    await expect(assertPublicUrl("http://100.64.0.1")).rejects.toThrow("Blocked private IP");
    await expect(assertPublicUrl("http://100.127.255.255")).rejects.toThrow("Blocked private IP");
  });

  test("allows non-private 172.x addresses", async () => {
    await expect(assertPublicUrl("http://172.15.0.1")).resolves.toBeUndefined();
    await expect(assertPublicUrl("http://172.32.0.1")).resolves.toBeUndefined();
  });
});
