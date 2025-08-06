export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  STRIPE = 'stripe',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REQUIRES_ACTION = 'requires_action',
}