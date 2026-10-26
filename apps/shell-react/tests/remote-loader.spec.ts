import { describe, expect, it, vi } from "vitest";
import type { WebpackRemoteContainer } from "@strangler/contract";
import { createRemoteLoader, type RemoteConfig } from "../src/lib/remote-loader";

const CONFIG: RemoteConfig = { url: "http://remote/remoteEntry.js", globalName: "legacyApp", module: "./mount" };

const createContainer = (exposed: unknown): WebpackRemoteContainer => ({
  init: vi.fn(async () => undefined),
  get: vi.fn(async () => () => exposed),
});

/** A fake script loader that "executes" the remote by assigning the global. */
const createEnv = (container?: WebpackRemoteContainer) => {
  const scope: Record<string, unknown> = {};
  const load = vi.fn(async (src: string) => {
    if (src === CONFIG.url && container) scope[CONFIG.globalName] = container;
  });
  return { scope, load };
};

describe("createRemoteLoader", () => {
  describe("Happy Flow", () => {
    it("loads the entry, initializes the container and returns the exposed module", async () => {
      const exposed = { mount: vi.fn() };
      const container = createContainer(exposed);
      const { scope, load } = createEnv(container);

      const result = await createRemoteLoader(CONFIG, { load, scope })();

      expect(result).toBe(exposed);
      expect(container.init).toHaveBeenCalledWith({});
      expect(container.get).toHaveBeenCalledWith("./mount");
    });

    it("loads the remote only once for concurrent and later calls", async () => {
      const { scope, load } = createEnv(createContainer({}));
      const getRemote = createRemoteLoader(CONFIG, { load, scope });

      await Promise.all([getRemote(), getRemote()]);
      await getRemote();

      expect(load).toHaveBeenCalledTimes(1);
    });

    it("loads the preload chunk before the container entry", async () => {
      const { scope, load } = createEnv(createContainer({}));

      await createRemoteLoader({ ...CONFIG, preloadChunk: "http://remote/vendor.js" }, { load, scope })();

      expect(load.mock.calls.map(([src]) => src)).toEqual(["http://remote/vendor.js", CONFIG.url]);
    });
  });

  describe("Edge Cases", () => {
    it("ignores a missing preload chunk", async () => {
      const { scope, load } = createEnv(createContainer({ ok: true }));
      load.mockImplementationOnce(async () => {
        throw new Error("404");
      });

      await expect(
        createRemoteLoader({ ...CONFIG, preloadChunk: "http://remote/vendor.js" }, { load, scope })(),
      ).resolves.toEqual({ ok: true });
    });

    it("fails with an explanation when the global was never assigned", async () => {
      const { scope, load } = createEnv(undefined);

      await expect(createRemoteLoader(CONFIG, { load, scope })()).rejects.toThrow(
        /Remote "legacyApp" not found.*HTML fallback/,
      );
    });

    it("retries after a failed load instead of caching the failure", async () => {
      const { scope, load } = createEnv(createContainer({}));
      load.mockRejectedValueOnce(new Error("network down"));
      const getRemote = createRemoteLoader(CONFIG, { load, scope });

      await expect(getRemote()).rejects.toThrow("network down");
      await expect(getRemote()).resolves.toEqual({});
    });
  });
});
