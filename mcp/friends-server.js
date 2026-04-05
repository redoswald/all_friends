import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient, getUserId } from "./lib/supabase.js";
import { registerReadTools } from "./tools/read.js";
import { registerWriteTools } from "./tools/write.js";

const supabase = createClient();
const userId = getUserId();

const server = new McpServer({
  name: "all-friends",
  version: "0.1.0",
});

registerReadTools(server, supabase, userId);
registerWriteTools(server, supabase, userId);

const transport = new StdioServerTransport();
await server.connect(transport);
