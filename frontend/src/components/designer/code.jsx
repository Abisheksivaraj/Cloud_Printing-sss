import React, { useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import bwipjs from "bwip-js";

const sanitizeEanValue = (value, format) => {
  let digits = value.replace(/\D/g, "");

  if (format === "EAN13") {
    if (digits.length < 12) {
      digits = digits.padEnd(12, "0");
    } else {
      digits = digits.slice(0, 12);
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const weight = i % 2 === 0 ? 1 : 3;
      sum += parseInt(digits[i], 10) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return digits + checkDigit;
  }

  if (format === "EAN8") {
    if (digits.length < 7) {
      digits = digits.padEnd(7, "0");
    } else {
      digits = digits.slice(0, 7);
    }
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const weight = i % 2 === 0 ? 3 : 1;
      sum += parseInt(digits[i], 10) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return digits + checkDigit;
  }

  if (format === "UPC") {
    if (digits.length < 11) {
      digits = digits.padEnd(11, "0");
    } else {
      digits = digits.slice(0, 11);
    }
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const weight = i % 2 === 0 ? 3 : 1;
      sum += parseInt(digits[i], 10) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return digits + checkDigit;
  }

  return value;
};

export const BarcodeElement = ({ element }) => {
  const barcodeRef = useRef(null);
  const canvasRef = useRef(null);

  const barcodeTypes = [
    { value: "CODE128", label: "Code 128", library: "jsbarcode" },
    { value: "CODE39", label: "Code 39", library: "jsbarcode" },
    { value: "EAN13", label: "EAN-13", library: "jsbarcode" },
    { value: "EAN8", label: "EAN-8", library: "jsbarcode" },
    { value: "UPC", label: "UPC-A", library: "jsbarcode" },
    { value: "QR", label: "QR Code", library: "qrcode" },
    { value: "DATAMATRIX", label: "Data Matrix", library: "bwip" },
    { value: "PDF417", label: "PDF417", library: "bwip" },
    { value: "AZTEC", label: "Aztec Code", library: "bwip" },
  ];

  useEffect(() => {
    const barcodeType = barcodeTypes.find(
      (t) => t.value === element.barcodeType,
    );
    if (!barcodeType) return;

    const combinedValue = element.content
      ? element.content
        .split("\n")
        .filter((line) => line.trim())
        .join(" ")
      : "123456789";

    // Detect if value is a template placeholder
    const isPlaceholder = combinedValue.includes("{{") || combinedValue.includes("}}");
    let finalValue = combinedValue;

    if (isPlaceholder) {
      if (element.barcodeType === "EAN13") {
        finalValue = "9780201379624";
      } else if (element.barcodeType === "EAN8") {
        finalValue = "40170725";
      } else if (element.barcodeType === "UPC") {
        finalValue = "123456789012";
      } else {
        finalValue = "123456789";
      }
    } else {
      if (element.barcodeType === "EAN13" || element.barcodeType === "EAN8" || element.barcodeType === "UPC") {
        finalValue = sanitizeEanValue(combinedValue, element.barcodeType);
      }
    }

    try {
      if (barcodeType.library === "jsbarcode" && barcodeRef.current) {
        // Clear previous barcode
        barcodeRef.current.innerHTML = "";

        const containerWidth = element.width || 200;
        const containerHeight = element.height || 100;

        // Create SVG element
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        barcodeRef.current.appendChild(svg);

        // Calculate appropriate settings
        const barcodeHeight = containerHeight * 0.7;
        const fontSize = Math.max(10, containerHeight * 0.12);

        // Generate barcode with fallback logic
        const generateBarcode = (value, format) => {
          try {
            let processedValue = value;
            if (format === "CODE39") {
              processedValue = value.toUpperCase().replace(/[^0-9A-Z\-.$ \/+%]/g, " ");
            }

            JsBarcode(svg, processedValue, {
              format: format || "CODE128",
              width: element.barcodeWidth || 2,
              height: barcodeHeight,
              displayValue: true,
              fontSize: fontSize,
              margin: 10,
              background: "transparent",
              lineColor: "#000000",
            });
            return true;
          } catch (e) {
            return false;
          }
        };

        const success = generateBarcode(finalValue, element.barcodeType || "CODE128");

        // If it failed, try CODE128 as fallback
        if (!success && element.barcodeType !== "CODE128") {
          console.warn(`Barcode format ${element.barcodeType} failed for value "${finalValue}", falling back to CODE128`);
          generateBarcode(finalValue, "CODE128");
        }

        // Get the generated barcode dimensions
        const bbox = svg.getBBox();
        const barcodeWidth = bbox.width;
        const barcodeFullHeight = bbox.height;

        // Calculate scale to fit in container
        const scaleX = containerWidth / barcodeWidth;
        const scaleY = containerHeight / barcodeFullHeight;
        const scale = Math.min(scaleX, scaleY);

        // Apply dimensions and scaling
        svg.setAttribute("width", containerWidth);
        svg.setAttribute("height", containerHeight);

        // Center the barcode
        const offsetX = (containerWidth - barcodeWidth * scale) / 2;
        const offsetY = (containerHeight - barcodeFullHeight * scale) / 2;

        svg.setAttribute(
          "viewBox",
          `${-offsetX / scale} ${-offsetY / scale} ${containerWidth / scale} ${containerHeight / scale}`,
        );
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      } else if (barcodeType.library === "bwip" && canvasRef.current) {
        // Use a fixed high-resolution scale, let CSS handle the sizing
        bwipjs.toCanvas(canvasRef.current, {
          bcid: barcodeType.value === "AZTEC" ? "azteccode" : barcodeType.value.toLowerCase(),
          text: finalValue,
          scale: 3,
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0,
        });

        // Scale canvas to fit container via CSS
        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = '100%';
        canvasRef.current.style.objectFit = 'contain';
      }
    } catch (error) {
      console.error("Barcode generation error:", error);
    }
  }, [
    element.content,
    element.barcodeType,
    element.barcodeWidth,
    element.barcodeHeight,
    element.width,
    element.height,
  ]);

  const barcodeType = barcodeTypes.find((t) => t.value === element.barcodeType);
  const combinedValue = element.content
    ? element.content
      .split("\n")
      .filter((line) => line.trim())
      .join(" ")
    : "123456789";

  if (barcodeType?.library === "qrcode") {
    // Calculate QR code size to fit container with some padding
    const qrSize = Math.min(element.width - 10, element.height - 10);

    return (
      <div className="flex items-center justify-center w-full h-full">
        <QRCodeSVG
          value={combinedValue}
          size={qrSize}
          style={{ maxWidth: "100%", maxHeight: "100%" }}
          includeMargin={false}
          bgColor="transparent"
        />
      </div>
    );
  }

  if (barcodeType?.library === "bwip") {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={barcodeRef}
      className="flex items-center justify-center w-full h-full"
      style={{ overflow: "hidden" }}
    />
  );
};

export default BarcodeElement;
