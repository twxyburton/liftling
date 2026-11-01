/* Runs the on-device AI (WebLLM) off the main thread so the app stays smooth while it thinks.
   The page talks to it through WebLLM's CreateWebWorkerMLCEngine; keep the version in step with index.html. */
import { WebWorkerMLCEngineHandler } from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = msg => handler.onmessage(msg);
