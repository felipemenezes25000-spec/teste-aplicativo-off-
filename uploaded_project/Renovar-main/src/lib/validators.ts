/**
 * Validates a Brazilian CPF number using the check digit algorithm
 * @param cpf - CPF string (can be formatted or just digits)
 * @returns true if valid, false otherwise
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-digits
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Must have exactly 11 digits
  if (cleanCpf.length !== 11) {
    return false;
  }
  
  // Check for known invalid patterns (all same digits)
  const invalidPatterns = [
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
  ];
  
  if (invalidPatterns.includes(cleanCpf)) {
    return false;
  }
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCpf.charAt(9))) {
    return false;
  }
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCpf.charAt(10))) {
    return false;
  }
  
  return true;
}

/**
 * Calculates age from a birth date string
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @returns age in years
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validates if a person is at least the minimum age
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @param minAge - Minimum required age (default: 18)
 * @returns true if person is at least minAge years old
 */
export function validateMinimumAge(birthDate: string, minAge: number = 18): boolean {
  if (!birthDate) return false;
  
  const age = calculateAge(birthDate);
  return age >= minAge;
}

/**
 * Formats a CPF number to the standard format (000.000.000-00)
 * @param value - CPF string (digits only or partially formatted)
 * @returns formatted CPF string
 */
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '');
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

/**
 * Formats a phone number to Brazilian format
 * @param value - Phone string
 * @returns formatted phone string
 */
export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

/**
 * Formats a CEP (Brazilian postal code) to standard format
 * @param value - CEP string
 * @returns formatted CEP string
 */
export function formatCEP(value: string): string {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{5})(\d{0,3})/, '$1-$2').slice(0, 9);
}

/**
 * Interface for ViaCEP API response
 */
export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Fetches address data from ViaCEP API
 * @param cep - CEP string (8 digits)
 * @returns Address data or null if not found/error
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    return null;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data: ViaCepResponse = await response.json();
    
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch (error) {
    // Log error but don't show toast - this is a background operation
    if (import.meta.env.DEV) {
      console.error('Error fetching CEP:', error);
    }
    return null;
  }
}
