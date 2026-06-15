import React from "react";
import { supportedEncodings, type SupportedEncoding } from "@crosslog/core";

export interface EncodingChooserProps {
  readonly value: SupportedEncoding | null;
  readonly onChange: (encoding: SupportedEncoding) => void;
}

export function EncodingChooser({ value, onChange }: EncodingChooserProps) {
  return (
    <label>
      Encoding
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value as SupportedEncoding)}
      >
        <option value="" disabled>
          Select encoding
        </option>
        {supportedEncodings.map((encoding) => (
          <option key={encoding} value={encoding}>
            {encoding}
          </option>
        ))}
      </select>
    </label>
  );
}
