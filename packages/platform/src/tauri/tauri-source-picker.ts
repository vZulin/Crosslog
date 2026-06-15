import type { SourcePickerPort } from "../ports/source-picker-port";

export class TauriSourcePicker implements SourcePickerPort {
  async pickFiles() {
    return [];
  }

  async pickDirectory() {
    return null;
  }
}

