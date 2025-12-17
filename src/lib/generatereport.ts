// src/lib/generatereport.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PredictionResult {
  predicted_disease: string;
  confidence: number; // 0..1
  probabilities: Record<string, number>;
  heatmap_png_base64?: string;
  // optionally other metadata
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9_\-\.]/gi, "_");
}

function addPageIfNeeded(doc: jsPDF, y: number, marginBottom = 25) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + marginBottom > pageHeight) {
    doc.addPage();
    return 20; // top margin on new page
  }
  return y;
}

// --- CORE PDF GENERATOR (Returns the doc object) ---
function createReportDoc(result: PredictionResult, patientName: string): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const usableWidth = pageWidth - marginLeft * 2;

  const diseaseName = (result.predicted_disease || "Unknown").replace(/_/g, " ").toUpperCase();
  const confidencePct = ((result.confidence ?? 0) * 100).toFixed(1) + "%";
  const nowStr = new Date().toLocaleString();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Clarity Scan Aid — Retinal Diagnostic Report", pageWidth / 2, 18, { align: "center" });

  // Patient details box
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const patientLine = `Patient: ${patientName || "Unknown"}`;
  const dateLine = `Report: ${nowStr}`;
  const modelLine = `Model: Clarity Scan-Aid`;

  doc.setDrawColor(220);
  doc.rect(marginLeft, 24, usableWidth, 18, "S");
  doc.text(patientLine, marginLeft + 4, 30);
  doc.text(dateLine, marginLeft + 4, 35);
  doc.text(modelLine, marginLeft + usableWidth - 40, 30, { align: "right" });

  // Diagnosis short summary
  let cursorY = 24 + 18 + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Diagnosis Summary", marginLeft, cursorY);
  cursorY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Condition: ${diseaseName}`, marginLeft, cursorY);
  doc.text(`Confidence: ${confidencePct}`, marginLeft + usableWidth / 2, cursorY);

  cursorY += 8;

  // Probability table (sorted desc)
  const probs = Object.entries(result.probabilities || {});
  probs.sort((a, b) => b[1] - a[1]);
  const tableBody = probs.map(([k, v]) => [k.replace(/_/g, " "), `${(v * 100).toFixed(2)}%`]);

  addPageIfNeeded(doc, cursorY);
  autoTable(doc, {
    startY: cursorY,
    head: [["Condition", "Probability"]],
    body: tableBody,
    styles: { fontSize: 10 },
    theme: "grid",
    headStyles: { fillColor: [50, 115, 220], textColor: 255 },
    margin: { left: marginLeft, right: marginLeft },
    tableWidth: usableWidth,
  });

  cursorY = (doc as any).lastAutoTable?.finalY ?? cursorY + 10;
  cursorY += 8;

  // Add heatmap if available (safely)
  if (result.heatmap_png_base64) {
    cursorY = addPageIfNeeded(doc, cursorY, 60);
    doc.setFont("helvetica", "bold");
    doc.text("AI Focus Heatmap", marginLeft, cursorY);
    cursorY += 6;

    try {
      // size image to fit half width or 80mm whichever smaller
      const imgMaxWidth = Math.min(usableWidth * 0.6, 100); // mm
      const imgX = marginLeft;
      const imgY = cursorY;
      const imgW = imgMaxWidth;
      const imgH = imgMaxWidth; // square box; image will scale to fit

      doc.addImage("data:image/png;base64," + result.heatmap_png_base64, "PNG", imgX, imgY, imgW, imgH);
      // caption on the right
      const captionX = marginLeft + imgW + 6;
      const captionWidth = usableWidth - imgW - 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const caption = "Red / yellow regions indicate areas the model focused on when making the prediction. Interpret with clinical correlation.";
      const splitCap = doc.splitTextToSize(caption, captionWidth);
      doc.text(splitCap, captionX, imgY + 4);
      cursorY += imgH + 6;
    } catch (err) {
      // image insertion may fail if invalid base64 or memory — log and continue
      console.warn("generateReport: failed to add heatmap image:", err);
      doc.setFontSize(10);
      doc.text("Heatmap image unavailable (error rendering).", marginLeft, cursorY);
      cursorY += 8;
    }
  }

  // Medical explanation (long text wraps & page breaks)
  cursorY = addPageIfNeeded(doc, cursorY, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Medical Explanation", marginLeft, cursorY);
  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const explanation = getDiseaseExplanation(result.predicted_disease);
  const explanationBlocks = doc.splitTextToSize(explanation, usableWidth);
  // write text with page-break handling
  let i = 0;
  while (i < explanationBlocks.length) {
    cursorY = addPageIfNeeded(doc, cursorY, 30);
    const remainingLines = Math.floor((pageHeight - cursorY - 30) / 6); // roughly lines per page
    const slice = explanationBlocks.slice(i, i + remainingLines);
    doc.text(slice, marginLeft, cursorY);
    i += slice.length;
    cursorY += slice.length * 6 + 6;
    if (i < explanationBlocks.length) {
      doc.addPage();
      cursorY = 20;
    }
  }

  // Recommendations
  cursorY = addPageIfNeeded(doc, cursorY, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recommendations", marginLeft, cursorY);
  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const recommendations = getRecommendations(result.predicted_disease);
  for (let idx = 0; idx < recommendations.length; idx++) {
    cursorY = addPageIfNeeded(doc, cursorY, 20);
    doc.text(`• ${recommendations[idx]}`, marginLeft + 4, cursorY);
    cursorY += 6;
  }

  // Doctor's notes area (box)
  cursorY = addPageIfNeeded(doc, cursorY, 60);
  cursorY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Doctor's Notes", marginLeft, cursorY);
  cursorY += 6;
  doc.setFont("helvetica", "normal");
  // box for handwritten notes
  const notesHeight = 30;
  doc.rect(marginLeft, cursorY, usableWidth, notesHeight);
  cursorY += notesHeight + 8;

  // Footer (disclaimer + page number)
  const footerText =
    "Disclaimer: This AI-generated report is for screening purposes only and should not replace professional medical diagnosis.";
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(hyphenateMiddle(footerText, pageWidth - 40), pageWidth / 2, pageHeight - 18, { align: "center", maxWidth: pageWidth - 40 });

  // Page numbers for multi-page documents
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Page ${p} / ${pageCount}`, pageWidth - marginLeft, pageHeight - 8, { align: "right" });
  }
  
  return doc;
}

