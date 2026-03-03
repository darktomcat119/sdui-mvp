import { Injectable } from '@nestjs/common';
import { Determination } from '../determinations/entities/determination.entity';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  generateDictamen(determination: Determination): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const taxpayer = determination.taxpayer;
      const clasificacion = determination.clasificacion;
      const itd = Number(determination.itd);
      const cuotaSdui = Number(determination.cuotaSdui);
      const cuotaBaseLegal = Number(determination.cuotaBaseLegal);
      const variacionPct = Number(determination.variacionPct);

      // Header
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text('DICTAMEN DE DETERMINACION TECNICA', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text('Sistema de Determinacion Unificada Integral (SDUI)', {
        align: 'center',
      });
      doc.moveDown(1);

      // Separator
      doc
        .moveTo(72, doc.y)
        .lineTo(540, doc.y)
        .stroke();
      doc.moveDown(1);

      // Metadata
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('DATOS DEL DICTAMEN', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica');
      doc.text(`Folio: ${determination.id.slice(0, 8).toUpperCase()}`);
      doc.text(`Fecha de generacion: ${new Date().toLocaleDateString('es-MX')}`);
      doc.text(`Ejercicio fiscal: ${determination.ejercicioFiscal}`);
      doc.text(`Estatus: ${determination.estatus.toUpperCase()}`);
      doc.moveDown(1);

      // Taxpayer info
      doc.font('Helvetica-Bold');
      doc.text('DATOS DEL CONTRIBUYENTE', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica');
      if (taxpayer) {
        doc.text(`Razon social: ${taxpayer.razonSocial}`);
        doc.text(`RFC: ${taxpayer.rfc || 'No registrado'}`);
        doc.text(`Tipo de personalidad: ${taxpayer.tipoPersonalidad}`);
        doc.text(`Tipo de tramite: ${taxpayer.tipoTramite}`);
        doc.text(`Tipo de contribuyente: ${taxpayer.tipoContribuyente}`);
        doc.text(`Superficie (m2): ${Number(taxpayer.superficieM2).toLocaleString('es-MX')}`);
        doc.text(`SCIAN: ${taxpayer.scian?.codigoScian || ''} - ${taxpayer.scian?.descripcionScian || ''}`);
        doc.text(`Zona: ${taxpayer.zone?.nombreZona || ''}`);
      }
      doc.moveDown(1);

      // Calculation breakdown
      doc.font('Helvetica-Bold');
      doc.text('DESGLOSE DEL CALCULO ITD', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica');

      const tableData = [
        ['Variable', 'Valor normalizado', 'Ponderacion', 'Producto parcial'],
        [
          'Superficie (V_sup)',
          Number(determination.vSuperficie).toFixed(4),
          Number(determination.pSuperficie).toFixed(4),
          (Number(determination.vSuperficie) * Number(determination.pSuperficie)).toFixed(4),
        ],
        [
          'Zona (V_zona)',
          Number(determination.vZona).toFixed(4),
          Number(determination.pZona).toFixed(4),
          (Number(determination.vZona) * Number(determination.pZona)).toFixed(4),
        ],
        [
          'Giro (V_giro)',
          Number(determination.vGiro).toFixed(4),
          Number(determination.pGiro).toFixed(4),
          (Number(determination.vGiro) * Number(determination.pGiro)).toFixed(4),
        ],
        [
          'Tipo (V_tipo)',
          Number(determination.vTipo).toFixed(4),
          Number(determination.pTipo).toFixed(4),
          (Number(determination.vTipo) * Number(determination.pTipo)).toFixed(4),
        ],
      ];

      // Simple table rendering
      const colWidths = [140, 110, 100, 110];
      const startX = 72;
      let tableY = doc.y;

      for (let row = 0; row < tableData.length; row++) {
        let cellX = startX;
        const isHeader = row === 0;
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);

        for (let col = 0; col < tableData[row].length; col++) {
          doc.text(tableData[row][col], cellX, tableY, {
            width: colWidths[col],
            align: col === 0 ? 'left' : 'right',
          });
          cellX += colWidths[col];
        }
        tableY += 16;
      }

      doc.y = tableY + 8;
      doc.fontSize(10);

      // ITD Result
      doc.font('Helvetica-Bold');
      doc.text(`Indice de Determinacion Tecnica (ITD): ${itd.toFixed(4)}`);
      doc.text(`Clasificacion: ${clasificacion.toUpperCase()}`);
      doc.moveDown(1);

      // Fee calculation
      doc.text('DETERMINACION DE CUOTA', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica');
      doc.text(`Cuota base legal: $${cuotaBaseLegal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      doc.text(`Cuota SDUI determinada: $${cuotaSdui.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      doc.text(`Variacion: ${(variacionPct * 100).toFixed(2)}%`);
      doc.text(`Limite de variacion aplicado: ${(Number(determination.limitePctAplicado) * 100).toFixed(2)}%`);
      doc.moveDown(1);

      // Legal foundation
      doc.font('Helvetica-Bold');
      doc.text('FUNDAMENTO NORMATIVO', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(9);
      doc.text(
        determination.fundamentoNormativo ||
          'La presente determinacion se emite con fundamento en las disposiciones aplicables ' +
            'del marco juridico municipal vigente, en cumplimiento con los lineamientos del ' +
            'Sistema de Determinacion Unificada Integral (SDUI).',
      );
      doc.moveDown(2);

      // Separator
      doc
        .moveTo(72, doc.y)
        .lineTo(540, doc.y)
        .stroke();
      doc.moveDown(0.5);

      // Footer
      doc.fontSize(8).font('Helvetica');
      doc.text(
        'Este documento fue generado automaticamente por el sistema SDUI. ' +
          'La integridad del documento puede verificarse mediante su hash SHA-256.',
        { align: 'center' },
      );

      doc.end();
    });
  }
}
