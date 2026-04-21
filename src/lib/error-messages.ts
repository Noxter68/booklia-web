/**
 * Translate API error messages to user-friendly French messages
 */

const ERROR_TRANSLATIONS: Record<string, string> = {
  // Auth errors
  'Unauthorized': 'Vous devez être connecté pour effectuer cette action',
  'Invalid token': 'Votre session a expiré, veuillez vous reconnecter',
  'Token expired': 'Votre session a expiré, veuillez vous reconnecter',
  'Invalid credentials': 'Email ou mot de passe incorrect',
  'User not found': 'Utilisateur introuvable',
  'Email already exists': 'Cette adresse email est déjà utilisée',
  'Email already in use': 'Cette adresse email est déjà utilisée',

  // Booking errors
  'Booking not found': 'Réservation introuvable',
  'Booking must be PENDING to accept': 'Cette réservation ne peut plus être acceptée',
  'Booking must be PENDING to reject': 'Cette réservation ne peut plus être refusée',
  'Booking must be ACCEPTED to complete': 'Cette réservation doit d\'abord être acceptée',
  'Cannot cancel a completed or already canceled booking': 'Cette réservation ne peut plus être annulée',
  'You are not part of this booking': 'Vous n\'avez pas accès à cette réservation',
  'You do not have access to this booking': 'Vous n\'avez pas accès à cette réservation',
  'Only the provider can reject a booking': 'Seul le prestataire peut refuser cette réservation',
  'Only the requester can delete this booking': 'Seul le demandeur peut supprimer cette réservation',
  'Only canceled bookings can be deleted': 'Seules les réservations annulées peuvent être supprimées',
  'You cannot book your own service': 'Vous ne pouvez pas réserver votre propre service',

  // Service errors
  'Service not found': 'Service introuvable',
  'Business service not found': 'Service introuvable',
  'Employee not found': 'Employé introuvable',
  'Employee does not belong to this business': 'Cet employé ne fait pas partie de cet établissement',

  // Comment errors
  'Comment not found': 'Commentaire introuvable',
  'You can only delete your own comments': 'Vous ne pouvez supprimer que vos propres commentaires',

  // Business errors
  'Business not found': 'Établissement introuvable',
  'You already have a business': 'Vous avez déjà un établissement',
  'Slug already taken': 'Ce nom d\'URL est déjà utilisé',

  // Generic errors
  'An error occurred': 'Une erreur est survenue',
  'Internal server error': 'Une erreur est survenue sur le serveur',
  'Bad request': 'Requête invalide',
  'Forbidden': 'Vous n\'avez pas l\'autorisation d\'effectuer cette action',
  'Not found': 'Ressource introuvable',
  'Upload failed': 'Échec de l\'envoi du fichier',
  'File too large': 'Le fichier est trop volumineux',
  'Invalid file type': 'Type de fichier non autorisé',
};

// HTTP status code messages
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Requête invalide',
  401: 'Vous devez être connecté pour effectuer cette action',
  403: 'Vous n\'avez pas l\'autorisation d\'effectuer cette action',
  404: 'Ressource introuvable',
  409: 'Cette action est en conflit avec l\'état actuel',
  429: 'Trop de requêtes, veuillez réessayer plus tard',
  500: 'Une erreur est survenue sur le serveur',
  502: 'Le serveur est temporairement indisponible',
  503: 'Le service est temporairement indisponible',
};

export function translateError(message: string, statusCode?: number): string {
  // Check exact match first
  if (ERROR_TRANSLATIONS[message]) {
    return ERROR_TRANSLATIONS[message];
  }

  // Check case-insensitive match
  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(ERROR_TRANSLATIONS)) {
    if (key.toLowerCase() === lowerMessage) {
      return value;
    }
  }

  // Check if message contains known error patterns
  for (const [key, value] of Object.entries(ERROR_TRANSLATIONS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // If message looks like it's already in French (contains accented chars), return as is
  if (/[àâäéèêëïîôùûüç]/i.test(message)) {
    return message;
  }

  // Fall back to status code message
  if (statusCode && STATUS_MESSAGES[statusCode]) {
    return STATUS_MESSAGES[statusCode];
  }

  // Default message
  return 'Une erreur est survenue';
}
