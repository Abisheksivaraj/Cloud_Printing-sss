import React from "react";

/**
 * Shared shape renderer used by DesignCanvas, PrintPreviewModal,
 * and GeneratedLabelsPreview so every shape type prints correctly.
 */
const renderShapeContent = (element) => {
  const fill = element.backgroundColor || "transparent";
  const stroke = element.borderColor || "#000000";
  const strokeWidth = element.borderWidth !== undefined ? element.borderWidth : 2;
  const strokeDash = element.borderStyle === "dashed" ? "5,5" : element.borderStyle === "dotted" ? "2,2" : "none";
  const borderRadius = element.borderRadius || 15;

  const svgStyle = {
    width: "100%",
    height: "100%",
    display: "block",
  };

  const commonProps = {
    fill,
    stroke,
    strokeWidth,
    strokeDasharray: strokeDash,
    style: { vectorEffect: "non-scaling-stroke" },
  };

  switch (element.type) {
    case "rectangle":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x={strokeWidth / 2} y={strokeWidth / 2} width={100 - strokeWidth} height={100 - strokeWidth} {...commonProps} />
        </svg>
      );
    case "rounded-rectangle":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x={strokeWidth / 2} y={strokeWidth / 2} width={100 - strokeWidth} height={100 - strokeWidth} rx={borderRadius} ry={borderRadius} {...commonProps} />
        </svg>
      );
    case "circle":
    case "ellipse":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <ellipse cx="50" cy="50" rx={50 - strokeWidth / 2} ry={50 - strokeWidth / 2} {...commonProps} />
        </svg>
      );
    case "dot":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <circle cx="50" cy="50" r={48 - strokeWidth / 2} fill={fill === 'transparent' ? stroke : fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDash} />
        </svg>
      );
    case "triangle":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 98,98 2,98" {...commonProps} />
        </svg>
      );
    case "right-triangle":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="2,2 2,98 98,98" {...commonProps} />
        </svg>
      );
    case "parallelogram":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="25,2 98,2 75,98 2,98" {...commonProps} />
        </svg>
      );
    case "trapezoid":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="20,2 80,2 98,98 2,98" {...commonProps} />
        </svg>
      );
    case "diamond":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 98,50 50,98 2,50" {...commonProps} />
        </svg>
      );
    case "pentagon":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 98,38 80,98 20,98 2,38" {...commonProps} />
        </svg>
      );
    case "hexagon":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 98,25 98,75 50,98 2,75 2,25" {...commonProps} />
        </svg>
      );
    case "octagon":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30" {...commonProps} />
        </svg>
      );
    case "cross":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="35,2 65,2 65,35 98,35 98,65 65,65 65,98 35,98 35,65 2,65 2,35 35,35" {...commonProps} />
        </svg>
      );
    case "heart":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 50,25 C 40,5 15,5 5,25 C -5,45 20,75 50,98 C 80,75 105,45 95,25 C 85,5 60,5 50,25 Z" {...commonProps} />
        </svg>
      );
    case "moon":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 80,10 A 40,40 0 1,0 80,90 A 30,30 0 1,1 80,10 Z" {...commonProps} />
        </svg>
      );
    case "arrow-right":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="2,30 60,30 60,10 98,50 60,90 60,70 2,70" {...commonProps} />
        </svg>
      );
    case "arrow-left":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="98,30 40,30 40,10 2,50 40,90 40,70 98,70" {...commonProps} />
        </svg>
      );
    case "arrow-up":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="30,98 30,40 10,40 50,2 90,40 70,40 70,98" {...commonProps} />
        </svg>
      );
    case "arrow-down":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="30,2 30,60 10,60 50,98 90,60 70,60 70,2" {...commonProps} />
        </svg>
      );
    case "arrow-left-right":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="2,50 25,20 25,35 75,35 75,20 98,50 75,80 75,65 25,65 25,80" {...commonProps} />
        </svg>
      );
    case "arrow-up-down":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 20,25 35,25 35,75 20,75 50,98 80,75 65,75 65,25 80,25" {...commonProps} />
        </svg>
      );
    case "line-arrow-right":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 10,50 L 90,50 M 70,30 L 90,50 L 70,70" {...commonProps} fill="none" />
        </svg>
      );
    case "line-arrow-left":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 90,50 L 10,50 M 30,30 L 10,50 L 30,70" {...commonProps} fill="none" />
        </svg>
      );
    case "line-arrow-up":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 50,90 L 50,10 M 30,30 L 50,10 L 70,30" {...commonProps} fill="none" />
        </svg>
      );
    case "line-arrow-down":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 50,10 L 50,90 M 30,70 L 50,90 L 70,70" {...commonProps} fill="none" />
        </svg>
      );
    case "line-arrow-h":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 10,50 L 90,50 M 30,30 L 10,50 L 30,70 M 70,30 L 90,50 L 70,70" {...commonProps} fill="none" />
        </svg>
      );
    case "line-arrow-v":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 50,10 L 50,90 M 30,30 L 50,10 L 70,30 M 30,70 L 50,90 L 70,70" {...commonProps} fill="none" />
        </svg>
      );
    case "arrow-up-left":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 85,85 L 15,15 M 45,15 L 15,15 L 15,45" {...commonProps} fill="none" />
        </svg>
      );
    case "arrow-up-right":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 15,85 L 85,15 M 55,15 L 85,15 L 85,45" {...commonProps} fill="none" />
        </svg>
      );
    case "arrow-down-left":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 85,15 L 15,85 M 15,55 L 15,85 L 45,85" {...commonProps} fill="none" />
        </svg>
      );
    case "arrow-down-right":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 15,15 L 85,85 M 55,85 L 85,85 L 85,55" {...commonProps} fill="none" />
        </svg>
      );
    case "star-4":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 62,38 98,50 62,62 50,98 38,62 2,50 38,38" {...commonProps} />
        </svg>
      );
    case "star-5":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 65,35 98,35 72,57 82,90 50,70 18,90 28,57 2,35 35,35" {...commonProps} />
        </svg>
      );
    case "star-6":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 63,28 95,28 75,50 95,72 63,72 50,98 37,72 5,72 25,50 5,28 37,28" {...commonProps} />
        </svg>
      );
    case "star-8":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,2 60,35 85,15 65,40 98,50 65,60 85,85 60,65 50,98 40,65 15,85 35,60 2,50 35,40 15,15 40,35" {...commonProps} />
        </svg>
      );
    case "arc":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 10,90 A 40,40 0 0,1 90,90" {...commonProps} fill="none" />
        </svg>
      );
    case "double-arc":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 10,90 A 40,40 0 0,1 90,90 L 90,75 A 25,25 0 0,0 10,75 Z" {...commonProps} />
        </svg>
      );
    case "wave":
      return (
        <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 2,20 C 30,5 70,35 98,20 L 98,80 C 70,95 30,65 2,80 Z" {...commonProps} />
        </svg>
      );
    default:
      return null;
  }
};

/** List of all shape type names that renderShapeContent handles */
export const SHAPE_TYPES = [
  "rectangle", "rounded-rectangle", "circle", "ellipse", "dot",
  "triangle", "right-triangle", "parallelogram", "trapezoid", "diamond",
  "pentagon", "hexagon", "octagon", "cross", "heart", "moon",
  "arrow-left", "arrow-right", "arrow-up", "arrow-down",
  "arrow-left-right", "arrow-up-down",
  "arrow-up-left", "arrow-up-right", "arrow-down-left", "arrow-down-right",
  "line-arrow-left", "line-arrow-right", "line-arrow-up", "line-arrow-down",
  "line-arrow-h", "line-arrow-v",
  "star-4", "star-5", "star-6", "star-8",
  "arc", "double-arc", "wave",
];

export const isShapeType = (type) => SHAPE_TYPES.includes(type);

export default renderShapeContent;
