# Plantilla Formal de Vista Previa Documental y Co-Branding: DEL-INST-CERT-052

**ID Entregable**: `DEL-INST-CERT-052`  
**Título Oficial**: Certificado de Calibración de Instrumentos y Prueba de Lazos P&ID  
**Estructura de Co-Branding**: Logo Operador (Izquierda) + Logo Contratista (Derecha)

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CERTIFICADO DE CALIBRACIÓN DE INSTRUMENTOS Y PRUEBA DE LAZOS P&ID</title>
    <style>
        :root {
            --brand-primary: #1e3a8a;
            --brand-secondary: #0284c7;
            --brand-bg-header: #e2e8f0;
            --brand-text: #0f172a;
            --border-color: #000000;
            --border-thin: 1px solid var(--border-color);
            --font-main: Arial, Helvetica, sans-serif;
        }
        body { font-family: var(--font-main); font-size: 8px; color: var(--brand-text); background-color: #f1f5f9; padding: 10px; }
        .cert-container { width: 210mm; min-height: 297mm; background: #ffffff; margin: 0 auto; padding: 8mm; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        table { width: 100%; border-collapse: collapse; margin-bottom: -1px; }
        td, th { border: var(--border-thin); padding: 3px 4px; vertical-align: middle; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .section-title { background-color: var(--brand-bg-header); font-weight: bold; font-size: 8.5px; padding: 3px; border: var(--border-thin); margin-top: -1px; }
        @media print {
            body { background: none; padding: 0; }
            .cert-container { box-shadow: none; border: none; width: 100%; padding: 0; }
        }
    </style>
</head>
<body>
<div class="cert-container">
    <table>
        <tr>
            <td width="20%" class="text-center">
                <img src="logo_operador.png" alt="Logo Operador" style="max-height: 40px;">
            </td>
            <td width="60%" class="text-center">
                <div style="font-size: 10px; font-weight: bold; color: var(--brand-primary);">CONTROL DE CALIDAD Y ASEGURAMIENTO (QA/QC)</div>
                <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">CERTIFICADO DE CALIBRACIÓN DE INSTRUMENTOS Y PRUEBA DE LAZOS P&ID</div>
            </td>
            <td width="20%" class="text-center">
                <img src="logo_contratista.png" alt="Logo Contratista" style="max-height: 40px;">
            </td>
        </tr>
    </table>

    <div class="section-title">1. IDENTIFICACIÓN DEL INSTRUMENTO Y LAZO DE CONTROL</div>
    <table>
        <tr>
            <td width="25%"><b>TAG INSTRUMENTO:</b> PT-101A</td>
            <td width="25%"><b>TAG LAZO:</b> LOOP-101</td>
            <td width="25%"><b>PLANO P&ID:</b> P&ID-SJ-101-REV2</td>
            <td width="25%"><b>TIPO:</b> Transmisor de Presión (PT)</td>
        </tr>
        <tr>
            <td><b>RANGO OPERATIVO:</b> 0 a 100 PSI</td>
            <td><b>TOLERANCIA PERMISIBLE:</b> ±0.5% FS</td>
            <td><b>TIPO SEÑAL:</b> 4-20mA HART</td>
            <td><b>ÁREA CLASIFICADA (IR-E-01):</b> Clase I, Div 1, Grupo D (Ex-d)</td>
        </tr>
    </table>

    <div class="section-title">2. RESULTADOS DE CALIBRACIÓN Y ENSAYO DE 5 PUNTOS (ISA 20)</div>
    <table>
        <thead>
            <tr style="background-color: var(--brand-bg-header);" class="bold text-center">
                <td width="15%">PUNTO (%)</td>
                <td width="20%">VALOR TEÓRICO</td>
                <td width="20%">LECTURA ASCENDENTE</td>
                <td width="20%">LECTURA DESCENDENTE</td>
                <td width="15%">ERROR MÁX (%FS)</td>
                <td width="10%">DICTAMEN</td>
            </tr>
        </thead>
        <tbody class="text-center">
            <tr><td>0 %</td><td>0.00 PSI (4.00 mA)</td><td>0.01 PSI</td><td>0.01 PSI</td><td>0.01 %</td><td>CONFORME</td></tr>
            <tr><td>25 %</td><td>25.00 PSI (8.00 mA)</td><td>25.05 PSI</td><td>25.08 PSI</td><td>0.08 %</td><td>CONFORME</td></tr>
            <tr><td>50 %</td><td>50.00 PSI (12.00 mA)</td><td>50.10 PSI</td><td>50.12 PSI</td><td>0.12 %</td><td>CONFORME</td></tr>
            <tr><td>75 %</td><td>75.00 PSI (16.00 mA)</td><td>75.15 PSI</td><td>75.18 PSI</td><td>0.18 %</td><td>CONFORME</td></tr>
            <tr><td>100 %</td><td>100.00 PSI (20.00 mA)</td><td>100.20 PSI</td><td>100.22 PSI</td><td>0.20 %</td><td>CONFORME</td></tr>
        </tbody>
    </table>

    <div class="section-title">3. PATRÓN DE CALIBRACIÓN E INSPECCIÓN DE CAMPO</div>
    <table>
        <tr>
            <td width="50%"><b>EQUIPO PATRÓN UTILIZADO:</b> Calibrador de Presión Fluke 718 (Serial: FLK-98421)</td>
            <td width="50%"><b>VENCIMIENTO CERTIFICADO PATRÓN:</b> 2027-02-15</td>
        </tr>
        <tr>
            <td><b>SELLO ANTIEXPLOSIVO (PDVSA IR-E-01):</b> Inspeccionado y Conforme (Ex-d)</td>
            <td><b>CONEXIONADO TUBING / MANIFOLD:</b> Sin fugas (Prueba 100 PSI)</td>
        </tr>
    </table>

    <div class="section-title">4. REGISTRO DE APROBACIÓN Y FIRMAS DIGITALES</div>
    <table>
        <tr class="text-center bold">
            <td width="33%">TÉCNICO ESPECIALISTA I&C</td>
            <td width="33%">INSPECTOR QA/QC INSTRUMENTACIÓN</td>
            <td width="34%">CUSTODIO OPERATIVO DE PLANTA / DCS</td>
        </tr>
        <tr style="height: 45px; vertical-align: bottom;" class="text-center">
            <td>
                ____________________________<br>
                Nombre: Ing. Carlos Mendoza<br>
                C.I.: V-16.842.105<br>
                <span style="font-size: 7px; color: green;"><b>Firmado Digitalmente (Hash SHA-256)</b></span>
            </td>
            <td>
                ____________________________<br>
                Nombre: Ing. Roberto Silva<br>
                C.I.: V-14.201.993<br>
                <span style="font-size: 7px; color: green;"><b>Firmado Digitalmente (Hash SHA-256)</b></span>
            </td>
            <td>
                ____________________________<br>
                Nombre: Ing. Gustavo Morales<br>
                C.I.: V-12.504.118<br>
                <span style="font-size: 7px; color: green;"><b>Firmado Digitalmente (Hash SHA-256)</b></span>
            </td>
        </tr>
    </table>
</div>
</body>
</html>
```
