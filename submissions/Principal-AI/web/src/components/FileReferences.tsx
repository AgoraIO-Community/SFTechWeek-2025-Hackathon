import React from "react";
import { useTheme } from "@a24z/industry-theme";

interface FileReference {
  path: string;
  lineNumber?: number;
  relevance: 'primary' | 'secondary' | 'mentioned';
  context?: string;
}

interface FileReferencesProps {
  references: FileReference[];
  owner?: string;
  repo?: string;
  branch?: string;
}

export function FileReferences({
  references,
  owner = "a24z-ai",
  repo = "core-library",
  branch = "main"
}: FileReferencesProps) {
  const { theme } = useTheme();

  if (!references || references.length === 0) {
    return null;
  }

  const generateGitHubUrl = (path: string, lineNumber?: number): string => {
    const baseUrl = `https://github.com/${owner}/${repo}/blob/${branch}`;
    if (lineNumber) {
      return `${baseUrl}/${path}#L${lineNumber}`;
    }
    return `${baseUrl}/${path}`;
  };

  const getRelevanceColor = (relevance: string): string => {
    switch (relevance) {
      case 'primary':
        return '#10b981'; // green
      case 'secondary':
        return '#3b82f6'; // blue
      case 'mentioned':
        return '#6b7280'; // gray
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRelevanceIcon = (relevance: string): string => {
    switch (relevance) {
      case 'primary':
        return '📌';
      case 'secondary':
        return '📎';
      case 'mentioned':
        return '💬';
      default:
        return '📄';
    }
  };

  // Group by relevance
  const primaryRefs = references.filter(r => r.relevance === 'primary');
  const secondaryRefs = references.filter(r => r.relevance === 'secondary');
  const mentionedRefs = references.filter(r => r.relevance === 'mentioned');

  return (
    <div
      style={{
        backgroundColor: theme.colors.backgroundSecondary,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "8px",
        padding: "1rem",
        marginTop: "0.75rem",
      }}
    >
      {/* Primary References */}
      {primaryRefs.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div
            style={{
              fontSize: "0.85rem",
              color: theme.colors.textSecondary,
              marginBottom: "0.5rem",
            }}
          >
            Key Files
          </div>
          {primaryRefs.map((ref, index) => (
            <a
              key={`primary-${index}`}
              href={generateGitHubUrl(ref.path, ref.lineNumber)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                marginBottom: "0.25rem",
                backgroundColor: theme.colors.background,
                border: `1px solid ${getRelevanceColor(ref.relevance)}`,
                borderRadius: "6px",
                textDecoration: "none",
                color: theme.colors.text,
                fontSize: "0.85rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary;
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = getRelevanceColor(ref.relevance);
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }}
            >
              <span>{getRelevanceIcon(ref.relevance)}</span>
              <span
                style={{
                  fontFamily: theme.fonts.monospace,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ref.path}{ref.lineNumber ? `:${ref.lineNumber}` : ''}
              </span>
              <span style={{ color: theme.colors.textSecondary, fontSize: "0.75rem" }}>
                →
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Secondary References */}
      {secondaryRefs.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div
            style={{
              fontSize: "0.85rem",
              color: theme.colors.textSecondary,
              marginBottom: "0.5rem",
            }}
          >
            Related Files
          </div>
          {secondaryRefs.map((ref, index) => (
            <a
              key={`secondary-${index}`}
              href={generateGitHubUrl(ref.path, ref.lineNumber)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                marginBottom: "0.25rem",
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "6px",
                textDecoration: "none",
                color: theme.colors.text,
                fontSize: "0.85rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
            >
              <span>{getRelevanceIcon(ref.relevance)}</span>
              <span
                style={{
                  fontFamily: theme.fonts.monospace,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ref.path}{ref.lineNumber ? `:${ref.lineNumber}` : ''}
              </span>
              <span style={{ color: theme.colors.textSecondary, fontSize: "0.75rem" }}>
                →
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Mentioned References */}
      {mentionedRefs.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          {mentionedRefs.map((ref, index) => (
            <a
              key={`mentioned-${index}`}
              href={generateGitHubUrl(ref.path, ref.lineNumber)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                marginBottom: "0.25rem",
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "6px",
                textDecoration: "none",
                color: theme.colors.text,
                fontSize: "0.85rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
            >
              <span>{getRelevanceIcon(ref.relevance)}</span>
              <span
                style={{
                  fontFamily: theme.fonts.monospace,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ref.path}{ref.lineNumber ? `:${ref.lineNumber}` : ''}
              </span>
              <span style={{ color: theme.colors.textSecondary, fontSize: "0.75rem" }}>
                →
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
