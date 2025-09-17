import {
    CopilotRuntime,
    GroqAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import Groq from "groq-sdk";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }) as any;

const copilotKit = new CopilotRuntime();

const serviceAdapter = new GroqAdapter({ groq, model: "llama-3.1-8b-instant" });

export const POST = async (req: NextRequest) => {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        runtime: copilotKit,
        serviceAdapter,
        endpoint: "/api/copilotkit",
    });

    return handleRequest(req);
};