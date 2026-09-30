"use client";
import { useState } from "react";
import { Icon } from "./icon";
export function JsonViewer({
  value,
  downloadUrl,
}: {
  value: unknown;
  downloadUrl?: string;
}) {
  const [message, setMessage] = useState("");
  const source = JSON.stringify(value, null, 2);
  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setMessage("JSON copiado.");
    } catch {
      setMessage(
        "Não foi possível copiar. Selecione o JSON ou faça o download.",
      );
    }
  }
  return (
    <section className="json-viewer">
      <div className="module-toolbar">
        <span className="tech-label">TOPOLOGY.JSON</span>
        <div className="action-group">
          <span className="field-hint" role="status">
            {message}
          </span>
          <button className="button ghost small" onClick={copy}>
            <Icon name="copy" size={15} />
            Copiar
          </button>
          {downloadUrl && (
            <a className="button ghost small" href={downloadUrl}>
              <Icon name="download" size={15} />
              Download
            </a>
          )}
        </div>
      </div>
      <ol className="json-lines" aria-label="JSON da topologia">
        {source.split("\n").map((line, i) => (
          <li key={i}>
            <code>
              {line
                .split(
                  /("(?:[^"\\]|\\.)*"\s*:|"(?:[^"\\]|\\.)*"|\b(?:true|false|null|\d+(?:\.\d+)?)\b)/g,
                )
                .map((part, j) => (
                  <span
                    key={j}
                    className={
                      part.endsWith(":")
                        ? "json-key"
                        : part.startsWith('"')
                          ? "json-string"
                          : /^(true|false|null|\d)/.test(part)
                            ? "json-number"
                            : undefined
                    }
                  >
                    {part}
                  </span>
                ))}
            </code>
          </li>
        ))}
      </ol>
    </section>
  );
}
