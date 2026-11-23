import type { BeforeProviderRequestEvent, ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

export function rewriteFastModeProviderRequest(
	event: BeforeProviderRequestEvent,
	ctx: Pick<ExtensionContext, "model" | "modelRegistry">,
): unknown {
	const { model } = ctx;
	if (!model) return;
	const supported =
		(model.provider === "openai-codex" && model.api === "openai-codex-responses") ||
		(model.provider === "openai" && model.api === "openai-responses" && ctx.modelRegistry.isUsingOAuth(model));
	if (!supported) return;

	const { payload } = event;
	if (!payload || typeof payload !== "object" || Array.isArray(payload) || !("model" in payload) || payload.model !== model.id) return;
	return { ...payload, service_tier: "priority" };
}

export default function registerSubagentFastModeExtension(pi: ExtensionAPI): void {
	pi.on("before_provider_request", rewriteFastModeProviderRequest);
}
