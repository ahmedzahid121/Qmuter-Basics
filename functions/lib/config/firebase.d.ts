import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
export declare const db: admin.firestore.Firestore;
export { admin };
export { functions };
export declare const getEnvVar: (key: string) => string;
export declare const isProduction: () => boolean;
export declare const getRegion: () => string;
//# sourceMappingURL=firebase.d.ts.map