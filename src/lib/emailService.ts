import { getAuth } from 'firebase/auth';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  event?: 'portal_invite' | 'password_reset' | 'milestone_notice' | 'general';
  portalLink?: string;
}

export async function sendNotificationEmail(options: SendEmailOptions): Promise<{ success: boolean; message?: string }> {
  try {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Sesión no autenticada. Inicia sesión para enviar notificaciones.');
    }
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(options)
    });
    const data = await res.json();
    return { success: !!data.success, message: data.message || (data.simulated ? 'Notificación registrada' : 'Correo enviado') };
  } catch (err: any) {
    console.error('Error calling /api/send-email:', err);
    return { success: false, message: err?.message || 'Error de conexión' };
  }
}

export function buildPortalInviteHtml(portalName: string, clientName: string, portalUrl: string, expiresAt?: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b1329; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background-color: #022c22; padding: 24px; text-align: center; border-bottom: 1px solid #065f46;">
        <h1 style="color: #34d399; margin: 0; font-size: 22px;">Industrial Control 360</h1>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Acceso Seguro a Portal Cliente</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Estimado(a) ${clientName},</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Se ha habilitado un enlace de supervisión e inspección técnica para el portal <strong>"${portalName}"</strong>.
        </p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          A través de este portal cifrado podrá consultar el avance de la obra, curvas de avance, estatus de permisos SIHO-A y dossier técnico en tiempo real.
        </p>
        ${expiresAt ? `<p style="color: #f59e0b; font-size: 12px; background: #451a03; padding: 10px; border-radius: 8px;">⏰ Nota de seguridad: Este enlace de acceso es válido hasta el <strong>${new Date(expiresAt).toLocaleDateString()}</strong>.</p>` : ''}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${portalUrl}" style="background-color: #10b981; color: #022c22; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; display: inline-block;">
            Acceder al Portal Cliente
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">Si no solicitó este acceso o requiere soporte técnico, comuníquese con el Administrador de la Obra.</p>
      </div>
    </div>
  `;
}