// --- ORIGINAL DOWNLOAD FUNCTION ---
export function generateReport(result: PredictionResult, patientName: string) {
  const doc = createReportDoc(result, patientName);
  const filename = `AI_Retina_Report_${sanitizeFilename(patientName || "patient")}_${new Date().toISOString().slice(0,19).replace(/[:]/g,'-')}.pdf`;
  doc.save(filename);
}

// --- NEW SHARE FUNCTION ---
export async function shareReport(result: PredictionResult, patientName: string): Promise<boolean> {
  const doc = createReportDoc(result, patientName);
  const filename = `Report_${sanitizeFilename(patientName)}.pdf`;
  
  // Convert PDF to Blob
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: "application/pdf" });

  // Try Native Sharing
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Eye Scan Report',
        text: `Medical analysis report for ${patientName}.`
      });
      return true;
    } catch (error) {
      console.error("Sharing failed", error);
      return false;
    }
  } else {
    // Fallback to download if sharing not supported
    doc.save(filename);
    return false;
  }
}

/* helper: small function to split long footer nicely */
function hyphenateMiddle(text: string, maxWidth: number) {
  // jsPDF will handle wrapping via text option, but we already pass maxWidth when drawing
  return text;
}

/* ---- disease explanations & recommendations (customize as needed) ---- */
function getDiseaseExplanation(disease: string): string {
  switch ((disease || "").toLowerCase()) {
    case "cataract":
      return "Cataract causes clouding of the lens, leading to blurry vision. It often develops gradually and can affect one or both eyes. Symptoms may include faded colors, glare, difficulty with night vision, or double vision in one eye.";
    case "glaucoma":
      return "Glaucoma involves damage to the optic nerve, commonly associated with elevated intraocular pressure. It may progress silently until significant vision loss occurs. Early detection and treatment are important to prevent irreversible vision damage.";
    case "diabetic_retinopathy":
    case "diabetic retinopathy":
      return "Diabetic retinopathy results from chronic high blood glucose damaging the small blood vessels in the retina. It can cause microaneurysms, hemorrhages, exudates and in advanced stages, macular edema or neovascularization which threaten vision.";
    case "normal":
      return "No significant abnormalities were detected on this retinal scan. The model did not find features strongly associated with the covered retinal conditions. Continue routine eye care and follow-up as recommended.";
    default:
      return "The model detected features that may be associated with retinal irregularities. This report is intended as a screening aid — clinical correlation and a full ophthalmic exam are recommended to confirm any findings.";
  }
}

function getRecommendations(disease: string): string[] {
  switch ((disease || "").toLowerCase()) {
    case "cataract":
      return [
        "Refer to an ophthalmologist for confirmatory exam and surgical evaluation if vision is impaired.",
        "Use appropriate lighting and anti-glare eyewear for daily tasks.",
        "Manage systemic risk factors (e.g., diabetes) and avoid smoking.",
      ];
    case "glaucoma":
      return [
        "Urgent ophthalmology referral for pressure measurement and optic nerve assessment.",
        "Initiate/adhere to pressure-lowering therapy as prescribed.",
        "Schedule regular follow-ups with visual field and OCT testing.",
      ];
    case "diabetic_retinopathy":
    case "diabetic retinopathy":
      return [
        "Tight glycemic and blood-pressure control are essential.",
        "Urgent retinal specialist referral for detailed fundus exam and possible treatment (laser/anti-VEGF) if indicated.",
        "Regular diabetic eye screenings every 3–12 months depending on severity.",
      ];
    case "normal":
      return [
        "Maintain routine eye examinations according to age and risk factors.",
        "Wear sunglasses that block UV rays when outdoors.",
        "Follow general health measures: balanced diet, hydration, and controlling systemic diseases.",
      ];
    default:
      return ["Refer to an ophthalmologist for a full clinical evaluation."];
  }
}
