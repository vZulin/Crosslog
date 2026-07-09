import { invoke } from "@tauri-apps/api/core";
import type { DiagnosticLogEvent, DiagnosticLogPort } from "../ports/diagnostic-log-port";

type DiagnosticLogWriter = (event: DiagnosticLogEvent) => Promise<void>;

export class TauriDiagnosticLogger implements DiagnosticLogPort {
  constructor(private readonly writeDiagnosticLog: DiagnosticLogWriter = writeDiagnosticLogViaCommand) {}

  async write(event: DiagnosticLogEvent): Promise<void> {
    await this.writeDiagnosticLog(event);
  }
}

async function writeDiagnosticLogViaCommand(event: DiagnosticLogEvent): Promise<void> {
  await invoke("write_diagnostic_log", { event });
}
