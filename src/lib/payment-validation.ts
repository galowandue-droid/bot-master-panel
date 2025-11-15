import { z } from "zod";

export const cryptobotTokenSchema = z
  .string()
  .min(10, "Токен должен содержать минимум 10 символов")
  .regex(/^[0-9]+:[A-Za-z0-9_-]+$/, "Неверный формат токена CryptoBot (ожидается: числа:символы)");

export const cardNumberSchema = z
  .string()
  .regex(/^\d{16}$/, "Номер карты должен содержать 16 цифр");

export const yoomoneyTokenSchema = z
  .string()
  .min(20, "Токен ЮMoney должен содержать минимум 20 символов");

export const telegramStarsTokenSchema = z
  .string()
  .min(10, "Токен должен содержать минимум 10 символов");

export const validatePaymentToken = (systemId: string, value: string): { success: boolean; error?: string } => {
  try {
    switch (systemId) {
      case "cryptobot":
        cryptobotTokenSchema.parse(value);
        break;
      case "cards":
        cardNumberSchema.parse(value);
        break;
      case "yoomoney":
        yoomoneyTokenSchema.parse(value);
        break;
      case "telegram_stars":
        telegramStarsTokenSchema.parse(value);
        break;
      default:
        return { success: true };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Неверный формат" };
  }
};
