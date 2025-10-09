/**
 * Diagram Generator - Converts text responses into Excalidraw diagrams
 *
 * This service uses an LLM to analyze text and generate visual diagrams
 * that can be rendered in Excalidraw.
 */

import Groq from "groq-sdk";

export interface ExcalidrawElement {
  id: string;
  type: "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: "solid" | "hachure" | "cross-hatch";
  strokeWidth?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  roughness?: number;
  opacity?: number;
  seed?: number;
  version?: number;
  versionNonce?: number;
  isDeleted?: boolean;
  boundElements?: Array<{ id: string; type: string }>;
  updated?: number;
  link?: string | null;
  locked?: boolean;
  // Text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  // Arrow/Line-specific
  points?: Array<[number, number]>;
  startBinding?: { elementId: string; focus: number; gap: number } | null;
  endBinding?: { elementId: string; focus: number; gap: number } | null;
  startArrowhead?: "arrow" | "bar" | "dot" | null;
  endArrowhead?: "arrow" | "bar" | "dot" | null;
}

export interface ExcalidrawScene {
  type: "excalidraw";
  version: number;
  source: string;
  elements: ExcalidrawElement[];
  appState: {
    gridSize: number | null;
    viewBackgroundColor: string;
  };
  files?: Record<string, unknown>;
}

export interface DiagramGenerationOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Color palette optimized for dark backgrounds
 */
const DARK_THEME_COLORS = {
  stroke: "#e2e8f0", // Light slate for borders
  text: "#f1f5f9", // Very light slate for text
  backgrounds: [
    "#1e3a8a", // Dark blue
    "#831843", // Dark pink
    "#14532d", // Dark green
    "#854d0e", // Dark yellow
    "#3730a3", // Dark indigo
  ],
  arrow: "#94a3b8", // Light slate for arrows
};

export class DiagramGenerator {
  private groq: Groq;
  private model: string;

  constructor(apiKey: string, model = "llama-3.3-70b-versatile") {
    this.groq = new Groq({ apiKey });
    this.model = model;
  }

  /**
   * Normalize element colors to work well on dark backgrounds
   */
  private normalizeColors(elements: ExcalidrawElement[]): ExcalidrawElement[] {
    return elements.map((el, index) => {
      const normalized: ExcalidrawElement = { ...el };

      // Normalize stroke colors (borders, lines)
      if (el.type === "arrow" || el.type === "line") {
        normalized.strokeColor = DARK_THEME_COLORS.arrow;
      } else {
        normalized.strokeColor = DARK_THEME_COLORS.stroke;
      }

      // Normalize text colors
      if (el.type === "text") {
        normalized.strokeColor = DARK_THEME_COLORS.text;
      }

      // Normalize background colors for shapes
      if (el.type === "rectangle" || el.type === "ellipse" || el.type === "diamond") {
        // Cycle through background colors
        const bgIndex = index % DARK_THEME_COLORS.backgrounds.length;
        normalized.backgroundColor = DARK_THEME_COLORS.backgrounds[bgIndex];
      }

      return normalized;
    });
  }

  /**
   * Analyze text and determine if it would benefit from a diagram
   */
  async shouldGenerateDiagram(text: string): Promise<{
    shouldGenerate: boolean;
    reasoning: string;
    diagramType?: "architecture" | "flow" | "relationship" | "sequence";
  }> {
    const prompt = `Analyze the following text and determine if it would benefit from a visual diagram.

Text: """
${text}
"""

Respond with a JSON object:
{
  "shouldGenerate": boolean,
  "reasoning": "brief explanation",
  "diagramType": "architecture" | "flow" | "relationship" | "sequence" (if shouldGenerate is true)
}

Diagrams are useful for:
- Architecture/structure explanations
- Process flows or workflows
- Relationships between components
- Sequences of operations

Only suggest diagrams for content that is genuinely visual in nature.`;

    const response = await this.groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: this.model,
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    return result;
  }

  /**
   * Generate Excalidraw elements from text
   */
  async generateDiagram(
    text: string,
    options: DiagramGenerationOptions = {}
  ): Promise<ExcalidrawScene> {
    const { temperature = 0.7, maxTokens = 2000 } = options;

    const prompt = `You are an expert at creating visual diagrams. Convert the following text into Excalidraw diagram elements.

Text: """
${text}
"""

Generate a JSON response with Excalidraw elements that visually represent the concepts in the text.

Guidelines:
- Use rectangles for components/entities
- Use ellipses for processes/actions
- Use diamonds for decisions
- Use arrows to show relationships/flow
- Use text elements for labels
- Position elements in a clear, organized layout (spacing ~200 units)
- Use consistent colors (strokeColor/backgroundColor)
- Keep it simple and clear

Example element types:
- Rectangle: { "type": "rectangle", "x": 100, "y": 100, "width": 200, "height": 100 }
- Text: { "type": "text", "x": 150, "y": 130, "text": "Component", "fontSize": 20 }
- Arrow: { "type": "arrow", "x": 300, "y": 150, "points": [[0, 0], [150, 0]], "endArrowhead": "arrow" }

Respond with a JSON object containing an array of elements:
{
  "elements": [/* array of Excalidraw elements */]
}

Each element must have: id (unique string), type, x, y, width, height (except arrows/lines use points).
Add appropriate styling: strokeColor, backgroundColor, fontSize, etc.`;

    const response = await this.groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: this.model,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    // Ensure all elements have required IDs
    let elements = (result.elements || []).map((el: ExcalidrawElement, index: number) => ({
      ...el,
      id: el.id || `element-${Date.now()}-${index}`,
      seed: el.seed || Math.floor(Math.random() * 2147483647),
      version: el.version || 1,
      versionNonce: el.versionNonce || Math.floor(Math.random() * 2147483647),
      isDeleted: false,
      updated: Date.now(),
    }));

    // Normalize colors for dark theme visibility
    elements = this.normalizeColors(elements);

    return {
      type: "excalidraw",
      version: 2,
      source: "https://excalidraw.com",
      elements,
      appState: {
        gridSize: null,
        viewBackgroundColor: "#ffffff",
      },
    };
  }

  /**
   * Generate diagram incrementally as text streams in
   * Returns a complete diagram after analyzing accumulated text
   */
  async generateDiagramFromStream(
    accumulatedText: string,
    options: DiagramGenerationOptions = {}
  ): Promise<ExcalidrawScene | null> {
    // Only generate diagram if we have substantial text (>200 chars)
    if (accumulatedText.length < 200) {
      return null;
    }

    // Check if diagram would be useful
    const analysis = await this.shouldGenerateDiagram(accumulatedText);

    if (!analysis.shouldGenerate) {
      return null;
    }

    // Generate the diagram
    return this.generateDiagram(accumulatedText, options);
  }
}
