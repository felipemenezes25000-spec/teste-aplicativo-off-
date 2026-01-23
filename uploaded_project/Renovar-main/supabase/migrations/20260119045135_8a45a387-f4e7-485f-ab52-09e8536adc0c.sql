-- Add Mercado Pago columns to payments table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS mercadopago_payment_id text,
ADD COLUMN IF NOT EXISTS mercadopago_preference_id text,
ADD COLUMN IF NOT EXISTS checkout_url text,
ADD COLUMN IF NOT EXISTS qr_code text,
ADD COLUMN IF NOT EXISTS qr_code_base64 text,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_mercadopago_payment_id ON public.payments(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_mercadopago_preference_id ON public.payments(mercadopago_preference_id);