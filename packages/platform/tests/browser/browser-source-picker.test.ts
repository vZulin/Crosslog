import { afterEach, describe, expect, it } from "vitest";
import { BrowserSourcePicker } from "../../src/browser/browser-source-picker";

describe("BrowserSourcePicker", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("maps selected browser files into file source refs", async () => {
    const picker = new BrowserSourcePicker(document);
    const selection = picker.pickFiles();
    const input = getPickerInput();
    const file = new File(["first line"], "App Log.log", {
      lastModified: 123,
      type: "text/plain",
    });

    expect(input.type).toBe("file");
    expect(input.multiple).toBe(true);
    expect(input.hasAttribute("webkitdirectory")).toBe(false);

    setInputFiles(input, [file]);
    input.dispatchEvent(new Event("change"));

    await expect(selection).resolves.toEqual([
      {
        id: "browser-file-app-log-log-123",
        name: "App Log.log",
        file,
      },
    ]);
    expect(document.querySelector("input[data-crosslog-source-picker]")).toBeNull();
  });

  it("returns an empty file selection when the browser picker is cancelled", async () => {
    const picker = new BrowserSourcePicker(document);
    const selection = picker.pickFiles();
    const input = getPickerInput();

    input.dispatchEvent(new Event("cancel"));

    await expect(selection).resolves.toEqual([]);
    expect(document.querySelector("input[data-crosslog-source-picker]")).toBeNull();
  });

  it("maps selected browser directories into directory source refs", async () => {
    const picker = new BrowserSourcePicker(document);
    const selection = picker.pickDirectory();
    const input = getPickerInput();
    const appLog = createDirectoryFile("app.log", "logs/app.log", 1_234, 100);
    const serviceLog = createDirectoryFile("service.log", "logs/service.log", 2_345, 200);
    const nestedLog = createDirectoryFile("nested.log", "logs/archive/nested.log", 3_456, 300);

    expect(input.type).toBe("file");
    expect(input.multiple).toBe(true);
    expect(input.hasAttribute("webkitdirectory")).toBe(true);

    setInputFiles(input, [appLog, serviceLog, nestedLog]);
    input.dispatchEvent(new Event("change"));

    await expect(selection).resolves.toMatchObject({
      id: "browser-directory-logs-2",
      name: "logs",
      entries: [
        {
          kind: "file",
          id: "browser-file-app-log-1234",
          name: "app.log",
          sizeBytes: 100,
        },
        {
          kind: "file",
          id: "browser-file-service-log-2345",
          name: "service.log",
          sizeBytes: 200,
        },
      ],
    });
  });

  it("returns null when directory selection is cancelled", async () => {
    const picker = new BrowserSourcePicker(document);
    const selection = picker.pickDirectory();
    const input = getPickerInput();

    input.dispatchEvent(new Event("cancel"));

    await expect(selection).resolves.toBeNull();
  });
});

function getPickerInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>("input[data-crosslog-source-picker]");

  if (!input) {
    throw new Error("Expected BrowserSourcePicker to append a file input.");
  }

  return input;
}

function setInputFiles(input: HTMLInputElement, files: readonly File[]): void {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: files,
  });
}

function createDirectoryFile(
  name: string,
  relativePath: string,
  lastModified: number,
  size: number,
): File {
  const file = new File(["x".repeat(size)], name, { lastModified });

  Object.defineProperty(file, "webkitRelativePath", {
    configurable: true,
    value: relativePath,
  });

  return file;
}
