// src/components/ReportButton.tsx
import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Props = {
  patientName?: string;
  imageSrc: string; // original image URL or dataURL
  prediction: string;
  probability: number; // 0..1
  gradcamSrc?: string; // dataURL of Grad-CAM overlay
  notes?: string;
};

export default function ReportButton({
  patientName = "Anonymous",
  imageSrc,
  prediction,
  probability,
  gradcamSrc,
  notes = "",
}: Props) {
  const hiddenRef = useRef<HTMLDivElement | null>(null);

  const generatePdf = async () => {
    if (!hiddenRef.current) return;
    // make hiddenRef visible for rendering or ensure width
    const element = hiddenRef.current;
    // html2canvas to produce image
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/jpeg", 0.9);
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // add image scaled to fit width
    const imgProps = (pdf as any).getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    const imgWidth = pageWidth - 40;
    const imgHeight = imgWidth / ratio;
    pdf.addImage(imgData, "JPEG", 20, 20, imgWidth, imgHeight);
    pdf.setFontSize(11);
    pdf.text(`Patient: ${patientName}`, 30, imgHeight + 50);
    pdf.text(`Prediction: ${prediction} (${(probability * 100).toFixed(1)}%)`, 30, imgHeight + 70);
    pdf.text(`Date: ${new Date().toLocaleString()}`, 30, imgHeight + 90);
    if (notes) {
      pdf.text("Notes:", 30, imgHeight + 110);
      pdf.text(notes, 30, imgHeight + 130, { maxWidth: pageWidth - 60 });
    }

    pdf.save(`EyeAnalyzer_Report_${new Date().toISOString()}.pdf`);
  };

  return (
    <>
      <div style={{ display: "none", width: 800 }} ref={hiddenRef}>
        <div style={{ padding: 18, fontFamily: "Inter, Arial" }}>
          <h2>EyeAnalyzer Report</h2>
          <p><strong>Patient:</strong> {patientName}</p>
          <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 360 }}>
              <img src={imageSrc} alt="scan" style={{ width: "100%", maxHeight: 400, objectFit: "contain" }} />
            </div>
            {gradcamSrc && (
              <div style={{ width: 360 }}>
                <p><strong>Grad-CAM</strong></p>
                <img src={gradcamSrc} alt="gradcam" style={{ width: "100%", maxHeight: 400, objectFit: "contain" }} />
              </div>
            )}
          </div>
          <hr />
          <p><strong>Prediction:</strong> {prediction}</p>
          <p><strong>Confidence:</strong> {(probability*100).toFixed(1)}%</p>
          {notes && <p><strong>Notes:</strong> {notes}</p>}
        </div>
      </div>

      <button
        onClick={generatePdf}
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Download PDF Report
      </button>
    </>
  );
}
