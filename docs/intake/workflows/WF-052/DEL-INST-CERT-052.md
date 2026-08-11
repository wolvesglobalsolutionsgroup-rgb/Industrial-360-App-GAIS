# Plantilla HTML — DEL-INST-CERT-052.html

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Certificado de Calibración — DEL-INST-CERT-052</title>
<style>
  :root { --brand-primary: #1e3a8a; --brand-secondary: #0284c7; }
  body { font-family: Arial, sans-serif; margin: 30px; color: #0f172a; }
  .header { display: flex; justify-content: space-between; border-bottom: 3px solid var(--brand-primary); padding-bottom: 10px; }
  .title { font-size: 20px; font-weight: bold; color: var(--brand-primary); }
  .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .table th, .table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
  .table th { background: #f1f5f9; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">CERTIFICADO DE CALIBRACIÓN DE EQUIPO MULTIGAS</div>
      <div>Código: DEL-INST-CERT-052 | ISO 17025</div>
    </div>
  </div>
  <table class="table">
    <tr><th>Serial Equipo:</th><td>{{equipoSerial}}</td><th>Marca / Modelo:</th><td>{{marcaModelo}}</td></tr>
    <tr><th>Laboratorio:</th><td>{{laboratorioCertificado}}</td><th>Fecha Calibración:</th><td>{{fechaCalibracion}}</td></tr>
    <tr><th>Fecha Vencimiento:</th><td>{{fechaVencimiento}}</td><th>Estatus:</th><td>VIGENTE</td></tr>
  </table>
  <h3>Resultados de Inyección de Gas Patrón</h3>
  <table class="table">
    <thead><tr><th>Gas Target</th><th>Concentración Patrón</th><th>Lectura Obtenida</th><th>Error %</th><th>Resultado</th></tr></thead>
    <tbody>
      <tr><td>Oxígeno (O2)</td><td>20.9 % v/v</td><td>{{lecturaO2}} % v/v</td><td>&lt; 1.0%</td><td>APROBADO</td></tr>
      <tr><td>Explosividad (LEL)</td><td>50.0 % LEL</td><td>{{lecturaLel}} % LEL</td><td>&lt; 1.5%</td><td>APROBADO</td></tr>
      <tr><td>Sulfhídrico (H2S)</td><td>25.0 ppm</td><td>{{lecturaH2s}} ppm</td><td>&lt; 1.0%</td><td>APROBADO</td></tr>
      <tr><td>Monóxido (CO)</td><td>100.0 ppm</td><td>{{lecturaCo}} ppm</td><td>&lt; 1.0%</td><td>APROBADO</td></tr>
    </tbody>
  </table>
</body>
</html>

```
