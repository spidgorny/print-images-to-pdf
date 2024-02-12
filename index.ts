import fs from "fs";
import { PDFDocument, rgb } from "pdf-lib";
import * as path from "path";

async function convertImageToPdf(pdfDoc: PDFDocument, imagePaths: string[]) {
  // Read the image file asynchronously.
  // Add a new page to the PDF document with a dimension of 400×400 points.
  const page = pdfDoc.addPage([297, 210]);

  for (const [index, imagePath] of imagePaths.entries()) {
    const image = await fs.promises.readFile(imagePath);

    // Embed the image into the PDF document.
    const imageEmbed = await pdfDoc.embedJpg(image);
    const padding = 3;

    // Scale the image to fit within the page dimensions while preserving aspect ratio.
    let { width, height } = imageEmbed.scaleToFit(
      page.getWidth() / 3 - padding,
      page.getHeight() - padding,
    );
    width -= padding;
    height -= padding;

    // Draw the image on the PDF page.
    let x = padding + (index * page.getWidth()) / 3;
    let y = page.getHeight() / 2 - height / 2;
    page.drawImage(imageEmbed, {
      x, // Center the image horizontally.
      y, // Center the image vertically.
      width,
      height,
      color: rgb(0, 0, 0), // Set the image color to black.
    });
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    page.drawText(path.basename(imagePath), {
      x: x + padding,
      y: y + padding,
      size: 6,
    });
  }
}

function splitIntoChunks(list: [], chunkSize = 10) {
  return [...Array(Math.ceil(list.length / chunkSize))].map((_) =>
    list.splice(0, chunkSize),
  );
}

async function main() {
  try {
    // Create a new PDF document.
    const pdfDoc = await PDFDocument.create();

    let imageFolder = "/Users/depidsvy/dev/print-images-to-pdf/input";
    let files = fs.readdirSync(imageFolder);
    files = files
      .filter((file: string) => !file.startsWith("."))
      .map((file: string) => path.join(imageFolder, file));
    console.log("files", files.length);
    const pages = splitIntoChunks(files, 3);
    console.log("pages", pages);
    for await (const pageImages of pages) {
      // Call the conversion function with input and output file paths.
      await convertImageToPdf(pdfDoc, pageImages);
    }
    // Save the PDF document as bytes.
    const pdfBytes = await pdfDoc.save();

    // Write the PDF bytes to a file asynchronously.
    const pdfPath = "output.pdf";
    await fs.promises.writeFile(pdfPath, pdfBytes);
    console.log("Image converted to PDF successfully!", pages.length, "pages");
  } catch (e) {
    console.error("Error converting image to PDF:", e);
  }
}

main();
