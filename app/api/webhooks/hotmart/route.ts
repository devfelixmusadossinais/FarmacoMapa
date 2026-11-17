import { processarWebhook } from "@/lib/webhooks";

export async function POST(requisicao: Request) {
  return processarWebhook(requisicao, "hotmart");
}
