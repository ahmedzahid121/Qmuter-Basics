import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

export class EmailVerificationService {
  private static readonly CODE_LENGTH = 6;
  private static readonly CODE_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * Generate a random 6-digit verification code
   */
  private static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send verification code to email (in a real app, this would use a service like SendGrid)
   */
  private static async sendVerificationEmail(email: string, code: string): Promise<void> {
    // In a real implementation, you would use a service like SendGrid, AWS SES, or Firebase Functions
    // For now, we'll just log the code to the console
    console.log(`📧 Verification code for ${email}: ${code}`);
    
    // TODO: Replace with actual email service
    // Example with SendGrid:
    // await sgMail.send({
    //   to: email,
    //   from: 'noreply@qmuter.com',
    //   subject: 'Verify your Qmuter account',
    //   text: `Your verification code is: ${code}`,
    //   html: `<p>Your verification code is: <strong>${code}</strong></p>`
    // });
  }

  /**
   * Create and send a verification code
   */
  static async sendVerificationCode(email: string): Promise<void> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);
    
    const verificationData: VerificationCode = {
      email,
      code,
      expiresAt,
      attempts: 0
    };

    // Store the verification code in Firestore
    const verificationRef = doc(db, 'verificationCodes', email);
    await setDoc(verificationRef, verificationData);

    // Send the email
    await this.sendVerificationEmail(email, code);
  }

  /**
   * Verify the code entered by the user
   */
  static async verifyCode(email: string, code: string): Promise<boolean> {
    const verificationRef = doc(db, 'verificationCodes', email);
    const verificationDoc = await getDoc(verificationRef);

    if (!verificationDoc.exists()) {
      return false;
    }

    const verificationData = verificationDoc.data() as VerificationCode;

    // Check if code has expired
    if (new Date() > verificationData.expiresAt.toDate()) {
      await deleteDoc(verificationRef);
      return false;
    }

    // Check if max attempts exceeded
    if (verificationData.attempts >= this.MAX_ATTEMPTS) {
      await deleteDoc(verificationRef);
      return false;
    }

    // Increment attempts
    await setDoc(verificationRef, {
      ...verificationData,
      attempts: verificationData.attempts + 1
    });

    // Check if code matches
    if (verificationData.code === code) {
      // Delete the verification code after successful verification
      await deleteDoc(verificationRef);
      return true;
    }

    return false;
  }

  /**
   * Check if an email has a pending verification code
   */
  static async hasPendingVerification(email: string): Promise<boolean> {
    const verificationRef = doc(db, 'verificationCodes', email);
    const verificationDoc = await getDoc(verificationRef);

    if (!verificationDoc.exists()) {
      return false;
    }

    const verificationData = verificationDoc.data() as VerificationCode;
    
    // Check if code has expired
    if (new Date() > verificationData.expiresAt.toDate()) {
      await deleteDoc(verificationRef);
      return false;
    }

    return true;
  }

  /**
   * Resend verification code
   */
  static async resendVerificationCode(email: string): Promise<void> {
    // Delete any existing verification code
    const verificationRef = doc(db, 'verificationCodes', email);
    await deleteDoc(verificationRef);

    // Send new verification code
    await this.sendVerificationCode(email);
  }
} 