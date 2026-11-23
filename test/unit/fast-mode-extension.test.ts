import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { rewriteFastModeProviderRequest } from "../../src/runs/shared/fast-mode-extension.ts";

const astra = { provider: "openai", api: "openai-responses", id: "gpt-6.2-astra" } as NonNullable<ExtensionContext["model"]>;
const codex = { ...astra, provider: "openai-codex", api: "openai-codex-responses", id: "gpt-5.6-luna" } as typeof astra;

function rewrite(payload: unknown, model: ExtensionContext["model"] = astra, oauth = true): unknown {
	const modelRegistry = { isUsingOAuth: (candidate: typeof astra) => oauth && candidate === model } as ExtensionContext["modelRegistry"];
	return rewriteFastModeProviderRequest({ type: "before_provider_request", payload }, { model, modelRegistry });
}

describe("fast mode provider request", () => {
	it("requests priority for ChatGPT-authenticated OpenAI and legacy Codex children", () => {
		for (const model of [astra, codex]) {
			const payload = { model: model.id, input: [{ role: "user", content: "test" }] };
			assert.deepEqual(rewrite(payload, model), { ...payload, service_tier: "priority" });
			assert.equal(Object.hasOwn(payload, "service_tier"), false);
		}
	});

	it("does not request priority with an OpenAI API key or a different provider/API pair", () => {
		const payload = { model: astra.id };
		assert.equal(rewrite(payload, astra, false), undefined);
		for (const model of [
			{ ...astra, provider: "proxy" },
			{ ...astra, api: "openai-completions" },
			{ ...astra, provider: "openai-codex" },
		] as typeof astra[]) {
			assert.equal(rewrite(payload, model), undefined);
		}
	});

	it("ignores malformed payloads and requests for a different model", () => {
		for (const payload of [null, "request", [], {}, { model: "gpt-6.2-sol" }]) {
			assert.equal(rewrite(payload), undefined);
		}
	});
});
