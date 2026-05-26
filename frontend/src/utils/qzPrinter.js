import qz from "qz-tray";

// Connect to QZ Tray
export async function connectQZ() {
  if (qz.websocket.isActive()) return;
  try {
    await qz.websocket.connect();
    console.log("✅ QZ Tray connected");
  } catch (err) {
    throw new Error("QZ Tray not running. Please install and start QZ Tray.");
  }
}

// Get all local printers
export async function getLocalPrinters() {
  await connectQZ();
  const printers = await qz.printers.find();
  return printers.map(name => ({
    name,
    displayName: name,
    isDefault: false,
  }));
}

// Get default printer
export async function getDefaultPrinter() {
  await connectQZ();
  const printer = await qz.printers.getDefault();
  return printer;
}

// Print raw data or HTML to a specific printer
export async function printLabel(printerName, htmlContent, labelWidthMm, labelHeightMm) {
  await connectQZ();

  const config = qz.configs.create(printerName, {
    size: { width: labelWidthMm, height: labelHeightMm },
    units: "mm",
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    colorType: "blackwhite",
    copies: 1,
  });

  const data = [{
    type: "pixel",
    format: "html",
    flavor: "plain",
    data: htmlContent,
  }];

  await qz.print(config, data);
}

// Disconnect
export async function disconnectQZ() {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect();
  }
}