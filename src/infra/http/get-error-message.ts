import { ApiError, isApiError } from '@/infra/http/api-error';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OTP_INVALID: 'Código inválido. Confira o código e tente novamente.',
  OTP_EXPIRED: 'O código expirou. Solicite um novo código.',
  OTP_RESEND_COOLDOWN: 'Aguarde alguns segundos para reenviar o código.',
  OTP_SEND_FAILED: 'Não foi possível enviar o código. Tente novamente.',
  OTP_TOKEN_INVALID: 'Não foi possível validar o código. Solicite um novo código.',
  OTP_TOKEN_EXPIRED: 'O código expirou. Solicite um novo código.',
  OTP_TOKEN_MISMATCH: 'O telefone não confere com a verificação.',
  EMAIL_NOT_VERIFIED: 'Confirme seu e-mail para usar esta opção.',
  EMAIL_REQUIRED: 'Informe seu e-mail.',
  RESET_TOKEN_INVALID: 'Não foi possível validar a recuperação. Solicite um novo código.',
  RESET_TOKEN_EXPIRED: 'A recuperação expirou. Solicite um novo código.',
  USER_NOT_FOUND: 'Não encontramos uma conta com esses dados.',
  IDENTIFIER_REQUIRED: 'Informe seu e-mail ou telefone.',
  PASSWORD_TOO_SHORT: 'A nova senha deve ter pelo menos 8 caracteres.',
  PASSWORD_UNCHANGED: 'A nova senha deve ser diferente da senha atual.',
  INVALID_CREDENTIALS: 'Credenciais inválidas. Confira os dados e tente novamente.',
  PHONE_INVALID: 'Número de telefone inválido.',
  PHONE_REQUIRED: 'Informe seu número de telefone.',
  PHONE_TAKEN: 'Este telefone já está vinculado a outra conta.',
  EMAIL_TAKEN: 'Este e-mail já está cadastrado.',
  CPF_TAKEN: 'Este CPF já está vinculado a outra conta.',
  BIRTH_DATE_INVALID: 'Data de nascimento inválida.',
  FULL_NAME_INVALID: 'Informe seu nome completo.',
  GOOGLE_SESSION_MISSING: 'Não foi possível concluir o login com o Google.',
  GOOGLE_SIGN_IN_FAILED: 'Não foi possível entrar com o Google. Tente novamente.',
  APPLE_SESSION_MISSING: 'Não foi possível concluir o login com a Apple.',
  APPLE_SIGN_IN_FAILED: 'Não foi possível entrar com a Apple. Tente novamente.',
  AI_NOT_CONFIGURED: 'O Otto IA ainda não está configurado. Tente novamente em instantes.',
  AI_PROVIDER_ERROR: 'Não foi possível obter uma resposta do Otto IA. Tente novamente.',
  CONVERSATION_NOT_FOUND: 'Conversa não encontrada.',
  AI_MESSAGE_EMPTY: 'Digite uma mensagem para o Otto.',
  AI_MESSAGE_TOO_LONG: 'A mensagem é longa demais. Tente um texto mais curto.',
};

/** Mensagem amigável para Alert — inclui falha de rede. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    return AUTH_ERROR_MESSAGES[error.code] ?? error.message;
  }

  if (error instanceof TypeError || (error instanceof Error && /network|fetch/i.test(error.message))) {
    return 'Sem conexão com a API. Confira se a otto-api está rodando.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export { ApiError, isApiError };
