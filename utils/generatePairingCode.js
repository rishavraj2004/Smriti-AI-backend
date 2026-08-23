import Patient from "../models/Patient.js";

const generateRandomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "SMR-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default async function generatePairingCode() {
  let code;
  let exists = true;
  while (exists) {
    code = generateRandomCode();
    exists = await Patient.exists({ pairingCode: code });
  }
  return code;
}
