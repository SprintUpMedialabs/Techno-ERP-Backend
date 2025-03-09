import { JWT } from 'google-auth-library';

import { GOOGLE_SA_CLIENT_EMAIL, GOOGLE_SA_PRIVATE_KEY } from '../../secrets';

let privateKey = GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n');

export const googleAuth = new JWT(
  GOOGLE_SA_CLIENT_EMAIL,
  undefined,
  privateKey,
  'https://www.googleapis.com/auth/spreadsheets'
);
